import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Home.css'
import api from '../services/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  Map as MapIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import '../styles/home.css';

const Home = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalUsers: 0,
    totalVisits: 0,
    recentVisits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: t('home.totalChildren'),
      value: stats.totalChildren,
      icon: <PeopleIcon />,
      color: '#3498db'
    },
    {
      title: t('home.totalUsers'),
      value: stats.totalUsers,
      icon: <PersonIcon />,
      color: '#2ecc71'
    },
    {
      title: t('home.totalVisits'),
      value: stats.totalVisits,
      icon: <MapIcon />,
      color: '#e74c3c'
    }
  ];

  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom className="page-title">
        {t('home.title')}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className="stat-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: card.color, width: 64, height: 64 }}>
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={2} className="recent-visits-card">
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {t('home.recentVisits')}
          </Typography>
          {stats.recentVisits?.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('home.noRecentVisits')}
            </Typography>
          ) : (
            <List>
              {stats.recentVisits?.map((visit) => (
                <ListItem key={visit.id} className="visit-item text-justify">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#3498db' }}>
                      <TimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={visit.childName}
                    secondary={`${t('childDetail.visitedBy')} ${visit.userName} • ${new Date(visit.visitDate).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
