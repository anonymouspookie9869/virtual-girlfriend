
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
};


export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Define a type that extends NotificationOptions to include 'actions'
type NotificationOptionsWithActions = NotificationOptions & {
  actions?: { action: string; title: string; icon?: string }[];
};

export const showNotification = (title: string, options: NotificationOptionsWithActions) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: { title, options }
        });
    } else if ('Notification' in window && Notification.permission === 'granted') {
        // Fallback for when service worker is not active (e.g., first load)
        // Note: This won't work if the tab is not active on some browsers.
        try {
            // The standard Notification constructor doesn't support 'actions'.
            // We strip it from the options for the fallback.
            const { actions, ...restOptions } = options;
            new Notification(title, restOptions);
        } catch(e) {
            console.error("Notification fallback failed:", e)
        }
    }
};
