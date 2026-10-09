/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { QueryProvider } from './app/providers/QueryProvider';
import './app/index.css';

async function enableMocking() {
  // If an external backend API URL is configured or mocks are explicitly disabled, bypass MSW
  if (import.meta.env.VITE_DISABLE_MOCKS === 'true' || Boolean(import.meta.env.VITE_API_URL)) {
    return;
  }

  try {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      onUnhandledRequest: 'bypass',
    });
  } catch (error) {
    console.warn('[MSW] Failed to start Mock Service Worker:', error);
  }
}

enableMocking().catch(console.error).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>
  );
});
