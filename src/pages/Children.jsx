import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import '../styles/children.css';

const Children = () => {
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/children');
      setChildren(response.data);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchChildren();
      return;
    }

    try {
      const response = await api.get(`/children?search=${encodeURIComponent(searchTerm)}`);
      setChildren(response.data);
    } catch (error) {
      console.error('Error searching children:', error);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      message: t('children.deleteConfirm'),
      onConfirm: async () => {
        try {
          await api.delete(`/children/${id}`);
          fetchChildren();
          setConfirmDialog({ open: false, message: '', onConfirm: null });
          showSnackbar(t('children.deleteSuccess'), 'success');
        } catch (error) {
          setConfirmDialog({ open: false, message: '', onConfirm: null });
          showSnackbar(t('common.error'), 'error');
          console.error('Error deleting child:', error);
        }
      }
    });
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Typography variant="h4" component="h1" className="page-title">
          {t('children.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/children/add')}
          size="large"
        >
          {t('children.addChild')}
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder={t('children.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            {t('common.search')}
          </Button>
        </Box>
      </Paper>

      {children.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('children.noChildren')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {children.map((child) => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <Card className="child-card">
                {child.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`http://localhost:5067${child.imageUrl}`}
                    alt={child.fullName}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
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
                    <Chip label={`${t('children.class')}: ${child.className}`} size="small" sx={{ mr: 1, mb: 1 }} />
                  )}
                  {child.academicYearName && (
                    <Chip label={`${t('children.year')}: ${child.academicYearName}`} size="small" sx={{ mb: 1 }} />
                  )}
                  {child.parentPhones.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {child.parentPhones.map((phone, idx) => (
                        <Chip
                          key={idx}
                          label={phone.phoneNumber}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/children/${child.id}`)}
                  >
                    {t('common.view')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/children/${child.id}/edit`)}
                  >
                    {t('common.edit')}
                  </Button>
                  {isAdmin() && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(child.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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

export default Children;
