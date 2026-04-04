import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import posthog from 'posthog-js';

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (distinctId: string, userProperties?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_POSTHOG_KEY;
    const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey) {
      posthog.init(apiKey, {
        api_host: apiHost,
        autocapture: true,
        capture_pageview: true,
        persistence: 'localStorage',
        property_blacklist: ['$current_url'],
      });
    }
  }, []);

  const track = (event: string, properties?: Record<string, any>) => {
    // Current implementation uses PostHog, but can be easily swapped or augmented
    posthog.capture(event, properties);
  };

  const identify = (distinctId: string, userProperties?: Record<string, any>) => {
    posthog.identify(distinctId, userProperties);
  };

  const page = (name: string, properties?: Record<string, any>) => {
    posthog.capture('$pageview', { ...properties, page_name: name });
  };

  return (
    <AnalyticsContext.Provider value={{ track, identify, page }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
