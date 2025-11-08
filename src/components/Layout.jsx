import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Typography,
  Button,
  Avatar,
  useMediaQuery,
  useTheme,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Select,
  FormControl
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Map as MapIcon,
  Search as SearchIcon,
  Book as BookIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  School as SchoolIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import '../styles/layout.css';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageAnchor(null);
  };

  const menuItems = [
    { path: '/', label: t('navigation.home'), icon: <HomeIcon /> },
    { path: '/children', label: t('navigation.children'), icon: <PeopleIcon /> },
    { path: '/children/add', label: t('navigation.addChild'), icon: <PersonAddIcon /> },
    { path: '/visitations', label: t('navigation.visitations'), icon: <MapIcon /> },
    { path: '/find-by-area', label: t('navigation.findByArea'), icon: <SearchIcon /> },
    { path: '/classes', label: t('navigation.classes'), icon: <SchoolIcon /> },
  ];

  if (isAdmin()) {
    menuItems.push({ path: '/academic-years', label: t('navigation.academicYears'), icon: <BookIcon /> });
  }

  const isRTL = muiTheme.direction === 'rtl';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#2c3e50', color: 'white' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
          {t('login.title')}
        </Typography>
      </Box>
      
      <List sx={{ flex: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  ...(isRTL 
                    ? { borderRight: isActive ? '3px solid #3498db' : '3px solid transparent' }
                    : { borderLeft: isActive ? '3px solid #3498db' : '3px solid transparent' }
                  ),
                  bgcolor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'inherit', 
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#3498db' }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
              {user?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ textTransform: 'none' }}
        >
          {t('common.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ...(isRTL 
            ? { mr: { md: `${drawerWidth}px` } }
            : { ml: { md: `${drawerWidth}px` } }
          ),
          bgcolor: '#2c3e50',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('login.title')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
            >
              <MenuItem value="ar">العربية</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 },
          ...(isRTL ? { order: 2 } : { order: 1 })
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          anchor={isRTL ? 'right' : 'left'}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#2c3e50',
              ...(isRTL ? { borderLeft: 'none' } : { borderRight: 'none' }),
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f5f7fa',
          mt: 8,
          ...(isRTL ? { order: 1 } : { order: 2 })
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
