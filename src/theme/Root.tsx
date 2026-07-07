import React, {useEffect} from 'react';
import {useLocation} from '@docusaurus/router';

declare global {
  interface Window {
    _paq: any[];
  }
}

const MATOMO_URL = 'https://analytics.laravel-chronicle.dev/';
const SITE_ID = '1';

export default function Root({
                               children,
                             }: {
  children: React.ReactNode;
}): React.ReactElement {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window._paq) {
      window._paq = [];

      window._paq.push(['setTrackerUrl', `${MATOMO_URL}matomo.php`]);
      window._paq.push(['setSiteId', SITE_ID]);
      window._paq.push(['enableLinkTracking']);

      // window._paq.push(['disableCookies']);

      const script = document.createElement('script');
      script.async = true;
      script.src = `${MATOMO_URL}matomo.js`;

      document.head.appendChild(script);
    }

    window._paq.push(['setCustomUrl', window.location.pathname + window.location.search]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
  }, [location]);

  return <>{children}</>;
}
