import React from 'react';
import { MessageSquare, Phone, Video, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange, onQuickCall }) {
  return (
    <div className="bottom-nav">
      {/* Chats Tab */}
      <button
        onClick={() => onTabChange('chats')}
        className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
      >
        <MessageSquare size={22} />
        <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>Chats</span>
      </button>

      {/* Calls Tab */}
      <button
        onClick={() => onTabChange('calls')}
        className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
      >
        <Phone size={22} />
        <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>Calls</span>
      </button>

      {/* Center Quick Call Action Button */}
      <button
        onClick={onQuickCall}
        className="nav-item-center"
        title="Start 1-on-1 Video Call"
      >
        <Video size={24} />
      </button>

      {/* Settings Tab */}
      <button
        onClick={() => onTabChange('settings')}
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
      >
        <Settings size={22} />
        <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>Settings</span>
      </button>
    </div>
  );
}
