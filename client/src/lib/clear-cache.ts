// Helper function to clear all cached data
export function clearAllCache() {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear any IndexedDB data (Supabase might use this)
  if ('indexedDB' in window) {
    indexedDB.deleteDatabase('supabase-js-db');
  }
  
  // Clear service worker cache if any
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  console.log('All cache cleared successfully');
}