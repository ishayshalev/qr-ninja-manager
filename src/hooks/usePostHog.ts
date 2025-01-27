import posthog from 'posthog-js';

export const usePostHog = () => {
  const capture = (eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, properties);
  };

  const identify = (distinctId: string, properties?: Record<string, any>) => {
    posthog.identify(distinctId, properties);
  };

  return {
    capture,
    identify,
    posthog, // Expose the raw posthog instance if needed
  };
};