// Spatial point query for ArcGIS — returns features whose polygon contains the given point.

export interface HazardStatus {
  level: 'safe' | 'moderate' | 'danger';
  loading: boolean;
  wildfire: string | null;       // "Very High" | "High" | "Moderate" | "NonWildland" | null
  isFloodHazardArea: boolean;    // SFHA_TF === 'T'
  floodZone: string | null;      // FLD_ZONE value e.g. "AE", "X"
  faultZone: boolean;
  liquefaction: boolean;
}

export const DEFAULT_HAZARD_STATUS: HazardStatus = {
  level: 'safe',
  loading: true,
  wildfire: null,
  isFloodHazardArea: false,
  floodZone: null,
  faultZone: false,
  liquefaction: false,
};

async function queryHazardPoint(
  serviceUrl: string,
  lat: number,
  lng: number,
): Promise<Record<string, unknown>[]> {
  try {
    const geometry = JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } });
    const url =
      `${serviceUrl}/query` +
      `?geometryType=esriGeometryPoint` +
      `&geometry=${encodeURIComponent(geometry)}` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&inSR=4326` +
      `&outFields=*` +
      `&f=json`;

    const res = await fetch(url);
    const json = await res.json() as { features?: { attributes: Record<string, unknown> }[] };
    return json.features?.map((f) => f.attributes) ?? [];
  } catch (err) {
    console.error('[hazardApi] queryHazardPoint failed for', serviceUrl, err);
    return [];
  }
}

export async function fetchHazardsAtLocation(lat: number, lng: number): Promise<HazardStatus> {
  console.log(`[hazardApi] fetching hazards at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  try {
    const [wildfireFeatures, floodFeatures, faultFeatures, liquefactionFeatures] =
      await Promise.all([
        queryHazardPoint(
          'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSALRA25_v1_All/FeatureServer/0',
          lat,
          lng,
        ),
        queryHazardPoint(
          'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28',
          lat,
          lng,
        ),
        queryHazardPoint(
          'https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Alquist_Priolo_Fault_Zones/FeatureServer/0',
          lat,
          lng,
        ),
        queryHazardPoint(
          'https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Liquefaction_Zones/FeatureServer/0',
          lat,
          lng,
        ),
      ]);

    const wildfire =
      wildfireFeatures.length > 0 && wildfireFeatures[0].FHSZ_Description != null
        ? String(wildfireFeatures[0].FHSZ_Description)
        : null;

    const floodZone =
      floodFeatures.length > 0 && floodFeatures[0].FLD_ZONE != null
        ? String(floodFeatures[0].FLD_ZONE)
        : null;

    const isFloodHazardArea =
      floodFeatures.length > 0 && floodFeatures[0].SFHA_TF === 'T';

    const faultZone = faultFeatures.length > 0;
    const liquefaction = liquefactionFeatures.length > 0;

    let level: HazardStatus['level'] = 'safe';
    if (wildfire === 'Very High' || isFloodHazardArea || faultZone) {
      level = 'danger';
    } else if (
      wildfire === 'High' ||
      wildfire === 'Moderate' ||
      liquefaction ||
      (floodZone !== null && !isFloodHazardArea)
    ) {
      level = 'moderate';
    }

    console.log(`[hazardApi] result → level=${level} wildfire=${wildfire} flood=${floodZone} fault=${faultZone} liq=${liquefaction}`);
    return {
      level,
      loading: false,
      wildfire,
      isFloodHazardArea,
      floodZone,
      faultZone,
      liquefaction,
    };
  } catch (err) {
    console.error('[hazardApi] fetchHazardsAtLocation failed:', err);
    return { ...DEFAULT_HAZARD_STATUS, loading: false };
  }
}
