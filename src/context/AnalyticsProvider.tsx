import React, { ReactNode } from 'react';
import { PostHogProvider } from '@posthog/react';

interface AnalyticsProviderProps {
  children: ReactNode;
}

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  defaults: '2026-01-30',
} as const;

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider apiKey={apiKey} options={options}>
      {children}
    </PostHogProvider>
  );
};

// Re-export hook if needed for compatibility (though usePostHog is standard)
import { usePostHog } from '@posthog/react';

export const useAnalytics = () => {
  const posthog = usePostHog();
  
  return {
    track: (event: string, properties?: Record<string, any>) => {
      posthog.capture(event, properties);
    },
    // Add other methods if needed to match previous AnalyticsContextType
    identify: (distinctId: string, userProperties?: Record<string, any>) => {
      posthog.identify(distinctId, userProperties);
    },
    page: (name: string, properties?: Record<string, any>) => {
      posthog.capture('$pageview', { ...properties, page_name: name });
    }
  };
};

export { usePostHog as useAnalyticsInstance } from '@posthog/react';
