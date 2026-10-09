/**
 * Service Worker Registration for AQUASENSE PWA
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[AQUASENSE PWA] Service Worker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[AQUASENSE PWA] New update available. Reload to refresh.');
                  } else {
                    console.log('[AQUASENSE PWA] App ready for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[AQUASENSE PWA] Service Worker registration failed:', error);
        });
    });
  }
}
