import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for PWA support and automatic updates
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Nova versão ativada. Atualizando aplicação...');
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Verifica ativamente se há nova versão no servidor
        reg.update().catch(() => {});

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Nova versão detectada. Aplicando atualização...');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker:', err);
      });
  });
}
