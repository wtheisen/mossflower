import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';
const LANDSCAPE_QUERY = '(orientation: landscape)';

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LANDSCAPE_QUERY).matches : false
  );

  useEffect(() => {
    const mobileMatch = window.matchMedia(MOBILE_QUERY);
    const landscapeMatch = window.matchMedia(LANDSCAPE_QUERY);

    const onMobileChange = (e) => setIsMobile(e.matches);
    const onLandscapeChange = (e) => setIsLandscape(e.matches);

    mobileMatch.addEventListener('change', onMobileChange);
    landscapeMatch.addEventListener('change', onLandscapeChange);

    return () => {
      mobileMatch.removeEventListener('change', onMobileChange);
      landscapeMatch.removeEventListener('change', onLandscapeChange);
    };
  }, []);

  return { isMobile, isLandscape };
}
