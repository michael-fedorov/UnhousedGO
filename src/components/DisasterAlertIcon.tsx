import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { HazardStatus } from '../services/hazardApi';

interface DisasterAlertIconProps {
  status: HazardStatus;
}

function getBackgroundColor(status: HazardStatus): string {
  if (status.loading) return '#9E9E9E';
  if (status.level === 'safe') return '#4CAF50';
  if (status.level === 'moderate') return '#FF9800';
  return '#F44336';
}

const DisasterAlertIcon: React.FC<DisasterAlertIconProps> = ({ status }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status.level === 'danger' && !status.loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
      return undefined;
    }
  }, [status.level, status.loading, pulseAnim]);

  const backgroundColor = getBackgroundColor(status);

  // Human-readable label for wildfire zone codes
  function wildfireLabel(w: string | null): string {
    if (!w || w === 'NonWildland') return 'No wildfire hazard';
    if (w === 'Very High') return 'Very High Risk';
    if (w === 'High') return 'High Risk';
    if (w === 'Moderate') return 'Moderate Risk';
    return w;
  }

  // Human-readable label for FEMA flood zone codes
  function floodLabel(zone: string | null, isSFHA: boolean): string {
    if (!zone) return 'No flood hazard';
    if (isSFHA) return `Zone ${zone} — High Risk Area`;
    if (zone === 'X') return 'Zone X — Minimal Risk';
    return `Zone ${zone}`;
  }

  const wildfireColor =
    status.wildfire === 'Very High'
      ? '#D32F2F'
      : status.wildfire === 'High' || status.wildfire === 'Moderate'
      ? '#F57C00'
      : '#388E3C';

  const floodColor = status.isFloodHazardArea ? '#D32F2F' : '#388E3C';
  const faultColor = status.faultZone ? '#D32F2F' : '#388E3C';
  const liquefactionColor = status.liquefaction ? '#F57C00' : '#388E3C';

  return (
    <>
      <Animated.View
        style={[
          styles.buttonContainer,
          { backgroundColor, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          style={styles.touchable}
        >
          {status.loading ? (
            <ActivityIndicator color="#fff" />
          ) : status.level === 'safe' ? (
            <MaterialIcons name="verified-user" size={28} color="#fff" />
          ) : status.level === 'moderate' ? (
            <MaterialIcons name="warning" size={28} color="#fff" />
          ) : (
            <MaterialIcons name="report" size={28} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hazard Status</Text>
            <Text style={styles.cardSubtitle}>Based on your current location</Text>

            <View style={styles.hazardRow}>
              <Text style={styles.hazardEmoji}>🔥</Text>
              <Text style={styles.hazardLabel}>Wildfire:</Text>
              <Text style={[styles.hazardValue, { color: wildfireColor }]}>
                {wildfireLabel(status.wildfire)}
              </Text>
            </View>

            <View style={styles.hazardRow}>
              <Text style={styles.hazardEmoji}>🌊</Text>
              <Text style={styles.hazardLabel}>Flood zone:</Text>
              <Text style={[styles.hazardValue, { color: floodColor }]}>
                {floodLabel(status.floodZone, status.isFloodHazardArea)}
              </Text>
            </View>

            <View style={styles.hazardRow}>
              <Text style={styles.hazardEmoji}>⚡</Text>
              <Text style={styles.hazardLabel}>Fault zone:</Text>
              <Text style={[styles.hazardValue, { color: faultColor }]}>
                {status.faultZone ? 'Inside Alquist-Priolo zone' : 'Not in fault zone'}
              </Text>
            </View>

            <View style={styles.hazardRow}>
              <Text style={styles.hazardEmoji}>💧</Text>
              <Text style={styles.hazardLabel}>Liquefaction:</Text>
              <Text style={[styles.hazardValue, { color: liquefactionColor }]}>
                {status.liquefaction
                  ? 'Liquefaction hazard present'
                  : 'No liquefaction hazard'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  touchable: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 32,
    width: '100%',
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  hazardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  hazardEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  hazardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 6,
  },
  hazardValue: {
    fontSize: 14,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DisasterAlertIcon;
