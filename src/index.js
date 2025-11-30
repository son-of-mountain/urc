import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { setSession } from './store/authSlice';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Hydrate Redux store from sessionStorage if a session exists
try {
  const token = sessionStorage.getItem('token');
  if (token) {
    const username = sessionStorage.getItem('username') || null;
    const externalId = sessionStorage.getItem('externalId') || null;
    const idRaw = sessionStorage.getItem('id');
    const id = idRaw ? Number(idRaw) : null;
    store.dispatch(setSession({ token, username, externalId, id }));
  }
} catch (e) {
  console.warn('Could not read sessionStorage', e);
}

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

reportWebVitals(console.log);