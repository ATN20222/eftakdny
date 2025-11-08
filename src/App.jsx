import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import getTheme from './theme/theme';
import Login from './pages/Login';
import Home from './pages/Home';
import Children from './pages/Children';
import AddEditChild from './pages/AddEditChild';
import ChildDetail from './pages/ChildDetail';
import VisitsList from './pages/VisitsList';
import FindByArea from './pages/FindByArea';
import AcademicYears from './pages/AcademicYears';
import Classes from './pages/Classes';
import './styles/global.css';

function AppContent() {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const theme = getTheme(direction);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <Layout>
                  <Children />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/children/add"
            element={
              <ProtectedRoute>
                <Layout>
                  <AddEditChild />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/children/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <AddEditChild />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/children/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChildDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
              <Route
                path="/visitations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <VisitsList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
          <Route
            path="/find-by-area"
            element={
              <ProtectedRoute>
                <Layout>
                  <FindByArea />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic-years"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AcademicYears />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Classes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
