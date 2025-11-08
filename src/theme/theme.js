import { createTheme } from '@mui/material/styles';

const getTheme = (direction = 'ltr') => {
  return createTheme({
    direction: direction,
    palette: {
      primary: {
        main: '#3498db',
      },
      secondary: {
        main: '#2ecc71',
      },
      success: {
        main: '#2ecc71',
        light: '#58d68d',
        dark: '#27ae60',
      },
      error: {
        main: '#e74c3c',
        light: '#ec7063',
        dark: '#c0392b',
      },
      warning: {
        main: '#f39c12',
      },
      info: {
        main: '#3498db',
      },
      background: {
        default: '#f5f7fa',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: direction === 'rtl' 
        ? [
            'Arial',
            'Tahoma',
            'sans-serif',
          ].join(',')
        : [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            padding: '10px 24px',
            borderRadius: '8px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          },
        },
      },
    },
  });
};

export default getTheme;

