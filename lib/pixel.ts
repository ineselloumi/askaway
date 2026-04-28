declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackSearch() {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'Search');
  }
}
