// Central dev mode configuration
// Set to false for production builds

export const DEV_MODE = true;

// Dev mode feature flags (only apply when DEV_MODE is true)
export const devConfig = {
  // Debug overlays
  showVisitorIntent: true,

  // Quick setup
  autoPlaceParkEntryExit: false,
  startingMoney: 5000, // Override default 1000

  // Logging
  logEmotionChanges: false,
  logPurchases: false,
  logExits: false,
};

// Runtime toggle for dev config (allows changing without reload)
export const setDevConfig = <K extends keyof typeof devConfig>(
  key: K,
  value: (typeof devConfig)[K],
) => {
  devConfig[key] = value;
};

// Expose to window for console access
if (DEV_MODE && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__devConfig = devConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__setDevConfig = setDevConfig;
}
