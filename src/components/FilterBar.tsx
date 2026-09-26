import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ResourceType } from '../types/Resource';

interface CategoryConfig {
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const CATEGORY_CONFIG: Record<ResourceType, CategoryConfig> = {
  RESTROOM: { iconName: 'wc', label: 'Restrooms' },
  WATER: { iconName: 'local-drink', label: 'Water' },
  SHOWER: { iconName: 'shower', label: 'Showers' },
  WIFI_OUTLET: { iconName: 'wifi', label: 'WiFi/Outlets' },
  SHELTER: { iconName: 'home', label: 'Shelters' },
  FOOD: { iconName: 'restaurant', label: 'Food' },
  CHURCH: { iconName: 'church', label: 'Churches' },
};

const ALL_TYPES: ResourceType[] = [
  'RESTROOM',
  'WATER',
  'SHOWER',
  'WIFI_OUTLET',
  'SHELTER',
  'FOOD',
  'CHURCH',
];

interface FilterBarProps {
  activeFilters: ResourceType[];
  onToggle: (type: ResourceType) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilters, onToggle }) => {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {ALL_TYPES.map((type) => {
          const config = CATEGORY_CONFIG[type];
          const isActive = activeFilters.includes(type);
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onToggle(type)}
              style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name={config.iconName}
                size={16}
                color={isActive ? '#fff' : '#555'}
                style={styles.pillIcon}
              />
              <Text style={[styles.pillLabel, isActive ? styles.pillLabelActive : styles.pillLabelInactive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  pillActive: {
    backgroundColor: '#1a1a1a',
  },
  pillInactive: {
    backgroundColor: '#f0f0f0',
  },
  pillIcon: {
    marginRight: 4,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillLabelActive: {
    color: '#fff',
  },
  pillLabelInactive: {
    color: '#555',
  },
});

export default FilterBar;
