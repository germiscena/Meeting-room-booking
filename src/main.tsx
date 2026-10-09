/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { QueryProvider } from './app/providers/QueryProvider';
import './app/index.css';

async function enableMocking() {
  const isDev = import.meta.env.DEV;
  const enableMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true' || isDev;

  if (!enableMocks) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>
  );
});
