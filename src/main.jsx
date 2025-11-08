import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './i18n/config'

// Import Leaflet CSS globally
import 'leaflet/dist/leaflet.css'

// Removed StrictMode to prevent double mounting which causes map initialization issues
createRoot(document.getElementById('root')).render(
  <App />
)
