import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress unhandled HTMLMediaElement media decoder errors in headless or sandbox browsers
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const isMediaError =
        (event.message && typeof event.message === 'string' && event.message.includes('has no supported sources')) ||
        event.target instanceof HTMLMediaElement;
      if (isMediaError) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
