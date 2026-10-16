import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/baloo-2/400.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import './styles/global.css';
import { App } from './app/App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Element root tidak ditemukan pada dokumen HTML!');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
