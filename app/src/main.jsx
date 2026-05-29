import React from 'react'
import ReactDOM from 'react-dom/client'
import { MaintenanceProvider } from './MaintenanceContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MaintenanceProvider>
      <App />
    </MaintenanceProvider>
  </React.StrictMode>,
)
