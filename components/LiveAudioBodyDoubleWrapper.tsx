import React, { useEffect, useRef } from 'react';

// Define the expected interface for the Lit element's methods
interface LiveAudioBodyDoubleElement extends HTMLElement {
  apiKey: string;
  activateSession: () => void;
  deactivateSession: () => void;
}

interface LiveAudioBodyDoubleWrapperProps {
  apiKey: string;
  isActive: boolean;
}

export const LiveAudioBodyDoubleWrapper: React.FC<LiveAudioBodyDoubleWrapperProps> = ({ apiKey, isActive }) => {
  const litElementRef = useRef<LiveAudioBodyDoubleElement | null>(null);

  useEffect(() => {
    const element = litElementRef.current;
    if (element) {
      // Update the apiKey on the element if it changes.
      // Lit's @property decorator should handle attribute-to-property syncing,
      // but direct property setting can be more explicit if needed.
      if (element.apiKey !== apiKey) {
        element.apiKey = apiKey;
      }

      if (isActive) {
        // Check if method exists before calling, as a safeguard
        if (typeof element.activateSession === 'function') {
          element.activateSession();
        } else {
          console.warn('activateSession method not found on gdm-live-audio-body-double element.');
        }
      } else {
        if (typeof element.deactivateSession === 'function') {
          element.deactivateSession();
        } else {
          console.warn('deactivateSession method not found on gdm-live-audio-body-double element.');
        }
      }
    }
  }, [isActive, apiKey]); // Rerun if isActive or apiKey changes

  useEffect(() => {
    // Cleanup on unmount
    const element = litElementRef.current;
    return () => {
      if (element) {
        if (typeof element.deactivateSession === 'function') {
          element.deactivateSession();
        }
      }
    };
  }, []);

  // Use kebab-case for the custom element tag name in JSX
  // Pass api-key as an attribute. Lit's @property({ attribute: 'api-key' }) handles it.
  // The type for 'gdm-live-audio-body-double' and 'api-key' attribute is defined in global.d.ts
  return <gdm-live-audio-body-double ref={litElementRef} api-key={apiKey}></gdm-live-audio-body-double>;
};