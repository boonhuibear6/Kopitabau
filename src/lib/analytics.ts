// Simple analytics - only essential tracking
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Simple GA4 initialization
export const initializeGA4 = () => {
  // Only initialize if GA4 ID is provided
  const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (!GA4_MEASUREMENT_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag = window.gtag || function() {
    (window.gtag.q = window.gtag.q || []).push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID);
};

// Simple tracking functions
export const trackViewMenu = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_menu');
  }
};

export const trackAddToCart = (itemName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      item_name: itemName,
    });
  }
};

export const trackCheckoutStart = (cartTotal: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      value: cartTotal,
      currency: 'MYR',
    });
  }
};

// Placeholder functions for compatibility
export const trackCustomize = () => {};
export const trackMenuTabSwitch = () => {};
export const trackQuickAdd = () => {};
export const trackCustomizationChange = () => {};
export const trackFormFieldFocus = () => {};
export const trackFormSubmission = () => {};
