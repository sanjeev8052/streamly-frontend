import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, ShieldCheck, Video } from 'lucide-react';

export default function OutgoingCallModal({ contact, callType = 'video', onCancel }) {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    let stream;
    async function startPreview() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('Preview play error:', e));
          }
          setHasCamera(true);
        }
      } catch (err) {
        console.warn('Outgoing call preview camera error:', err);
      }
    }

    startPreview();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      background: '#020617',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 24px',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Live Self Camera Video Preview Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
          opacity: 0.6,
          display: hasCamera ? 'block' : 'none'
        }}
      />

      {/* Soft Dark Vignette Overlay for Crisp UI Contrast */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(2, 6, 23, 0.5) 40%, rgba(2, 6, 23, 0.9) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Top Header Overlay */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(56, 189, 248, 0.2)',
          backdropFilter: 'blur(10px)',
          color: '#38bdf8',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          <ShieldCheck size={14} />
          <span>Streamly Live HD Video Call</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
          {contact?.name || contact?.fullName || contact?.username || 'Streamly User'}
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
          Ringing recipient...
        </p>
      </div>

      {/* Recipient Avatar with Ringing Pulse */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.3)',
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
        }} />
        <img
          src={contact?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact?.username || 'user'}`}
          alt={contact?.name}
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid #38bdf8',
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
          }}
        />
      </div>

      {/* Cancel Call Action Button */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onCancel}
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
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.5)'
          }}
        >
          <PhoneOff size={28} />
        </button>
        <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>Cancel Call</span>
      </div>
    </div>
  );
}
