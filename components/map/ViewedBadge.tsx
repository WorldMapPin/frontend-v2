// Coral "Viewed" pill shown on the cluster/marker that contains the post the
// user last opened from the map. Absolutely positioned to overlap the
// bottom-right of its (relatively positioned) parent marker so it takes minimal
// extra space while still clearly tagging the selected cluster.

import React from 'react';

export const ViewedBadge = () => {
  return (
    <span
      style={{
        position: 'absolute',
        right: '0',
        bottom: '0',
        transform: 'translate(60%, 55%)',
        background: '#F47C6E',
        color: '#5A0A0A',
        border: '2px solid #FCE3DB',
        borderRadius: '9999px',
        padding: '2px 6px',
        fontWeight: 800,
        fontFamily: 'var(--font-lexend)',
        fontSize: '9px',
        lineHeight: 1,
        boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      Viewed
    </span>
  );
};
