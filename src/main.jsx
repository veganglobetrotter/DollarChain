// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Load App-level styles first so page-specific/index.css can override them.
import './App.css';
import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
