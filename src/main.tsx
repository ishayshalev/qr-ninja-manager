import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App.tsx';
import './index.css';

posthog.init('phc_YoszH3JrbJAn7S5741uJUqo0Qgex7Ti0Y77G9XhWITz', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') posthog.debug();
  },
  autocapture: true,
  capture_pageview: true,
  persistence: 'localStorage',
});

createRoot(document.getElementById("root")!).render(<App />);