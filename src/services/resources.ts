import sheltersData from '../data/shelters.json';
import { fetchPublicRestrooms, fetchDrinkingFountains, fetchLibraries } from './gisApi';
import type { Resource } from '../types/Resource';

export async function fetchAllResources(): Promise<Resource[]> {
  const [restrooms, water, libraries] = await Promise.all([
    fetchPublicRestrooms(),
    fetchDrinkingFountains(),
    fetchLibraries(),
  ]);
  return [...(sheltersData as Resource[]), ...restrooms, ...water, ...libraries];
}
