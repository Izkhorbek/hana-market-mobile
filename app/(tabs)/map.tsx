import { useThemeColors } from '@/hooks/use-theme-colors';
import { Minus, Plus, Target } from 'lucide-react-native';
import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import YaMap, { Marker } from 'react-native-yamap';

const MapPage = () => {
  const mapRef = useRef<YaMap>(null);
  const colors = useThemeColors();

  const handleZoomIn = () => {
    mapRef.current?.setZoom(10, 0.3); // Example zoom increment logic might be needed
    // YaMap setZoom signature: setZoom(zoom: number, duration?: number, animation?: Animation)
  };

  const handleZoomOut = () => {
    // YaMap setZoom signature: setZoom(zoom: number, duration?: number, animation?: Animation)
  };

  return (
    <View style={styles.container}>
      <YaMap
        ref={mapRef}
        showUserPosition={true}
        initialRegion={{
          lat: 41.3111,
          lon: 69.2797,
          zoom: 12,
        }}
        style={styles.map}
      >
        <Marker
          point={{ lat: 41.3111, lon: 69.2797 }}
          scale={1}
        />
      </YaMap>

      {/* Custom Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={() => {
            // Need to get current zoom first or handle it differently
          }}
        >
          <Plus size={24} color={colors.blackIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={() => {
            // Need to get current zoom first or handle it differently
          }}
        >
          <Minus size={24} color={colors.blackIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.locateButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            // handle locate - YaMap has showUserPosition but focusing on it usually requires a method
          }}
        >
          <Target size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MapPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -100 }],
    gap: 12,
    zIndex: 2,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  locateButton: {
    marginTop: 8,
  },
});