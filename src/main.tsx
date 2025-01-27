import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App.tsx';
import './index.css';

// Initialize PostHog
posthog.init(
  'your-project-api-key', // You'll need to replace this with your actual PostHog API key
  {
    api_host: 'https://app.posthog.com', // or your self-hosted instance URL
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
  }
);

createRoot(document.getElementById("root")!).render(<App />);