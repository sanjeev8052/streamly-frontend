import React from 'react';
import { Phone, Video, ArrowDownLeft, ArrowUpRight, PhoneMissed } from 'lucide-react';

export default function CallsList({ callLogs = [], onStartCall }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
          Calls
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
          Recent 1-on-1 WebRTC Calls
        </p>
      </div>

      {/* Call Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {callLogs.map((log) => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid #f8fafc',
              cursor: 'pointer'
            }}
          >
            {/* Avatar */}
            <img
              src={log.user.avatar}
              alt={log.user.name}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginRight: '14px' }}
            />

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>
                {log.user.name}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748b' }}>
                {log.direction === 'incoming' && <ArrowDownLeft size={14} style={{ color: '#10b981' }} />}
                {log.direction === 'outgoing' && <ArrowUpRight size={14} style={{ color: '#2563eb' }} />}
                {log.direction === 'missed' && <PhoneMissed size={14} style={{ color: '#ef4444' }} />}

                <span>{log.time}</span>
                {log.duration !== '00:00' && (
                  <span style={{ fontWeight: '500', color: '#334155' }}>• {log.duration}</span>
                )}
              </div>
            </div>

            {/* Direct Call Launch Icon */}
            <button
              onClick={() => onStartCall(log.user, log.type)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#eff6ff',
                border: 'none',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {log.type === 'video' ? <Video size={18} /> : <Phone size={18} />}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
