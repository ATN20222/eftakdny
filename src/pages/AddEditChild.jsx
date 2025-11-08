import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  IconButton,
  Avatar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import '../styles/addEditChild.css';

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

const AddEditChild = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    latitude: null,
    longitude: null,
    classId: null,
    academicYearId: null,
    parentPhones: [{ phoneNumber: '', relationship: '' }],
    image: null
  });

  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [mapPosition, setMapPosition] = useState([30.0444, 31.2357]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
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

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
    if (isEdit) {
      fetchChild();
    }
  }, [id]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academicyears');
      setAcademicYears(response.data);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchChild = async () => {
    try {
      const response = await api.get(`/children/${id}`);
      const child = response.data;
      setFormData({
        fullName: child.fullName,
        address: child.address || '',
        latitude: child.latitude,
        longitude: child.longitude,
        classId: child.classId,
        academicYearId: child.academicYearId,
        parentPhones: child.parentPhones.length > 0 
          ? child.parentPhones.map(p => ({ phoneNumber: p.phoneNumber, relationship: p.relationship || '' }))
          : [{ phoneNumber: '', relationship: '' }],
        image: null
      });
      if (child.imageUrl) {
        setImagePreview(`http://localhost:5067${child.imageUrl}`);
      }
      if (child.latitude && child.longitude) {
        setMapPosition([child.latitude, child.longitude]);
        setMarkerPosition([child.latitude, child.longitude]);
      }
    } catch (error) {
      console.error('Error fetching child:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : (name === 'classId' || name === 'academicYearId' ? parseInt(value) : value)
    }));
  };

  const handlePhoneChange = (index, field, value) => {
    const newPhones = [...formData.parentPhones];
    newPhones[index][field] = value;
    setFormData(prev => ({ ...prev, parentPhones: newPhones }));
  };

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      parentPhones: [...prev.parentPhones, { phoneNumber: '', relationship: '' }]
    }));
  };

  const removePhone = (index) => {
    if (formData.parentPhones.length > 1) {
      setFormData(prev => ({
        ...prev,
        parentPhones: prev.parentPhones.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapClick = (lat, lng) => {
    setMarkerPosition([lat, lng]);
    setMapPosition([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleLocationFound = (lat, lng) => {
    handleMapClick(lat, lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('address', formData.address || '');
      if (formData.latitude !== null) submitData.append('latitude', formData.latitude);
      if (formData.longitude !== null) submitData.append('longitude', formData.longitude);
      if (formData.classId) submitData.append('classId', formData.classId);
      if (formData.academicYearId) submitData.append('academicYearId', formData.academicYearId);
      // Filter out empty phone numbers and ensure we have valid phone entries
      const validPhones = formData.parentPhones.filter(p => p.phoneNumber && p.phoneNumber.trim() !== '');
      if (validPhones.length > 0) {
        submitData.append('parentPhones', JSON.stringify(validPhones));
      } else {
        submitData.append('parentPhones', '[]');
      }
      if (formData.image) submitData.append('image', formData.image);

      if (isEdit) {
        await api.put(`/children/${id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/children', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

          navigate('/children');
          showSnackbar(isEdit ? t('addEditChild.updateSuccess') : t('addEditChild.createSuccess'), 'success');
        } catch (error) {
          showSnackbar(t('common.error'), 'error');
          console.error('Error saving child:', error);
        } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        {isEdit ? t('addEditChild.editTitle') : t('addEditChild.addTitle')}
      </Typography>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {t('addEditChild.basicInfo')}
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('addEditChild.fullName')}
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label={t('addEditChild.class')}
                name="classId"
                value={formData.classId || ''}
                onChange={handleInputChange}
              >
                <MenuItem value="">{t('addEditChild.selectClass')}</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label={t('addEditChild.academicYear')}
                name="academicYearId"
                value={formData.academicYearId || ''}
                onChange={handleInputChange}
              >
                <MenuItem value="">{t('addEditChild.selectAcademicYear')}</MenuItem>
                {academicYears.map(year => (
                  <MenuItem key={year.id} value={year.id}>{year.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('addEditChild.address')}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  {t('addEditChild.childImage')}
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraIcon />}
                    sx={{ mr: 2 }}
                  >
                    {t('addEditChild.uploadImage')}
                  </Button>
                </label>
                {imagePreview && (
                  <Avatar
                    src={imagePreview}
                    alt="Preview"
                    sx={{ width: 100, height: 100, mt: 2 }}
                    variant="rounded"
                  />
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {t('addEditChild.parentPhones')}
          </Typography>
          
          {formData.parentPhones.map((phone, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label={t('addEditChild.phoneNumber')}
                  value={phone.phoneNumber}
                  onChange={(e) => handlePhoneChange(index, 'phoneNumber', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label={t('addEditChild.relationshipPlaceholder')}
                  value={phone.relationship}
                  onChange={(e) => handlePhoneChange(index, 'relationship', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                {formData.parentPhones.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => removePhone(index)}
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addPhone}
            sx={{ mb: 3 }}
          >
            {t('addEditChild.addPhone')}
          </Button>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            {t('addEditChild.locationOnMap')}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            {t('addEditChild.mapInstructions')}
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Suspense fallback={
                <Box className="map-loading">
                  <CircularProgress />
                </Box>
              }>
                <MapComponent
                  key={`map-${isEdit ? id : 'new'}`}
                  center={mapPosition}
                  zoom={13}
                  style={{ height: '400px', width: '100%' }}
                  onMapClick={handleMapClick}
                  onLocationFound={handleLocationFound}
                  onLocationError={handleLocationError}
                  markerPosition={markerPosition}
                />
              </Suspense>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/children')}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isEdit ? t('common.update') : t('common.create'))}
            </Button>
          </Box>
        </Box>
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

export default AddEditChild;
