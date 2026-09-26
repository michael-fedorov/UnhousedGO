import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { useLocation } from '../hooks/useLocation';
import { fetchAllResources } from '../services/resources';
import type { Resource, ResourceType } from '../types/Resource';

import DisasterBanner from '../components/DisasterBanner';
import FilterBar from '../components/FilterBar';
import ResourceMarker from '../components/ResourceMarker';
import ResourceDetailSheet from '../components/ResourceDetailSheet';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Glendale City Hall — default camera center before GPS fix
const DEFAULT_CENTER: [number, number] = [-118.2551, 34.1425];

const ALL_FILTER_TYPES: ResourceType[] = [
  'RESTROOM',
  'WATER',
  'SHOWER',
  'WIFI_OUTLET',
  'SHELTER',
  'FOOD',
  'CHURCH',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HomeScreen: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeFilters, setActiveFilters] = useState<ResourceType[]>(ALL_FILTER_TYPES);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const { location } = useLocation();

  // Derive camera center: live GPS > default
  const centerCoordinate: [number, number] = location
    ? [location.coords.longitude, location.coords.latitude]
    : DEFAULT_CENTER;

  // Load all resources on mount
  useEffect(() => {
    fetchAllResources()
      .then(setResources)
      .catch((err) => console.error('[HomeScreen] fetchAllResources failed:', err));
  }, []);

  // Toggle a single filter category on/off
  const handleToggleFilter = useCallback((type: ResourceType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedResource(null);
  }, []);

  // Only show markers for active filter types
  const visibleResources = resources.filter((r) => activeFilters.includes(r.type));

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        {/* ----------------------------------------------------------------
            Map
        ---------------------------------------------------------------- */}
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          compassEnabled
          logoEnabled={false}
          attributionEnabled={false}
        >
          {/* Camera — tilted 3D perspective like Pokémon GO */}
          <MapboxGL.Camera
            centerCoordinate={centerCoordinate}
            zoomLevel={15}
            pitch={45}
            animationMode="flyTo"
            animationDuration={800}
          />

          {/* User location dot */}
          <MapboxGL.UserLocation visible androidRenderMode="compass" />

          {/* Resource pins */}
          {visibleResources.map((resource) => (
            <ResourceMarker
              key={resource.id}
              resource={resource}
              onPress={() => setSelectedResource(resource)}
            />
          ))}
        </MapboxGL.MapView>

        {/* ----------------------------------------------------------------
            Disaster alert banner (renders null when no message)
        ---------------------------------------------------------------- */}
        <DisasterBanner message={undefined} />

        {/* ----------------------------------------------------------------
            Filter bar — floating above safe area at bottom
        ---------------------------------------------------------------- */}
        <FilterBar activeFilters={activeFilters} onToggle={handleToggleFilter} />

        {/* ----------------------------------------------------------------
            Resource detail bottom sheet
        ---------------------------------------------------------------- */}
        <ResourceDetailSheet
          resource={selectedResource}
          onClose={handleCloseSheet}
        />
      </View>
    </BottomSheetModalProvider>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default HomeScreen;
