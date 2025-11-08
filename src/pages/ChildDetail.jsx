import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Grid,
  Divider,
  TextField,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import '../styles/childDetail.css';

const ChildDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingVisit, setEditingVisit] = useState(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    fetchChild();
  }, [id]);

  const fetchChild = async () => {
    try {
      const response = await api.get(`/children/${id}`);
      setChild(response.data);
    } catch (error) {
      console.error('Error fetching child:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVisit = (visit) => {
    setEditingVisit(visit);
    setVisitNotes(visit.notes || '');
  };

  const handleUpdateVisit = async () => {
    try {
      await api.put(`/visits/${editingVisit.id}`, { notes: visitNotes });
      setEditingVisit(null);
      setVisitNotes('');
      fetchChild();
      showSnackbar(t('childDetail.updateSuccess'), 'success');
    } catch (error) {
      showSnackbar(t('common.error'), 'error');
      console.error('Error updating visit:', error);
    }
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (!child) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {t('childDetail.childNotFound')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/children')}
          sx={{ mb: 2 }}
        >
          {t('childDetail.backToChildren')}
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/children/${id}/edit`)}
        >
          {t('childDetail.editChild')}
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {child.imageUrl && (
              <Avatar
                src={`http://localhost:5067${child.imageUrl}`}
                alt={child.fullName}
                sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}
                variant="rounded"
              />
            )}
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {child.fullName}
            </Typography>
            {child.address && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                <strong>{t('childDetail.address')}:</strong> {child.address}
              </Typography>
            )}
            {child.className && (
              <Typography variant="body1" gutterBottom>
                <strong>{t('childDetail.class')}:</strong> {child.className}
              </Typography>
            )}
            {child.academicYearName && (
              <Typography variant="body1" gutterBottom>
                <strong>{t('childDetail.academicYear')}:</strong> {child.academicYearName}
              </Typography>
            )}
            {child.latitude && child.longitude && (
              <Chip
                icon={<LocationOnIcon />}
                label={t('childDetail.locationSavedOnMap')}
                color="success"
                sx={{ mt: 1 }}
              />
            )}
            {child.parentPhones.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {t('childDetail.parentPhoneNumbers')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {child.parentPhones.map((phone, idx) => (
                    <Chip
                      key={idx}
                      label={`${phone.phoneNumber}${phone.relationship ? ` (${phone.relationship})` : ''}`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('childDetail.visitsHistory')}
        </Typography>
        {child.visits && child.visits.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('childDetail.noVisits')}
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {child.visits && child.visits.map((visit) => (
              <Card key={visit.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {visit.userName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(visit.visitDate).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    {editingVisit?.id === visit.id ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" color="success" onClick={handleUpdateVisit}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setEditingVisit(null)}>
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditVisit(visit)}
                      >
                        {t('childDetail.editNotes')}
                      </Button>
                    )}
                  </Box>
                  
                  {editingVisit?.id === visit.id ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder={t('childDetail.visitNotesPlaceholder')}
                    />
                  ) : (
                    visit.notes && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {visit.notes}
                      </Typography>
                    )
                  )}
                  
                  {visit.visitLatitude && visit.visitLongitude && (
                    <Chip
                      icon={<LocationOnIcon />}
                      label={t('childDetail.locationRecorded')}
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  )}
                  {visit.locationSavedToChild && (
                    <Chip
                      label={t('childDetail.locationSavedToChild')}
                      size="small"
                      color="info"
                      sx={{ mt: 1, ml: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
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

export default ChildDetail;
