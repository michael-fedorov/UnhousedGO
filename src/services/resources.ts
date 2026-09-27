import { fetchLibraries, fetchParks, fetchBusStops, fetchHospitals, fetchShelters, fetchFoodBanks } from './gisApi';
import type { Resource } from '../types/Resource';

// Use allSettled so a single failing endpoint never wipes out the rest.
export async function fetchAllResources(): Promise<Resource[]> {
  const results = await Promise.allSettled([
    fetchShelters(),
    fetchLibraries(),
    fetchParks(),
    fetchBusStops(),
    fetchHospitals(),
    fetchFoodBanks(),
  ]);

  const labels = ['shelters', 'libraries', 'parks', 'busStops', 'hospitals', 'foodBanks'];
  const all: Resource[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`[resources] ${labels[i]}: ${result.value.length} records`);
      all.push(...result.value);
    } else {
      console.error(`[resources] ${labels[i]} failed:`, result.reason);
    }
  });

  return all;
}
