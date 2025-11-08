import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Fab, Tooltip } from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import '../styles/global.css';

// Fix Leaflet icon issue - only run on client
if (typeof window !== 'undefined') {
  delete Icon.Default.prototype._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle map center updates
function MapCenterHandler({ center, zoom }) {
  const map = useMap();
  const prevCenterRef = useRef(null);
  const prevZoomRef = useRef(null);
  
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      const [lat, lng] = center;
      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lng) && 
          lat >= -90 && lat <= 90 && 
          lng >= -180 && lng <= 180) {
        // Check if center or zoom actually changed (with tolerance for floating point)
        const prevCenter = prevCenterRef.current;
        const centerChanged = !prevCenter || 
          Math.abs(prevCenter[0] - lat) > 0.0001 || 
          Math.abs(prevCenter[1] - lng) > 0.0001;
        const targetZoom = zoom || map.getZoom();
        const zoomChanged = prevZoomRef.current !== targetZoom;
        
        if (centerChanged || zoomChanged) {
          prevCenterRef.current = [lat, lng];
          prevZoomRef.current = targetZoom;
          // Use flyTo for smoother animation
          map.flyTo([lat, lng], targetZoom, {
            duration: 0.5,
            animate: true
          });
        }
      }
    }
  }, [center, zoom, map]);
  return null;
}

// Component for current location button
function CurrentLocationButton({ onLocationFound, onLocationError }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      if (onLocationError) {
        onLocationError(t('errors.geolocationNotSupported'));
      }
      return;
    }

    setLoading(true);

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0 // Don't use cached position to avoid confusion with permission errors
    };

    // Use getCurrentPosition - it will handle permission errors properly
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Validate coordinates
          if (isNaN(latitude) || isNaN(longitude) || 
              latitude < -90 || latitude > 90 || 
              longitude < -180 || longitude > 180) {
            console.error('Invalid coordinates received:', { latitude, longitude });
            setLoading(false);
            if (onLocationError) {
              onLocationError(t('errors.unableToGetLocation'));
            }
            return;
          }

          console.log('Location found:', { latitude, longitude });
          
          // Don't set map view directly here - let the parent component handle it
          // This ensures consistent state management
          
          // Call success callback - parent will update mapCenter state
          if (onLocationFound) {
            onLocationFound(latitude, longitude);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error processing location:', err);
          setLoading(false);
          if (onLocationError) {
            onLocationError(t('errors.unableToGetLocation'));
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        
        let errorMessage = t('errors.unableToGetLocation');
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('errors.geolocationPermissionDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('errors.positionUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('errors.geolocationTimeout');
            break;
          default:
            errorMessage = t('errors.unableToGetLocation');
            break;
        }
        
        if (onLocationError) {
          onLocationError(errorMessage);
        }
      },
      geolocationOptions
    );
  };

  return (
    <Tooltip title={loading ? "Getting your location..." : "Get My Current Location"}>
      <Fab
        color="primary"
        size="small"
        onClick={handleGetCurrentLocation}
        disabled={loading}
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <MyLocationIcon />
      </Fab>
    </Tooltip>
  );
}

const LeafletMapWrapper = ({ 
  center, 
  zoom, 
  children, 
  style, 
  onMapClick, 
  markerPosition, 
  markers = [], 
  onLocationFound, 
  onLocationError 
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const mapInstanceRef = useRef(null);
  const containerIdRef = useRef(`map-${Math.random().toString(36).substring(2, 15)}`);
  const isInitializedRef = useRef(false);
  const [mapCenter, setMapCenter] = useState(center || [30.0444, 31.2357]); // Default to Cairo, Egypt
  const [mapZoom, setMapZoom] = useState(zoom || 13);

  // Generate unique key to force remount if needed
  const mapKey = useMemo(() => Math.random().toString(36).substring(2, 15), []);

  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      // Cleanup: remove map instance on unmount
      if (mapInstanceRef.current && isInitializedRef.current) {
        try {
          const map = mapInstanceRef.current;
          if (map && typeof map.remove === 'function') {
            map.remove();
          }
        } catch (e) {
          // Ignore cleanup errors
          console.warn('Map cleanup warning:', e);
        }
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      setMapCenter(center);
    }
  }, [center]);

  useEffect(() => {
    if (zoom !== undefined && zoom !== null) {
      setMapZoom(zoom);
    }
  }, [zoom]);

  const handleLocationFound = (lat, lng) => {
    console.log('Setting location to:', lat, lng);
    // Validate coordinates before setting
    if (!isNaN(lat) && !isNaN(lng) && 
        lat >= -90 && lat <= 90 && 
        lng >= -180 && lng <= 180) {
      const newCenter = [lat, lng];
      setMapCenter(newCenter);
      // Set zoom to 15 for current location (closer view)
      setMapZoom(15);
      
      // Also update marker position if needed
    if (onLocationFound) {
      onLocationFound(lat, lng);
    }
      // Don't automatically trigger onMapClick - let user decide
    } else {
      console.error('Invalid coordinates:', { lat, lng });
      if (onLocationError) {
        onLocationError(t('errors.unableToGetLocation'));
      }
    }
  };

  const handleLocationError = (errorMessage) => {
    console.error('Location error:', errorMessage);
    if (onLocationError) {
      onLocationError(errorMessage);
    }
  };

  if (!isMounted || typeof window === 'undefined') {
    return (
      <Box className="map-loading">
        <Typography>Loading map...</Typography>
      </Box>
    );
  }

  return (
    <Box 
      id={containerIdRef.current} 
      sx={{ 
        height: style?.height || '100%', 
        width: style?.width || '100%', 
        position: 'relative' 
      }}
    >
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={mapZoom}
        style={style}
        whenCreated={(map) => {
          // Only initialize once
          if (!isInitializedRef.current) {
            mapInstanceRef.current = map;
            isInitializedRef.current = true;
          } else {
            // If already initialized, remove the duplicate
            try {
              if (map && typeof map.remove === 'function') {
                map.remove();
              }
            } catch (e) {
              console.warn('Duplicate map removal warning:', e);
            }
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapCenterHandler center={mapCenter} zoom={mapZoom} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {markerPosition && <Marker position={markerPosition} />}
        {markers.map((marker, index) => (
          <Marker 
            key={`marker-${index}`} 
            position={marker.position} 
            title={marker.title} 
          />
        ))}
        <CurrentLocationButton 
          onLocationFound={handleLocationFound} 
          onLocationError={handleLocationError} 
        />
        {children}
      </MapContainer>
    </Box>
  );
};

export default LeafletMapWrapper;