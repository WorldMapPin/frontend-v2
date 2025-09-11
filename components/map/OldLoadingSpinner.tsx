// Old loading spinner component from OLDMAPCODE
// Recreates the original loading experience with logo spinning animation

import React from 'react';

interface OldLoadingSpinnerProps {
  message?: string;
}

export const OldLoadingSpinner: React.FC<OldLoadingSpinnerProps> = ({ 
  message = "Getting pins..." 
}) => {
  return (
    <div className="loader-container">
      <div className="loader">
        <img src="/images/worldmappin-logo.png" alt="WorldMapPin Logo" />
      </div>
      <p>{message}</p>
    </div>
  );
};

export default OldLoadingSpinner;
