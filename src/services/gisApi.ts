// TODO: Replace placeholder layer IDs once Glendale GIS catalog is audited

import type { Resource } from '../types/Resource';

// TODO: Source this from env via react-native-dotenv once configured
const GIS_BASE_URL = 'https://gismap.glendaleca.gov/arcgis/rest/services';

/**
 * Generic ArcGIS REST layer fetcher.
 * Queries a feature layer and maps features to Resource objects.
 * Returns an empty array on any network or parse error.
 */
export async function fetchGisLayer(
  serviceUrl: string,
  layerId: number,
  where: string = '1=1',
): Promise<Resource[]> {
  const query = encodeURIComponent(where);
  const url = `${serviceUrl}/${layerId}/query?where=${query}&outFields=*&f=json&resultRecordCount=200`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[gisApi] fetchGisLayer: HTTP ${response.status} for ${url}`);
      return [];
    }
    const json = await response.json();
    if (!json.features || !Array.isArray(json.features)) {
      console.warn('[gisApi] fetchGisLayer: unexpected response shape', json);
      return [];
    }
    // Caller is responsible for mapping raw features to Resource[]
    // This generic helper returns an empty array until field mappings are known
    console.log(`[gisApi] fetchGisLayer: received ${json.features.length} features from layer ${layerId}`);
    return [];
  } catch (error) {
    console.error('[gisApi] fetchGisLayer error:', error);
    return [];
  }
}

/**
 * Fetch public restroom locations from Glendale GIS.
 * TODO: Identify the correct service path and layer ID from the GIS catalog.
 */
export async function fetchPublicRestrooms(): Promise<Resource[]> {
  console.log('[gisApi] TODO: fetchPublicRestrooms — layer ID not yet identified');
  // Example once layer is known:
  // return fetchGisLayer(`${GIS_BASE_URL}/PublicFacilities/MapServer`, 3);
  void GIS_BASE_URL; // suppress unused variable warning until wired up
  return [];
}

/**
 * Fetch drinking fountain / water access locations from Glendale GIS.
 * TODO: Identify the correct service path and layer ID from the GIS catalog.
 */
export async function fetchDrinkingFountains(): Promise<Resource[]> {
  console.log('[gisApi] TODO: fetchDrinkingFountains — layer ID not yet identified');
  return [];
}

/**
 * Fetch public library locations from Glendale GIS.
 * Libraries often have WiFi, outlets, restrooms, and climate-controlled space.
 * TODO: Identify the correct service path and layer ID from the GIS catalog.
 */
export async function fetchLibraries(): Promise<Resource[]> {
  console.log('[gisApi] TODO: fetchLibraries — layer ID not yet identified');
  return [];
}
