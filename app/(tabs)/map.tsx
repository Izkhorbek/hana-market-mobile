import GoogleMap, { MarkerData } from '@/components/Maps/GoogleMap';
import { MarkerDetailModal } from '@/components/Maps/MarkerDetailModal';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const MapPage = () => {
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Sample markers with rich data
  const sampleMarkers: MarkerData[] = [
    {
      id: 1,
      latitude: 41.3111,
      longitude: 69.2797,
      title: 'SQB - Industrial Bank',
      description: 'Financial services',
      image: 'https://images.pexels.com/photos/7486933/pexels-photo-7486933.jpeg',
      category: 'Financial services',
      categoryTag: 'Bank',
      distance: '680m',
      features: ['Local Currency Accepted'],
    },
    {
      id: 2,
      latitude: 41.3250,
      longitude: 69.2889,
      title: 'Green Wellness Spa',
      description: 'Health & Wellness',
      image: 'https://images.pexels.com/photos/7486933/pexels-photo-7486933.jpeg',
      category: 'Health & Wellness',
      categoryTag: 'Spa',
      distance: '1.2km',
      features: ['20% New Member Discount', 'Free Parking'],
    },
    {
      id: 3,
      latitude: 41.2995,
      longitude: 69.2401,
      title: 'Jet Learning Center',
      description: 'Education center',
      image: 'https://images.pexels.com/photos/7486933/pexels-photo-7486933.jpeg',
      category: 'Education',
      categoryTag: 'Learning Center',
      distance: '2.1km',
      features: ['1 Free Check-up', 'Student Discounts'],
    },
    {
      id: 4,
      latitude: 41.2850,
      longitude: 69.2050,
      title: 'Doctor-Animals Clinic',
      description: 'Animal hospital',
      image: 'https://images.pexels.com/photos/7486933/pexels-photo-7486933.jpeg',
      category: 'Veterinary',
      categoryTag: 'Animal Hospital',
      distance: '3.5km',
      features: ['10% Discount', '24/7 Emergency Care'],
    },
    {
      id: 5,
      latitude: 41.3350,
      longitude: 69.3200,
      title: 'Market 24/7',
      description: 'Convenience store',
      image: 'https://images.pexels.com/photos/7486933/pexels-photo-7486933.jpeg',
      category: 'Shopping',
      categoryTag: 'Market',
      distance: '950m',
      features: ['Open 24/7', 'Home Delivery'],
    },
  ];

  const handleMarkerPress = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedMarker(null);
  };

  return (
    <View style={styles.container}>
      <GoogleMap
        markers={sampleMarkers}
        showControls={true}
        onMarkerPress={handleMarkerPress}
        onMapPress={(coordinate) => console.log('Map pressed:', coordinate)}
      />

      <MarkerDetailModal
        marker={selectedMarker}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default MapPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});