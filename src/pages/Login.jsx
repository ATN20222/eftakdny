import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import '../styles/login.css';

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Box className="login-container">
      <Container maxWidth="sm">
        <Paper elevation={8} className="login-card">
          <Box className="login-header">
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              {t('login.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('login.subtitle')}
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} className="login-form">
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label={t('login.username')}
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              margin="normal"
              autoComplete="username"
            />
            
            <TextField
              fullWidth
              label={t('login.password')}
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="current-password"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? t('common.loading') : t('login.loginButton')}
            </Button>
          </Box>
          
          <Box className="login-footer">
            <Typography variant="caption" color="text.secondary">
              {t('login.defaultCredentials')}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
