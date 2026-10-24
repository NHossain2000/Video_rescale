// main.tsx — Application entry point with self-hosted fonts
import React from 'react';
import ReactDOM from 'react-dom/client';

// Self-hosted fonts (no external third-party requests)
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '@fontsource/dm-mono/index.css';

import './styles/base.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
