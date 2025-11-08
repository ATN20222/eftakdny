import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import '../styles/academicYears.css';

const AcademicYears = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchAcademicYears();
    }
  }, [isAdmin]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academicyears');
      setAcademicYears(response.data);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleOpenModal = (year = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({ name: year.name, description: year.description || '' });
    } else {
      setEditingYear(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingYear(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingYear) {
        await api.put(`/academicyears/${editingYear.id}`, formData);
      } else {
        await api.post('/academicyears', formData);
      }
      handleCloseModal();
      fetchAcademicYears();
      showSnackbar(editingYear ? t('academicYears.updateSuccess') : t('academicYears.createSuccess'), 'success');
    } catch (error) {
      showSnackbar(t('common.error'), 'error');
      console.error('Error saving academic year:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      message: t('academicYears.deleteConfirm'),
      onConfirm: async () => {
        try {
          await api.delete(`/academicyears/${id}`);
          fetchAcademicYears();
          setConfirmDialog({ open: false, message: '', onConfirm: null });
          showSnackbar(t('academicYears.deleteSuccess'), 'success');
        } catch (error) {
          setConfirmDialog({ open: false, message: '', onConfirm: null });
          showSnackbar(t('academicYears.deleteError'), 'error');
          console.error('Error deleting academic year:', error);
        }
      }
    });
  };

  if (!isAdmin()) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
            {t('academicYears.notAuthorized')}
        </Alert>
      </Paper>
    );
  }

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Typography variant="h4" component="h1" className="page-title">
          {t('academicYears.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          {t('academicYears.addYear')}
        </Button>
      </Box>

      {academicYears.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('academicYears.noYears')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {academicYears.map((year) => (
            <Grid item xs={12} sm={6} md={4} key={year.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {year.name}
                  </Typography>
                  {year.description && (
                    <Typography variant="body2" color="text.secondary">
                      {year.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenModal(year)}
                  >
                    {t('common.edit')}
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(year.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
            {editingYear ? t('academicYears.editYear') : t('academicYears.addYearTitle')}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
                label={t('academicYears.yearName')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
                placeholder={t('academicYears.yearNamePlaceholder')}
              margin="normal"
            />
            <TextField
              fullWidth
                label={t('academicYears.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('common.optional')}
              multiline
              rows={3}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} startIcon={<CloseIcon />}>
                {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
                {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogActions>
        </Box>
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

export default AcademicYears;
