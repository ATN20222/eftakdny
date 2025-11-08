import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Chip,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Map as MapIcon
} from '@mui/icons-material';
import {
  getVisitsList,
  removeFromVisitsList,
  addToVisitsList
} from '../utils/visitsListStorage';
import '../styles/visitsList.css';

// Lazy load Leaflet components with error handling
const MapErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <Box className="map-loading">
      <Typography>{t('errors.mapFailedToLoad')}</Typography>
    </Box>
  );
};

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

const VisitsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visitsListIds, setVisitsListIds] = useState([]);
  const [children, setChildren] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveLocation, setSaveLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState([30.0444, 31.2357]);
  const [newChildId, setNewChildId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    loadVisitsList();
    fetchAllChildren();
  }, []);

  const loadVisitsList = async () => {
    const ids = getVisitsList();
    setVisitsListIds(ids);
    
    if (ids.length > 0) {
      try {
        // Fetch children details for all IDs
        const childrenPromises = ids.map(id => api.get(`/children/${id}`).catch(() => null));
        const childrenResults = await Promise.all(childrenPromises);
        const validChildren = childrenResults.filter(child => child !== null).map(res => res.data);
        setChildren(validChildren);
      } catch (error) {
        console.error('Error fetching children:', error);
      }
    } else {
      setChildren([]);
    }
  };

  const fetchAllChildren = async () => {
    try {
      const response = await api.get('/children');
      setAllChildren(response.data);
    } catch (error) {
      console.error('Error fetching all children:', error);
    }
  };

  const handleRemove = (childId) => {
    setConfirmDialog({
      open: true,
      message: t('visitsList.confirmRemove'),
      onConfirm: () => {
        // Ensure childId is a number
        const idToRemove = typeof childId === 'string' ? parseInt(childId, 10) : childId;
        removeFromVisitsList(idToRemove);
        setConfirmDialog({ open: false, message: '', onConfirm: null });
        loadVisitsList();
        showSnackbar(t('visitsList.childRemoved'), 'success');
      }
    });
  };

  const handleVisit = (child) => {
    setSelectedChild(child);
    setShowLocationModal(true);
    setLocation(null);
    setNotes('');
    setSaveLocation(false);
    if (child.latitude && child.longitude) {
      setMapPosition([child.latitude, child.longitude]);
    } else {
      setMapPosition([30.0444, 31.2357]);
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

      // Remove from visits list after successful visit
      removeFromVisitsList(selectedChild.id);
      
      setShowLocationModal(false);
      setSelectedChild(null);
      setLocation(null);
      setNotes('');
      setSaveLocation(false);
      loadVisitsList();
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
        // Remove from visits list after successful visit
        removeFromVisitsList(selectedChild.id);
        
        setShowLocationModal(false);
        setSelectedChild(null);
        setLocation(null);
        setNotes('');
        loadVisitsList();
        showSnackbar(t('visitations.visitRecorded'), 'success');
      })
      .catch(error => {
        showSnackbar(t('common.error'), 'error');
        console.error('Error recording visit:', error);
      })
      .finally(() => setLoading(false));
  };

  const handleAddChild = () => {
    if (!newChildId) {
      showSnackbar(t('visitsList.selectChild'), 'warning');
      return;
    }

    if (addToVisitsList(parseInt(newChildId))) {
      setNewChildId('');
      setShowAddModal(false);
      loadVisitsList();
      showSnackbar(t('visitsList.childAdded'), 'success');
    } else {
      showSnackbar(t('visitsList.alreadyInList'), 'info');
    }
  };

  const availableChildren = allChildren.filter(
    child => !visitsListIds.includes(child.id)
  );

  const childMarkers = selectedChild && selectedChild.latitude && selectedChild.longitude
    ? [{ position: [selectedChild.latitude, selectedChild.longitude], title: selectedChild.fullName }]
    : [];

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Typography variant="h4" component="h1" className="page-title">
          {t('visitsList.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddModal(true)}
        >
          {t('visitsList.addChild')}
        </Button>
      </Box>

      {children.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('visitsList.noChildren')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddModal(true)}
          >
            {t('visitsList.addChild')}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {children.map((child) => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <Card className="child-visit-card">
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
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemove(child.id)}
                    title={t('visitsList.remove')}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleVisit(child)}
                  >
                    {t('visitsList.visit')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Child Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('visitsList.addChildToList')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label={t('visitsList.selectChild')}
            value={newChildId}
            onChange={(e) => setNewChildId(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">{t('visitsList.selectChild')}</MenuItem>
            {availableChildren.map((child) => (
              <MenuItem key={child.id} value={child.id}>
                {child.fullName} - {child.address || t('visitsList.noAddress')}
              </MenuItem>
            ))}
          </TextField>
          {availableChildren.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('visitsList.allChildrenAdded')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)} startIcon={<CloseIcon />}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleAddChild}
            variant="contained"
            disabled={!newChildId || availableChildren.length === 0}
          >
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visit Location Modal */}
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

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, message: '', onConfirm: null })}
      >
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, message: '', onConfirm: null })}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmDialog.onConfirm} variant="contained" color="error">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitsList;

