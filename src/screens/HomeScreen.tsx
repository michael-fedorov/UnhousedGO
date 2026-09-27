import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';

import { useLocation } from '../hooks/useLocation';
import { fetchAllResources } from '../services/resources';
import {
  fetchHazardsAtLocation,
  DEFAULT_HAZARD_STATUS,
} from '../services/hazardApi';
import type { HazardStatus } from '../services/hazardApi';
import type { Resource, ResourceType } from '../types/Resource';

import DisasterAlertIcon from '../components/DisasterAlertIcon';
import FilterBar from '../components/FilterBar';
import ResourceMarker from '../components/ResourceMarker';
import ResourceDetailSheet from '../components/ResourceDetailSheet';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Glendale City Hall — 613 E Broadway, Glendale CA 91206
const DEFAULT_CENTER: [number, number] = [-118.2551, 34.1425];

// Ignore GPS fixes that are more than ~1° (~100 km) from Glendale.
// This prevents the simulator's default San Francisco location from
// hijacking the camera. On a real device in/near LA it passes fine.
const GLENDALE_LAT = 34.1425;
const GLENDALE_LNG = -118.2551;
const MAX_DISTANCE_DEG = 1.0;

function isNearGlendale(lat: number, lng: number): boolean {
  return (
    Math.abs(lat - GLENDALE_LAT) < MAX_DISTANCE_DEG &&
    Math.abs(lng - GLENDALE_LNG) < MAX_DISTANCE_DEG
  );
}

const INITIAL_ZOOM = 14;
const FOLLOW_ZOOM = 15;
const MIN_ZOOM = 8;
const MAX_ZOOM = 20;

// Center must shift more than this (degrees) for a region change to count as
// a pan rather than a pinch-to-zoom.
const PAN_THRESHOLD = 0.0001;

// Higher number = rendered last = appears in front of lower-priority markers.
const MARKER_PRIORITY: Record<ResourceType, number> = {
  BUS_STOP:    0,
  RESTROOM:    0,
  WATER:       1,
  SHOWER:      1,
  WIFI_OUTLET: 2,
  HOSPITAL:    3,
  FOOD:        4,
  SHELTER:     4,
};

const ALL_FILTER_TYPES: ResourceType[] = [
  'RESTROOM',
  'WATER',
  'SHOWER',
  'WIFI_OUTLET',
  'SHELTER',
  'FOOD',
  'BUS_STOP',
  'HOSPITAL',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HomeScreen: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeFilters, setActiveFilters] = useState<ResourceType[]>(ALL_FILTER_TYPES);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [hazardStatus, setHazardStatus] = useState<HazardStatus>(DEFAULT_HAZARD_STATUS);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const hasInitialFix = useRef(false);
  const lastHazardFetchCoords = useRef<[number, number] | null>(null);
  const currentZoom = useRef(INITIAL_ZOOM);
  const lastRegionCenter = useRef<[number, number] | null>(null);

  const { location } = useLocation();

  // Load all resources on mount
  useEffect(() => {
    fetchAllResources()
      .then(setResources)
      .catch((err) => console.error('[HomeScreen] fetchAllResources failed:', err));
  }, []);

  // Camera control — fly to user location imperatively.
  // Ignores GPS fixes far from Glendale (e.g. the iOS Simulator's default
  // San Francisco location). After the initial fix, following only updates
  // the center so the user can zoom freely without being snapped back.
  useEffect(() => {
    if (!location) return;
    const { latitude, longitude } = location.coords;

    if (!isNearGlendale(latitude, longitude)) {
      console.log('[HomeScreen] GPS fix outside Glendale bounds — ignoring for camera');
      return;
    }

    const coords: [number, number] = [longitude, latitude];

    if (!hasInitialFix.current) {
      hasInitialFix.current = true;
      currentZoom.current = FOLLOW_ZOOM;
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: FOLLOW_ZOOM,
        pitch: 45,
        animationDuration: 1500,
        animationMode: 'flyTo',
      });
    } else if (isFollowingUser) {
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        animationDuration: 500,
        animationMode: 'easeTo',
      });
    }
  }, [location, isFollowingUser]);

  // Fetch hazards at current location, falling back to Glendale City Hall.
  // GPS fixes outside the Glendale area (e.g. simulator default SF location)
  // are ignored so the hazard query stays meaningful.
  useEffect(() => {
    const rawLat = location?.coords.latitude;
    const rawLng = location?.coords.longitude;
    const useGPS = rawLat != null && rawLng != null && isNearGlendale(rawLat, rawLng);
    const lat = useGPS ? rawLat! : DEFAULT_CENTER[1];
    const lng = useGPS ? rawLng! : DEFAULT_CENTER[0];

    const last = lastHazardFetchCoords.current;
    const moved =
      !last ||
      Math.abs(last[0] - lng) > 0.005 ||
      Math.abs(last[1] - lat) > 0.005;
    if (!moved) return;
    lastHazardFetchCoords.current = [lng, lat];
    fetchHazardsAtLocation(lat, lng).then(setHazardStatus);
  }, [location]);

  const handleToggleFilter = useCallback((type: ResourceType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedResource(null);
  }, []);

  // Distinguish pan (center moved) from pinch-to-zoom (center stays put).
  // Only disable following when the user actually pans.
  const handleRegionIsChanging = useCallback(
    (feature: { geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }) => {
      if (!feature.properties?.isUserInteraction) return;

      const coords = feature.geometry?.coordinates;
      if (!coords) return;
      const [lng, lat] = coords;
      const prev = lastRegionCenter.current;

      if (
        prev &&
        (Math.abs(lng - prev[0]) > PAN_THRESHOLD || Math.abs(lat - prev[1]) > PAN_THRESHOLD)
      ) {
        if (isFollowingUser) setIsFollowingUser(false);
      }

      lastRegionCenter.current = [lng, lat];
    },
    [isFollowingUser],
  );

  // Keep currentZoom in sync so zoom buttons know where to start from
  const handleRegionDidChange = useCallback(
    (feature: { properties?: Record<string, unknown> }) => {
      const zoom = feature.properties?.zoomLevel;
      if (typeof zoom === 'number') {
        currentZoom.current = zoom;
      }
    },
    [],
  );

  const handleRecenter = useCallback(() => {
    setIsFollowingUser(true);
    if (location) {
      currentZoom.current = FOLLOW_ZOOM;
      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: FOLLOW_ZOOM,
        pitch: 45,
        animationDuration: 800,
        animationMode: 'flyTo',
      });
    }
  }, [location]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const next =
      direction === 'in'
        ? Math.min(currentZoom.current + 1, MAX_ZOOM)
        : Math.max(currentZoom.current - 1, MIN_ZOOM);
    currentZoom.current = next;
    cameraRef.current?.setCamera({
      zoomLevel: next,
      animationDuration: 250,
      animationMode: 'easeTo',
    });
  }, []);

  const visibleResources = resources
    .filter((r) => activeFilters.includes(r.type))
    .sort((a, b) => MARKER_PRIORITY[a.type] - MARKER_PRIORITY[b.type]);

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
          onRegionIsChanging={handleRegionIsChanging}
          onRegionDidChange={handleRegionDidChange}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: DEFAULT_CENTER,
              zoomLevel: INITIAL_ZOOM,
              pitch: 45,
            }}
          />

          <MapboxGL.UserLocation visible androidRenderMode="compass" />

          {visibleResources.map((resource) => (
            <ResourceMarker
              key={resource.id}
              resource={resource}
              onPress={() => setSelectedResource(resource)}
            />
          ))}
        </MapboxGL.MapView>

        {/* ----------------------------------------------------------------
            Hazard alert icon (top-right)
        ---------------------------------------------------------------- */}
        <DisasterAlertIcon status={hazardStatus} />

        {/* ----------------------------------------------------------------
            Zoom controls (right side, above recenter)
        ---------------------------------------------------------------- */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom('in')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="add" size={22} color="#333" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom('out')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="remove" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* ----------------------------------------------------------------
            Recenter FAB — visible only when not following user
        ---------------------------------------------------------------- */}
        {!isFollowingUser && (
          <TouchableOpacity
            style={styles.recenterFab}
            onPress={handleRecenter}
            activeOpacity={0.85}
          >
            <MaterialIcons name="my-location" size={24} color="#333" />
          </TouchableOpacity>
        )}

        {/* ----------------------------------------------------------------
            Filter bar (bottom)
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
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 240,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  zoomButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  recenterFab: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default HomeScreen;
