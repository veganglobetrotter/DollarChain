// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Load app-level styles first so they provide the baseline theme/layout.
// Then load index.css (page-specific and overrides) so it can override safely.
import './App.css';
import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
