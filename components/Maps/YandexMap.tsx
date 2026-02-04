import { useColor } from '@/hooks/useColor';
import * as Location from 'expo-location';
import { Minus, Plus, Target } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface YandexMapProps {
  initialCenter?: [number, number];
  apiKey?: string;
  height?: number | string;
  width?: number | string;
  lang?: 'ru' | 'uz' | 'en';
  onLocationSelect?: (data: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  }) => void;
}

const getMapLocale = (langCode: string) => {
  if (langCode === 'uz') return 'uz_UZ';
  if (langCode === 'en') return 'en_US';
  return 'ru_RU';
};

const YandexMap = ({
  initialCenter = [41.3111, 69.2797], // Tashkent center
  apiKey = '24ebf5ac-ba8e-47a7-b146-603f38894d2d',
  height = '100%',
  width = '100%',
  lang = 'ru',
  onLocationSelect,
}: YandexMapProps) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const cardColor = useColor('card');
  const primaryColor = useColor('primary');
  const textColor = useColor('text');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${getMapLocale(
    lang
  )}" type="text/javascript"></script>
        <style>
          body, html, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          /* Hide yandex logo/controls for cleaner look if needed, but keeping them by default */
          .ymaps-2-1-79-map-copyrights-promo { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let myMap;
          let myPlacemark;

          ymaps.ready(init);

          function init() {
            myMap = new ymaps.Map("map", {
              center: [${initialCenter[0]}, ${initialCenter[1]}],
              zoom: 13,
              controls: [] // Remove default controls to use custom RN ones
            });

            myPlacemark = new ymaps.Placemark(myMap.getCenter(), {
              hintContent: '',
              balloonContent: ''
            }, {
              preset: 'islands#redDotIcon'
            });

            myMap.geoObjects.add(myPlacemark);

            // Update marker and map center when user clicks
            myMap.events.add('click', function (e) {
              const coords = e.get('coords');
              updateMarker(coords);
              sendLocationToRN(coords);
            });

            // Update marker on map move
            myMap.events.add('boundschange', function (e) {
              if (e.get('newCenter')) {
                // Optional: update marker to stay at center
                // updateMarker(myMap.getCenter());
              }
            });

            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
          }

          function updateMarker(coords) {
            myPlacemark.geometry.setCoordinates(coords);
            myMap.panTo(coords, { flying: true });
          }

          function sendLocationToRN(coords) {
             ymaps.geocode(coords).then(function (res) {
                const firstGeoObject = res.geoObjects.get(0);
                const address = firstGeoObject.getAddressLine();
                const name = firstGeoObject.getPremise() || firstGeoObject.getThoroughfare() || address;
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOCATION_SELECTED',
                  coords: coords,
                  address: address,
                  name: name
                }));
            });
          }

          // Exposed functions for RN communication
          window.setZoom = (level) => {
            myMap.setZoom(level, { checkZoomRange: true, duration: 300 });
          };

          window.getZoom = () => {
            return myMap.getZoom();
          };

          window.setCenter = (coords) => {
            myMap.setCenter(coords, 15, { checkZoomRange: true, duration: 500 });
            updateMarker(coords);
            sendLocationToRN(coords);
          };
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setLoading(false);
      } else if (data.type === 'LOCATION_SELECTED') {
        onLocationSelect?.({
          lat: data.coords[0],
          lng: data.coords[1],
          name: data.name,
          address: data.address,
        });
      }
    } catch (e) {
      console.error('Error parsing WebView message', e);
    }
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        const zoom = window.getZoom();
        window.setZoom(zoom + 1);
      })();
    `);
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        const zoom = window.getZoom();
        window.setZoom(zoom - 1);
      })();
    `);
  };

  const handleLocateMe = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow access to location to use this feature.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = [location.coords.latitude, location.coords.longitude];
      
      webViewRef.current?.injectJavaScript(`
        window.setCenter([${coords[0]}, ${coords[1]}]);
      `);
    } catch (error) {
      console.error('Error getting location', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  return (
    <View style={[styles.container, { height: height as any, width: width as any }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: cardColor }]}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}

      {/* Custom Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: cardColor }]}
          onPress={handleZoomIn}
        >
          <Plus size={24} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: cardColor }]}
          onPress={handleZoomOut}
        >
          <Minus size={24} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.locateButton, { backgroundColor: primaryColor }]}
          onPress={handleLocateMe}
        >
          <Target size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default YandexMap;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  locateButton: {
    marginTop: 8,
  },
});