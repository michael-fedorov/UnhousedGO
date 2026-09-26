import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { Resource, ResourceType } from '../types/Resource';

// ---------------------------------------------------------------------------
// Resource type metadata
// ---------------------------------------------------------------------------

const RESOURCE_COLORS: Record<ResourceType, string> = {
  RESTROOM: '#2196F3',
  WATER: '#00BCD4',
  SHOWER: '#9C27B0',
  WIFI_OUTLET: '#FF9800',
  SHELTER: '#4CAF50',
  FOOD: '#F44336',
  CHURCH: '#673AB7',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  RESTROOM: 'Restroom',
  WATER: 'Water',
  SHOWER: 'Shower',
  WIFI_OUTLET: 'WiFi / Outlets',
  SHELTER: 'Shelter',
  FOOD: 'Food',
  CHURCH: 'Church',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResourceDetailSheetProps {
  resource: Resource | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SNAP_POINTS = ['40%', '70%'];

const ResourceDetailSheet: React.FC<ResourceDetailSheetProps> = ({
  resource,
  onClose,
}) => {
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (resource) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [resource]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleGetDirections = useCallback(() => {
    if (!resource) return;
    const [lng, lat] = resource.coordinates;
    const label = encodeURIComponent(resource.name);
    const url = Platform.select({
      ios: `maps://?ll=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      default: `https://maps.google.com/?q=${lat},${lng}`,
    });
    Linking.openURL(url).catch((err) =>
      console.warn('[ResourceDetailSheet] could not open maps:', err),
    );
  }, [resource]);

  const handleCallPhone = useCallback(() => {
    if (!resource?.phone) return;
    Linking.openURL(`tel:${resource.phone}`).catch((err) =>
      console.warn('[ResourceDetailSheet] could not open phone:', err),
    );
  }, [resource]);

  const hoursString =
    resource?.hours != null
      ? typeof resource.hours === 'string'
        ? resource.hours
        : resource.hours.note ?? Object.values(resource.hours).filter(Boolean).join(', ')
      : null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {resource && (
          <>
            {/* Name */}
            <Text style={styles.name}>{resource.name}</Text>

            {/* Type badge */}
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: RESOURCE_COLORS[resource.type] },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {RESOURCE_LABELS[resource.type]}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Address */}
            {resource.address ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Address</Text>
                <Text style={styles.rowValue}>{resource.address}</Text>
              </View>
            ) : null}

            {/* Hours */}
            {hoursString ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Hours</Text>
                <Text style={styles.rowValue}>{hoursString}</Text>
              </View>
            ) : null}

            {/* Phone */}
            {resource.phone ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Phone</Text>
                <TouchableOpacity onPress={handleCallPhone} activeOpacity={0.7}>
                  <Text style={[styles.rowValue, styles.link]}>{resource.phone}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Notes */}
            {resource.notes ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Notes</Text>
                <Text style={styles.rowValue}>{resource.notes}</Text>
              </View>
            ) : null}

            {/* Get Directions button */}
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
              activeOpacity={0.85}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  handleIndicator: {
    backgroundColor: '#ccc',
    width: 40,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
    marginBottom: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 14,
  },
  row: {
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
  },
  link: {
    color: '#1565C0',
    textDecorationLine: 'underline',
  },
  directionsButton: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ResourceDetailSheet;
