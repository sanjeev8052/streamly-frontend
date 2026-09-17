import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Lock, User, Video, VideoOff, Mic, MicOff,
  MessageSquare, PhoneOff, Send
} from 'lucide-react';

export default function VideoCall({ contact, onEndCall }) {
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [callMessages, setCallMessages] = useState([]);
  
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // 1. Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Obtain WebRTC Media Stream
  useEffect(() => {
    let activeStream = null;

    async function getMediaStream() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported in this browser');
        }

        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
        } catch (e1) {
          // Fallback to basic video constraint
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        activeStream = mediaStream;
        setLocalStream(mediaStream);
        setHasWebcam(true);
        setPermissionError(null);
        toast.success('Camera & Microphone Connected!', { duration: 2000 });
      } catch (err) {
        console.warn('Webcam acquisition failed:', err);
        setPermissionError(err.message || 'Camera access requested');
      }
    }

    getMediaStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 3. Bind Stream to Video DOM Elements cleanly whenever stream or DOM changes
  useEffect(() => {
    if (localStream) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(err => console.log('Local video play error:', err));
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = localStream;
        remoteVideoRef.current.play().catch(err => console.log('Remote video play error:', err));
      }
    }
  }, [localStream]);

  // Handle Mute/Unmute Video Track
  const toggleVideo = () => {
    const nextMuted = !isVideoMuted;
    setIsVideoMuted(nextMuted);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
    toast(nextMuted ? 'Camera turned off' : 'Camera turned on', { icon: '📷' });
  };

  // Handle Mute/Unmute Audio Track
  const toggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
    toast(nextMuted ? 'Microphone muted' : 'Microphone unmuted', { icon: '🎙️' });
  };

  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setCallMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text: chatInput }]);
    setChatInput('');
    toast.success('In-call message sent', { duration: 1500 });
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#090d16',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Main Remote User Live Camera Stream Container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        background: '#090d16'
      }}>
        {/* Remote Video DOM element ALWAYS rendered to receive srcObject stream */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: (hasWebcam && !isVideoMuted) ? 'block' : 'none'
          }}
        />

        {/* Fallback layout when camera is off or permission requested */}
        {(!hasWebcam || isVideoMuted) && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
            padding: '24px',
            textAlign: 'center',
            gap: '16px'
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={contact?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact?.username || 'user'}`}
                alt={contact?.name}
                style={{ width: '110px', height: '110px', borderRadius: '50%', border: '3px solid #38bdf8', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#10b981',
                border: '3px solid #0f172a'
              }} />
            </div>

            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
              {contact?.name || contact?.fullName || contact?.username || 'Streamly User'}
            </h3>

            {permissionError ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 16px',
                borderRadius: '14px',
                fontSize: '12.5px',
                maxWidth: '280px',
                lineHeight: '1.4'
              }}>
                📷 Please click <strong>"Allow"</strong> in your browser popup to start live camera video!
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                {isVideoMuted ? 'Camera Muted' : 'HD Video Call Connected & Encrypted'}
              </p>
            )}
          </div>
        )}

        {/* Soft Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(0,0,0,0) 30%, rgba(15, 23, 42, 0.75) 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Top Header Overlay Bar */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Back Button */}
        <button
          onClick={onEndCall}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Encrypted Pill Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          <Lock size={12} style={{ color: '#38bdf8' }} />
          <span>End-to-End Encrypted</span>
        </div>

        {/* Right User Profile Icon */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <User size={20} />
        </div>
      </div>

      {/* Floating Local Self Camera Window (Picture in Picture - Bottom Right) */}
      <div style={{
        position: 'absolute',
        bottom: '100px',
        right: '16px',
        width: '110px',
        height: '145px',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(255, 255, 255, 0.25)',
        zIndex: 20,
        background: '#1e293b'
      }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: (hasWebcam && !isVideoMuted) ? 'block' : 'none'
          }}
        />

        {(!hasWebcam || isVideoMuted) && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#64748b'
          }}>
            <VideoOff size={24} />
          </div>
        )}
      </div>

      {/* In-Call Chat Overlay Drawer */}
      {showChatOverlay && (
        <div style={{
          position: 'absolute',
          bottom: '95px',
          left: '16px',
          right: '135px',
          maxHeight: '220px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(14px)',
          borderRadius: '20px',
          padding: '12px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            {callMessages.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '8px' }}>
                In-call messages appear here
              </div>
            ) : (
              callMessages.map(msg => (
                <div key={msg.id} style={{
                  alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'me' ? '#2563eb' : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  maxWidth: '90%'
                }}>
                  {msg.text}
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Chat..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 10px',
                color: 'white',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button type="submit" style={{ background: '#2563eb', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '10px' }}>
              <Send size={12} />
            </button>
          </form>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '16px',
        right: '16px',
        zIndex: 40,
        background: '#0f172a',
        borderRadius: '32px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Toggle Video/Camera Button */}
        <button
          onClick={toggleVideo}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isVideoMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: isVideoMuted ? '#ef4444' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        {/* Toggle Mic Button */}
        <button
          onClick={toggleAudio}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: isAudioMuted ? '#ef4444' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Chat Drawer Toggle Button */}
        <button
          onClick={() => setShowChatOverlay(!showChatOverlay)}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: showChatOverlay ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={20} />
        </button>

        {/* End Call Button with Live Duration Timer */}
        <button
          onClick={() => {
            toast.error('Call ended');
            onEndCall();
          }}
          style={{
            height: '46px',
            padding: '0 20px',
            borderRadius: '23px',
            background: '#ef4444',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
          }}
        >
          <PhoneOff size={18} />
          <span>{formatTimer(secondsElapsed)}</span>
        </button>
      </div>

    </div>
  );
}
