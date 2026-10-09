import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider';
import { ErrorBoundary } from './components/ErrorBoundary';

// Suppress Vite HMR / WebSocket and known harmless network errors from bubbling up to UI
window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || event.reason?.toString() || "";
  if (
    msg.includes("WebSocket") ||
    msg.includes("closed without opened") ||
    msg.includes("Failed to fetch") ||
    msg.includes("Refresh Token") ||
    msg.includes("network") ||
    msg.includes("Load failed")
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
