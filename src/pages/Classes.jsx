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
  Avatar,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import '../styles/classes.css';

const Classes = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
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
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({ name: classItem.name, description: classItem.description || '' });
    } else {
      setEditingClass(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, formData);
      } else {
        await api.post('/classes', formData);
      }
      handleCloseModal();
      fetchClasses();
      showSnackbar(editingClass ? t('classes.updateSuccess') : t('classes.createSuccess'), 'success');
    } catch (error) {
      showSnackbar(t('common.error'), 'error');
      console.error('Error saving class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      message: t('classes.deleteConfirm'),
      onConfirm: async () => {
        try {
          await api.delete(`/classes/${id}`);
          fetchClasses();
          setConfirmDialog({ open: false, message: '', onConfirm: null });
          showSnackbar(t('classes.deleteSuccess'), 'success');
        } catch (error) {
          setConfirmDialog({ open: false, message: '', onConfirm: null });
          showSnackbar(t('classes.deleteError'), 'error');
          console.error('Error deleting class:', error);
        }
      }
    });
  };

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Typography variant="h4" component="h1" className="page-title">
          {t('classes.title')}
        </Typography>
        {isAdmin() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            {t('classes.addClass')}
          </Button>
        )}
      </Box>

      {classes.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {t('classes.noClasses')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {classes.map((classItem) => (
            <Grid item xs={12} sm={6} md={4} key={classItem.id}>
              <Card className="class-card">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {classItem.name}
                      </Typography>
                      {classItem.description && (
                        <Typography variant="body2" color="text.secondary">
                          {classItem.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                {isAdmin() && (
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenModal(classItem)}
                    >
                      {t('common.edit')}
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(classItem.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {isAdmin() && (
        <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingClass ? t('classes.editClass') : t('classes.addClassTitle')}
          </DialogTitle>
          <Box component="form" onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label={t('classes.className')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={t('classes.classNamePlaceholder')}
                margin="normal"
              />
              <TextField
                fullWidth
                label={t('classes.description')}
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
      )}

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

export default Classes;

