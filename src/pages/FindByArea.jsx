import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { addToVisitsList, isInVisitsList } from '../utils/visitsListStorage';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  InputAdornment,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import '../styles/findByArea.css';

// Error fallback component that can use translations
const MapErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <Box className="map-loading">
      <Typography>{t('errors.mapFailedToLoad')}</Typography>
    </Box>
  );
};

// Lazy load Leaflet components with error handling
const MapComponent = lazy(() => {
  return new Promise((resolve) => {
    import('../components/LeafletMap')
      .then((module) => resolve(module))
      .catch((error) => {
        console.error('Error loading map:', error);
        resolve({ default: MapErrorFallback });
      });
  });
});

const FindByArea = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchAddress, setSearchAddress] = useState('');
  const [children, setChildren] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([30.0444, 31.2357]);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLocationError = (errorMessage) => {
    showSnackbar(errorMessage, 'error');
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) {
      showSnackbar(t('findByArea.addressPlaceholder'), 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/children/search-by-address?addressPart=${encodeURIComponent(searchAddress)}`);
      setChildren(response.data);
      if (response.data.length > 0 && response.data[0].latitude && response.data[0].longitude) {
        setMapCenter([response.data[0].latitude, response.data[0].longitude]);
      }
    } catch (error) {
      console.error('Error searching by address:', error);
      showSnackbar(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat, lng) => {
    setSearchLocation([lat, lng]);
    setMapCenter([lat, lng]);
    searchByLocation(lat, lng);
  };

  const handleLocationFound = (lat, lng) => {
    handleMapClick(lat, lng);
  };

  const searchByLocation = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await api.get(`/children/search-by-location?latitude=${lat}&longitude=${lng}&radiusKm=${radius}`);
      setChildren(response.data);
    } catch (error) {
      console.error('Error searching by location:', error);
      showSnackbar(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const childMarkers = children
    .filter(child => child.latitude && child.longitude)
    .map(child => ({
      position: [child.latitude, child.longitude],
      title: child.fullName
    }));

  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        {t('findByArea.title')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('findByArea.searchByAddress')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                placeholder={t('findByArea.addressPlaceholder')}
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddressSearch}
                startIcon={<SearchIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : t('common.search')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('findByArea.searchByMap')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Typography variant="body2">{t('findByArea.searchRadius')}</Typography>
              <TextField
                type="number"
                size="small"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                inputProps={{ min: 1, max: 50 }}
                sx={{ width: 100 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('findByArea.mapInstructions')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box className="map-container-wrapper">
          <Suspense fallback={
            <Box className="map-loading">
              <CircularProgress />
            </Box>
          }>
            <MapComponent
              center={mapCenter}
              zoom={13}
              style={{ height: '500px', width: '100%' }}
              onMapClick={handleMapClick}
              onLocationFound={handleLocationFound}
              onLocationError={handleLocationError}
              markerPosition={searchLocation}
              markers={childMarkers}
            />
          </Suspense>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('findByArea.results')} ({children.length})
        </Typography>
        {children.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('findByArea.noResults')}
          </Typography>
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {children.map((child) => (
              <Grid item xs={12} sm={6} md={4} key={child.id}>
                <Card>
                  {child.imageUrl && (
                    <CardMedia
                      component="img"
                      height="120"
                      image={`http://localhost:5067${child.imageUrl}`}
                      alt={child.fullName}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {child.fullName}
                    </Typography>
                    {child.address && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {child.address}
                      </Typography>
                    )}
                    {child.className && (
                      <Chip label={`${t('children.class')}: ${child.className}`} size="small" sx={{ mr: 1, mt: 1 }} />
                    )}
                    {child.academicYearName && (
                      <Chip label={`${t('children.year')}: ${child.academicYearName}`} size="small" sx={{ mt: 1 }} />
                    )}
                    {child.latitude && child.longitude && (
                      <Chip
                        icon={<LocationOnIcon />}
                        label={t('findByArea.locationSaved')}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 ,gap:2, borderTop: '1px solid #eee' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/children/${child.id}`)}
                      sx={{ mr: 1 }}
                    >
                      {t('common.viewDetails')}
                    </Button>
                    {!isInVisitsList(child.id) ? (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (addToVisitsList(child.id)) {
                            showSnackbar(t('findByArea.addedToVisitsList'), 'success');
                            // Force re-render to update button state
                            setChildren([...children]);
                          }
                        }}
                      >
                        {t('findByArea.addToVisitsList')}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        disabled
                      >
                        {t('findByArea.inVisitsList')}
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FindByArea;
