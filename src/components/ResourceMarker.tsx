import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MaterialIcons } from '@expo/vector-icons';
import type { Resource, ResourceType } from '../types/Resource';

// ---------------------------------------------------------------------------
// Type → color + icon maps (shared constants)
// ---------------------------------------------------------------------------

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  RESTROOM: '#2196F3',
  WATER: '#00BCD4',
  SHOWER: '#9C27B0',
  WIFI_OUTLET: '#FF9800',
  SHELTER: '#4CAF50',
  FOOD: '#F44336',
  BUS_STOP: '#009688',
  HOSPITAL: '#E53935',
};

const RESOURCE_ICONS: Record<ResourceType, keyof typeof MaterialIcons.glyphMap> = {
  RESTROOM: 'wc',
  WATER: 'local-drink',
  SHOWER: 'shower',
  WIFI_OUTLET: 'wifi',
  SHELTER: 'home',
  FOOD: 'restaurant',
  BUS_STOP: 'directions-bus',
  HOSPITAL: 'local-hospital',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResourceMarkerProps {
  resource: Resource;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResourceMarker: React.FC<ResourceMarkerProps> = ({ resource, onPress }) => {
  const color = RESOURCE_COLORS[resource.type];
  const iconName = RESOURCE_ICONS[resource.type];

  return (
    <MapboxGL.MarkerView
      coordinate={resource.coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.marker, { backgroundColor: color }]}
      >
        <MaterialIcons name={iconName} size={22} color="#fff" />
      </TouchableOpacity>
    </MapboxGL.MarkerView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    // Elevation (Android)
    elevation: 5,
  },
});

export default ResourceMarker;
