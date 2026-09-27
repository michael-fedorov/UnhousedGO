import type { Resource, ResourceType } from '../types/Resource';

const GIS_BASE = 'https://gismap.glendaleca.gov/arcgis/rest/services';

// ---------------------------------------------------------------------------
// Internal ArcGIS response types
// ---------------------------------------------------------------------------

interface ArcGISAttributes {
  OBJECTID?: number;
  [key: string]: unknown;
}

interface PointGeometry {
  x: number;
  y: number;
}

interface PolygonGeometry {
  rings: number[][][];
}

interface ArcGISFeature {
  attributes: ArcGISAttributes;
  geometry: PointGeometry | PolygonGeometry;
}

interface ArcGISResponse {
  features?: ArcGISFeature[];
  error?: { message: string; code: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function queryLayer(serviceUrl: string, layerId: number): Promise<ArcGISFeature[]> {
  const url =
    `${serviceUrl}/${layerId}/query` +
    `?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json&resultRecordCount=200`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

  const json: ArcGISResponse = await res.json();
  if (json.error) throw new Error(`GIS error ${json.error.code}: ${json.error.message}`);

  return json.features ?? [];
}

function buildAddress(...parts: (string | number | null | undefined)[]): string | undefined {
  const joined = parts.filter((p) => p != null && p !== '').join(' ').trim();
  return joined || undefined;
}

// Average all vertices of the outer ring to get the polygon centroid.
function ringCentroid(ring: number[][]): [number, number] {
  const sumX = ring.reduce((s, p) => s + p[0], 0);
  const sumY = ring.reduce((s, p) => s + p[1], 0);
  return [sumX / ring.length, sumY / ring.length];
}

function asString(val: unknown): string {
  return val != null ? String(val) : '';
}

// ---------------------------------------------------------------------------
// Libraries  →  WIFI_OUTLET
// URL: Common/Libraries/FeatureServer/0
// Fields: NAME, ST_NUM, ST_DIR, ST_NAME, ST_TYPE
// ---------------------------------------------------------------------------

export async function fetchLibraries(): Promise<Resource[]> {
  try {
    const features = await queryLayer(`${GIS_BASE}/Common/Libraries/FeatureServer`, 0);

    return features.flatMap((f): Resource[] => {
      const a = f.attributes;
      const geom = f.geometry as PointGeometry;
      if (!geom?.x || !geom?.y) return [];

      const address = buildAddress(a.ST_NUM, a.ST_DIR, a.ST_NAME, a.ST_TYPE);

      return [
        {
          id: `gis-library-${a.OBJECTID ?? Math.random()}`,
          name: asString(a.NAME) || 'Glendale Library',
          type: 'WIFI_OUTLET' as ResourceType,
          coordinates: [geom.x, geom.y],
          address,
          notes: 'Free WiFi, public computers, and power outlets. Climate-controlled.',
        },
      ];
    });
  } catch (err) {
    console.error('[gisApi] fetchLibraries failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Parks  →  RESTROOM
// URL: Common/Parks/FeatureServer/0
// Fields: NAME_ALF, NAMEA_ALF  |  Geometry: Polygon
// No dedicated restroom or water fountain layer exists in the Glendale GIS
// catalog — parks are used as the best available proxy.
// ---------------------------------------------------------------------------

export async function fetchParks(): Promise<Resource[]> {
  try {
    const features = await queryLayer(`${GIS_BASE}/Common/Parks/FeatureServer`, 0);

    return features.flatMap((f): Resource[] => {
      const a = f.attributes;
      const geom = f.geometry as PolygonGeometry;
      if (!geom?.rings?.[0]?.length) return [];

      const [lng, lat] = ringCentroid(geom.rings[0]);
      const address = a.NAMEA_ALF ? asString(a.NAMEA_ALF) : undefined;

      return [
        {
          id: `gis-park-${a.OBJECTID ?? Math.random()}`,
          name: asString(a.NAME_ALF) || 'Glendale Park',
          type: 'RESTROOM' as ResourceType,
          coordinates: [lng, lat],
          address,
          notes: 'Public park. Restrooms and water fountains may be available — amenities vary by location.',
        },
      ];
    });
  } catch (err) {
    console.error('[gisApi] fetchParks failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Bus Stops  →  BUS_STOP
// URL: Common/GlendaleBeeline_BusStops/FeatureServer/0
// Fields: Stop_Numbe, Route, On_Street, At_Street
// ---------------------------------------------------------------------------

export async function fetchBusStops(): Promise<Resource[]> {
  try {
    const features = await queryLayer(`${GIS_BASE}/Common/GlendaleBeeline_BusStops/FeatureServer`, 0);

    return features.flatMap((f): Resource[] => {
      const a = f.attributes;
      const geom = f.geometry as PointGeometry;
      if (!geom?.x || !geom?.y) return [];

      const stopNumbe = a.Stop_Numbe as number | null | undefined;
      const name = stopNumbe != null ? `Stop ${Math.round(stopNumbe)}` : 'Bus Stop';

      const onStreet = asString(a.On_Street);
      const atStreet = asString(a.At_Street);
      const addressParts = [onStreet, atStreet].filter((p) => p !== '');
      const address = addressParts.length > 0
        ? `${addressParts[0]} at ${addressParts[1] ?? ''}`.trim()
        : undefined;

      const route = asString(a.Route);
      const notes = route ? `Routes: ${route}` : undefined;

      return [
        {
          id: `gis-busstop-${a.OBJECTID ?? Math.random()}`,
          name,
          type: 'BUS_STOP' as ResourceType,
          coordinates: [geom.x, geom.y],
          address,
          notes,
        },
      ];
    });
  } catch (err) {
    console.error('[gisApi] fetchBusStops failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Hospitals  →  HOSPITAL
// URL: Common/GlendaleHospitals/FeatureServer/0
// Fields: NAME, ST_NUM, ST_DIR, ST_NAME, ST_TYPE
// ---------------------------------------------------------------------------

export async function fetchHospitals(): Promise<Resource[]> {
  try {
    const features = await queryLayer(`${GIS_BASE}/Common/GlendaleHospitals/FeatureServer`, 0);

    return features.flatMap((f): Resource[] => {
      const a = f.attributes;
      const geom = f.geometry as PointGeometry;
      if (!geom?.x || !geom?.y) return [];

      const address = buildAddress(a.ST_NUM, a.ST_DIR, a.ST_NAME, a.ST_TYPE);

      return [
        {
          id: `gis-hospital-${a.OBJECTID ?? Math.random()}`,
          name: asString(a.NAME) || 'Hospital',
          type: 'HOSPITAL' as ResourceType,
          coordinates: [geom.x, geom.y],
          address,
          notes: 'Emergency services available 24/7.',
        },
      ];
    });
  } catch (err) {
    console.error('[gisApi] fetchHospitals failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Shelters  →  SHELTER
// Source: LA County LMS (layer 158)
// Filters by city name (case-insensitive) OR Glendale ZIP codes so records
// with missing/inconsistent city values are still captured.
// Glendale ZIPs: 91201-91210
// Fields: name, addrln1, city, state, zip, phones, hours, description
// Geometry: esriGeometryPoint with x/y in WGS84
// ---------------------------------------------------------------------------

const GLENDALE_WHERE =
  "UPPER(city) = 'GLENDALE' OR " +
  "zip IN ('91201','91202','91203','91204','91205','91206','91207','91208','91209','91210')";

export async function fetchShelters(): Promise<Resource[]> {
  try {
    const where = encodeURIComponent(GLENDALE_WHERE);
    const url =
      'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/158/query' +
      `?where=${where}&outFields=*&returnGeometry=true&outSR=4326&f=json&resultRecordCount=200`;

    console.log('[gisApi] fetchShelters → fetching:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as {
      features?: { attributes: Record<string, unknown>; geometry: { x: number; y: number } }[];
      error?: { message: string; code: number };
    };

    if (json.error) throw new Error(`ArcGIS error ${json.error.code}: ${json.error.message}`);
    console.log('[gisApi] fetchShelters → raw feature count:', json.features?.length ?? 0);

    return (json.features ?? []).flatMap((f): Resource[] => {
      const a = f.attributes;
      const geom = f.geometry;
      if (!geom?.x || !geom?.y) return [];

      const addrParts = [a.addrln1, a.city, a.state, a.zip].filter(Boolean);
      const address = addrParts.length ? addrParts.join(', ') : undefined;

      return [{
        id: `lacounty-shelter-${a.OBJECTID ?? Math.random()}`,
        name: asString(a.name) || 'Homeless Shelter',
        type: 'SHELTER' as ResourceType,
        coordinates: [geom.x, geom.y],
        address,
        hours: a.hours ? asString(a.hours) : undefined,
        phone: a.phones ? asString(a.phones) : undefined,
        notes: a.description ? asString(a.description) : undefined,
      }];
    });
  } catch (err) {
    console.error('[gisApi] fetchShelters failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Food Banks  →  FOOD
// Source: LA County Food Distribution sites
// URL: services.arcgis.com/.../Food_Distribution_chp/FeatureServer/0
// Fields: food_distrib_name, food_distrib_address, food_distrib_city,
//         food_distrib_zipcode (integer), food_distrib_latitude/longitude
// Geometry: esriGeometryPoint
// ---------------------------------------------------------------------------

// Names come in ALL-CAPS — convert to Title Case for readability.
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const FOOD_GLENDALE_WHERE =
  "UPPER(food_distrib_city) = 'GLENDALE' OR " +
  'food_distrib_zipcode IN (91201,91202,91203,91204,91205,91206,91207,91208,91209,91210)';

export async function fetchFoodBanks(): Promise<Resource[]> {
  try {
    const where = encodeURIComponent(FOOD_GLENDALE_WHERE);
    const url =
      'https://services.arcgis.com/RmCCgQtiZLDCtblq/ArcGIS/rest/services/Food_Distribution_chp/FeatureServer/0/query' +
      `?where=${where}&outFields=*&returnGeometry=true&outSR=4326&f=json&resultRecordCount=200`;

    console.log('[gisApi] fetchFoodBanks → fetching');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as {
      features?: { attributes: Record<string, unknown>; geometry: { x: number; y: number } }[];
      error?: { message: string; code: number };
    };
    if (json.error) throw new Error(`ArcGIS error ${json.error.code}: ${json.error.message}`);
    console.log('[gisApi] fetchFoodBanks → raw count:', json.features?.length ?? 0);

    return (json.features ?? []).flatMap((f): Resource[] => {
      const a = f.attributes;
      const geom = f.geometry;
      if (!geom?.x || !geom?.y) return [];

      const rawName = asString(a.food_distrib_name);
      const name = toTitleCase(rawName) || 'Food Bank';

      const street = asString(a.food_distrib_address);
      const city = asString(a.food_distrib_city);
      const zip = a.food_distrib_zipcode != null ? String(a.food_distrib_zipcode) : '';
      const address = [street, city, zip].filter(Boolean).join(', ') || undefined;

      return [{
        id: `food-${a.OBJECTID ?? Math.random()}`,
        name,
        type: 'FOOD' as ResourceType,
        coordinates: [geom.x, geom.y],
        address,
        notes: 'Food distribution site. Contact location directly for current schedule.',
      }];
    });
  } catch (err) {
    console.error('[gisApi] fetchFoodBanks failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Stubs — no matching layers found in the Glendale GIS catalog
// ---------------------------------------------------------------------------

export async function fetchPublicRestrooms(): Promise<Resource[]> {
  // No dedicated restroom layer in the Glendale GIS catalog.
  // Parks (fetchParks) are used as the closest proxy.
  return [];
}

export async function fetchDrinkingFountains(): Promise<Resource[]> {
  // No drinking fountain layer in the Glendale GIS catalog.
  return [];
}
