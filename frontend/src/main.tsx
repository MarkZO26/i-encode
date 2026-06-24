import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App.tsx'
// Palitan ang './index.css' ng tamang path:

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)