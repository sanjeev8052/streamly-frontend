import React, { useState } from 'react';
import { Search, Plus, Camera, CheckCheck, MessageSquare } from 'lucide-react';


export default function ChatsList({ contacts = [], currentUser, onSelectChat, onStartCall }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', overflow: 'hidden' }}>
      
      {/* Top Header */}
      <div style={{ padding: '16px 20px 12px 20px', background: '#ffffff', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>
            Chats
          </h1>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }}></span>
            <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: '#94a3b8' }}></span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 46px',
              borderRadius: '16px',
              border: '1px solid #f1f5f9',
              background: '#f8fafc',
              fontSize: '14px',
              color: '#0f172a',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </div>



      {/* Main Chat List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {filteredContacts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <MessageSquare size={26} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>No Registered Users Yet</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, maxWidth: '240px', lineHeight: '1.4' }}>
              When other users register in Streamly, they will appear here automatically for 1-on-1 calls and chat!
            </p>
          </div>
        ) : (

          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectChat(contact)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar with Online Badge */}
              <div style={{ position: 'relative', marginRight: '14px' }}>
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                />
                {contact.isOnline && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #ffffff'
                  }} />
                )}
              </div>

              {/* Chat Info */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {contact.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                    {contact.time}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{
                    fontSize: '13px',
                    color: contact.lastMessage.includes('typing') ? '#2563eb' : '#64748b',
                    fontWeight: contact.unreadCount > 0 ? '600' : '400',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    margin: 0
                  }}>
                    {contact.lastMessage}
                  </p>

                  {/* Unread Pill Badge or Check Icon */}
                  {contact.unreadCount > 0 ? (
                    <span style={{
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px'
                    }}>
                      {contact.unreadCount}
                    </span>
                  ) : (
                    <CheckCheck size={16} style={{ color: '#3b82f6' }} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button (Blue Quick Camera / Call Action) */}
      <div style={{
        position: 'absolute',
        bottom: '88px',
        right: '20px',
        zIndex: 50
      }}>
        <button
          onClick={() => onStartCall(contacts[0])}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Camera size={24} />
        </button>
      </div>

    </div>
  );
}
