import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Video, Phone, Send, Image as ImageIcon,
  Mic, Camera, Play, Pause, Smile, CheckCheck, Paperclip
} from 'lucide-react';

export default function ChatRoom({ contact, messages = [], onSendMessage, onStartVideoCall, onStartAudioCall, onBack }) {
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({
      id: Date.now().toString(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setInputText('');
    toast.success('Message sent', { duration: 1500 });
  };

  // Voice note play/pause simulation
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      toast('Playing voice note (0:13)', { icon: '🎵' });
    }
  };

  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const handleAttachPhoto = () => {
    onSendMessage({
      id: Date.now().toString(),
      sender: 'me',
      type: 'image_grid',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1476514525535-ce74f45814d3?auto=format&fit=crop&w=400&q=80'
      ],
      caption: 'Sent photo attachment',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    toast.success('Photos attached!');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#f3f5fa', position: 'relative' }}>
      
      {/* Top Header Bar */}
      <div style={{
        padding: '12px 16px',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 10,
        flexShrink: 0
      }}>

        {/* Back Arrow & User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <ArrowLeft size={22} />
          </button>

          <div style={{ position: 'relative' }}>
            <img
              src={contact?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
              alt={contact?.name}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
            />
            {contact?.isOnline && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid white'
              }} />
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>
              {contact?.name || 'Leslie Rajora'}
            </h2>
            <span style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '500' }}>
              {contact?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Video & Voice Call Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onStartVideoCall(contact)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Video size={18} />
          </button>

          <button
            onClick={() => onStartAudioCall(contact)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Phone size={18} />
          </button>
        </div>
      </div>

      {/* Messages Timeline Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';

          // Photo Grid Attachment Message (Matching Reference Image Screen 3!)
          if (msg.type === 'image_grid') {
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* 4-Image Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  {msg.images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt="Vacation attachment"
                      style={{ width: '100%', height: '90px', objectFit: 'cover' }}
                    />
                  ))}
                </div>

                {msg.caption && (
                  <p style={{ fontSize: '13px', color: '#334155', padding: '4px 6px', margin: 0 }}>
                    {msg.caption}
                  </p>
                )}
                
                <div style={{ textAlign: 'right', fontSize: '10px', color: '#94a3b8', marginTop: '4px', paddingRight: '4px' }}>
                  {msg.time}
                </div>
              </div>
            );
          }

          // Voice Note Message (Matching Reference Image Screen 3 Voice Note Player!)
          if (msg.type === 'audio') {
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  background: isMe ? '#2563eb' : '#ffffff',
                  color: isMe ? '#ffffff' : '#0f172a',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '220px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayAudio}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isMe ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                    border: 'none',
                    color: isMe ? '#ffffff' : '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isPlayingAudio ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                </button>

                {/* Animated Voice Waveform */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                  {[12, 20, 8, 24, 16, 28, 10, 22, 14, 26, 18, 10, 22, 14].map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '3px',
                        height: isPlayingAudio ? `${Math.max(6, (h * (audioProgress + 20)) % 28)}px` : `${h}px`,
                        background: isMe ? '#ffffff' : '#2563eb',
                        borderRadius: '2px',
                        opacity: idx / 14 * 100 <= audioProgress ? 1 : 0.5,
                        transition: 'height 0.15s ease'
                      }}
                    />
                  ))}
                </div>

                <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600' }}>
                  {msg.audioDuration || '0:13'}
                </span>
              </div>
            );
          }

          // Regular Text Message Bubbles
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <div className={isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                {msg.text}
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', padding: '0 4px' }}>
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Toolbar (Exactly matching Reference Image Screen 3!) */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        width: '100%',
        background: '#0f172a',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>

        {/* Attachment Photo Button */}
        <button
          onClick={handleAttachPhoto}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <Paperclip size={20} />
        </button>

        {/* Text Field Input */}
        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Type here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              width: '100%',
              background: '#1e293b',
              border: 'none',
              borderRadius: '24px',
              padding: '11px 18px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </form>

        {/* Camera Quick Button */}
        <button
          onClick={() => toast('Camera capture triggered', { icon: '📸' })}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <Camera size={20} />
        </button>

        {/* Voice Note Recording Mic Button / Send Button */}
        {inputText.trim() ? (
          <button
            onClick={handleSend}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            onClick={() => {
              onSendMessage({
                id: Date.now().toString(),
                sender: 'me',
                type: 'audio',
                audioDuration: '0:13',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
              toast.success('Voice message recorded & sent!');
            }}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#1e293b',
              color: '#38bdf8',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Mic size={18} />
          </button>
        )}
      </div>

    </div>
  );
}
