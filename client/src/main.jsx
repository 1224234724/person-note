import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { getInitialTheme, applyTheme } from './lib/theme.js';
import './index.css';

// Apply saved/system theme before first render to avoid flash
applyTheme(getInitialTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
