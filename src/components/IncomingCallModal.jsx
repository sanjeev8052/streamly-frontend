import React from 'react';
import { Phone, PhoneOff, Video, ShieldCheck } from 'lucide-react';

export default function IncomingCallModal({ caller, callType = 'video', onAccept, onDecline }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 24px',
      color: 'white'
    }}>
      {/* Top Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          <ShieldCheck size={14} />
          <span>Incoming HD {callType === 'video' ? 'Video' : 'Audio'} Call</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
          {caller?.fullName || caller?.name || caller?.username || 'Streamly User'}
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
          Calling you...
        </p>
      </div>

      {/* Avatar with Pulsing Ring Animation */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(37, 99, 235, 0.2)',
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
        }} />
        <img
          src={caller?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${caller?.username || 'user'}`}
          alt={caller?.fullName}
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid #38bdf8',
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>

      {/* Accept / Decline Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px', width: '100%', justifyContent: 'center' }}>
        {/* Decline Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onDecline}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneOff size={28} />
          </button>
          <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>Decline</span>
        </div>

        {/* Accept Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onAccept}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#10b981',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)'
            }}
          >
            {callType === 'video' ? <Video size={30} /> : <Phone size={30} />}
          </button>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Accept</span>
        </div>
      </div>
    </div>
  );
}
