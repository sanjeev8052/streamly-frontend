import React from 'react';

export default function MobileContainer({ children }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      height: '100dvh',
      margin: '0 auto',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(0, 0, 0, 0.08)'
    }}>
      <div className="app-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}


