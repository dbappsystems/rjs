import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../rjs-hauling-app.jsx';

// window.storage polyfill — maps Claude artifact storage API to localStorage
window.storage = {
  get: async (key) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? { key, value: v } : null;
    } catch { return null; }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, String(value));
      return { key, value };
    } catch { return null; }
  },
  delete: async (key) => {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch { return null; }
  },
  list: async (prefix) => {
    try {
      const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
      return { keys };
    } catch { return { keys: [] }; }
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
