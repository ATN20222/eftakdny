import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Avatar,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Map as MapIcon
} from '@mui/icons-material';
import '../styles/visitations.css';

// Lazy load Leaflet components with error handling
const MapComponent = lazy(() => {
  return new Promise((resolve) => {
    import('../components/LeafletMap')
      .then((module) => resolve(module))
      .catch((error) => {
        console.error('Error loading map:', error);
        resolve({
          default: () => (
            <Box className="map-loading">
              <Typography>Map failed to load. Please refresh the page.</Typography>
            </Box>
          )
        });
      });
  });
});

const Visitations = () => {
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveLocation, setSaveLocation] = useState(false);
  const [mapPosition, setMapPosition] = useState([30.0444, 31.2357]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/children');
      setChildren(response.data);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleVisit = (child) => {
    setSelectedChild(child);
    setShowLocationModal(true);
    setLocation(null);
    setNotes('');
    setSaveLocation(false);
    if (child.latitude && child.longitude) {
      setMapPosition([child.latitude, child.longitude]);
    }
  };

  const handleLocationSelect = useCallback((lat, lng) => {
    setLocation({ latitude: lat, longitude: lng });
    setMapPosition([lat, lng]);
  }, []);

  const handleLocationFound = useCallback((lat, lng) => {
    handleLocationSelect(lat, lng);
  }, [handleLocationSelect]);

  const handleLocationError = useCallback((errorMessage) => {
    showSnackbar(errorMessage, 'error');
  }, [showSnackbar]);

  const handleSubmitVisit = async () => {
    if (!selectedChild) return;

    setLoading(true);
    try {
      await api.post('/visits', {
        childId: selectedChild.id,
        notes: notes,
        visitLatitude: location?.latitude,
        visitLongitude: location?.longitude,
        saveLocationToChild: saveLocation && location !== null
      });

      setShowLocationModal(false);
      setSelectedChild(null);
      setLocation(null);
      setNotes('');
      setSaveLocation(false);
      showSnackbar(t('visitations.visitRecorded'), 'success');
    } catch (error) {
      showSnackbar(t('common.error'), 'error');
      console.error('Error recording visit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVisit = () => {
    if (!selectedChild) return;

    setLoading(true);
    api.post('/visits', {
      childId: selectedChild.id,
      notes: notes,
      saveLocationToChild: false
    })
      .then(() => {
        setShowLocationModal(false);
        setSelectedChild(null);
        setLocation(null);
        setNotes('');
        showSnackbar(t('visitations.visitRecorded'), 'success');
      })
      .catch(error => {
        showSnackbar(t('common.error'), 'error');
        console.error('Error recording visit:', error);
      })
      .finally(() => setLoading(false));
  };

  const childMarkers = selectedChild && selectedChild.latitude && selectedChild.longitude
    ? [{ position: [selectedChild.latitude, selectedChild.longitude], title: selectedChild.fullName }]
    : [];

  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        {t('visitations.title')}
      </Typography>

      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          {t('visitations.selectChild')}
        </Typography>
        {children.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('visitations.noChildren')}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {children.map((child) => (
              <Grid item xs={12} sm={6} md={4} key={child.id}>
                <Card className="child-visit-card" onClick={() => handleVisit(child)}>
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
                      <Chip label={child.className} size="small" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                    >
                      {t('visitations.visited')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('visitations.recordVisit')} {selectedChild?.fullName}
        </DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={saveLocation}
                onChange={(e) => setSaveLocation(e.target.checked)}
              />
            }
            label={t('visitations.setLocation')}
            sx={{ mb: 2 }}
          />

          {saveLocation && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('visitations.mapInstructions')}
              </Typography>
              <Box className="map-container-wrapper" sx={{ mt: 2 }}>
                <Suspense fallback={
                  <Box className="map-loading">
                    <CircularProgress />
                  </Box>
                }>
                    <MapComponent
                      center={mapPosition}
                      zoom={13}
                      style={{ height: '300px', width: '100%' }}
                      onMapClick={handleLocationSelect}
                      onLocationFound={handleLocationFound}
                      onLocationError={handleLocationError}
                      markers={childMarkers}
                      markerPosition={location ? [location.latitude, location.longitude] : null}
                    />
                </Suspense>
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label={t('visitations.notes')}
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('visitations.notesPlaceholder')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelVisit}
            startIcon={<CloseIcon />}
            disabled={loading}
          >
            {t('visitations.skipLocation')}
          </Button>
          <Button
            onClick={handleSubmitVisit}
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : t('visitations.recordVisitButton')}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Visitations;
