import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Lock, User, Video, VideoOff, Mic, MicOff,
  MessageSquare, PhoneOff, Send, Volume2, VolumeX, CameraOff
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VideoCall({
  contact,
  socket,
  currentUser,
  isCaller = true,
  targetSocketId = null,
  callType = 'video',
  onEndCall
}) {
  const [isVideoMuted, setIsVideoMuted] = useState(callType === 'audio');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Track whether receiver / remote candidate camera & mic are off
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);

  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [callMessages, setCallMessages] = useState([]);
  
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting video...');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const pendingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // 1. In-Call Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize Local Camera / Audio Media Stream & WebRTC PeerConnection
  useEffect(() => {
    let activeStream = null;
    let pc = null;

    async function initMediaAndWebRTC() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported');
        }

        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
        } catch (e) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
        }

        // Force camera ON for video call
        if (callType === 'video') {
          mediaStream.getVideoTracks().forEach(t => (t.enabled = true));
          setIsVideoMuted(false);
        } else {
          mediaStream.getVideoTracks().forEach(t => (t.enabled = false));
          setIsVideoMuted(true);
        }

        activeStream = mediaStream;
        setLocalStream(mediaStream);
        setHasWebcam(true);
        setPermissionError(null);

        // Bind local stream to PiP ref
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Initialize WebRTC RTCPeerConnection
        pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local stream tracks to PeerConnection
        mediaStream.getTracks().forEach(track => {
          pc.addTrack(track, mediaStream);
        });

        // Listen for Remote Stream Tracks
        pc.ontrack = (event) => {
          console.log('📺 WebRTC remote track received:', event.streams);
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            setIsRemoteVideoMuted(false);
            setConnectionStatus('Connected (HD Video)');
          }
        };

        // ICE Candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('ice-candidate', {
              targetUsername: contact?.username,
              targetUserId: contact?.id,
              targetSocketId,
              candidate: event.candidate
            });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('📡 WebRTC connection state:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            setConnectionStatus('Connected (HD Video)');
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            setConnectionStatus('Reconnecting...');
          }
        };

        // Process any early offer received before PC was initialized
        if (pendingOfferRef.current) {
          console.log('⚡ Processing buffered WebRTC Offer');
          const buffered = pendingOfferRef.current;
          pendingOfferRef.current = null;
          await pc.setRemoteDescription(new RTCSessionDescription(buffered.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (socket) {
            socket.emit('webrtc-answer', {
              targetUsername: contact?.username,
              targetUserId: contact?.id,
              targetSocketId: buffered.callerSocketId || targetSocketId,
              answer
            });
          }
        }

        // Process buffered ICE candidates
        if (pendingCandidatesRef.current.length > 0) {
          console.log(`⚡ Processing ${pendingCandidatesRef.current.length} buffered ICE candidates`);
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
        }

        // WebRTC Signaling: Caller initiates Offer
        if (isCaller && socket) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            targetUsername: contact?.username,
            targetUserId: contact?.id,
            targetSocketId,
            offer
          });
        }

      } catch (err) {
        console.warn('Media/WebRTC init error:', err);
        setPermissionError(err.message || 'Camera or microphone access denied');
      }
    }

    initMediaAndWebRTC();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [contact, isCaller, targetSocketId, callType]);

  // 3. Socket Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming WebRTC Offer (Receiver side)
    const handleOffer = async ({ callerSocketId, offer }) => {
      try {
        console.log('📥 Received WebRTC Offer from:', callerSocketId);
        const pc = peerConnectionRef.current;
        if (!pc) {
          console.log('⏳ Buffering WebRTC Offer (PC not ready yet)');
          pendingOfferRef.current = { callerSocketId, offer };
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          targetUsername: contact?.username,
          targetUserId: contact?.id,
          targetSocketId: callerSocketId || targetSocketId,
          answer
        });
      } catch (e) {
        console.error('Error handling WebRTC offer:', e);
      }
    };

    // Incoming WebRTC Answer (Caller side)
    const handleAnswer = async ({ answer }) => {
      try {
        console.log('📥 Received WebRTC Answer');
        const pc = peerConnectionRef.current;
        if (!pc) return;
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        console.error('Error handling WebRTC answer:', e);
      }
    };

    // Incoming ICE Candidate
    const handleIceCandidate = async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    };

    // Incoming Remote Media Status Toggle
    const handleRemoteMediaToggled = ({ type, isMuted }) => {
      if (type === 'video') {
        setIsRemoteVideoMuted(isMuted);
        const name = contact?.name || contact?.username || 'Receiver';
        toast(isMuted ? `${name}'s camera is off` : `${name}'s camera is on`, { icon: '📹' });
      } else if (type === 'audio') {
        setIsRemoteAudioMuted(isMuted);
        const name = contact?.name || contact?.username || 'Receiver';
        toast(isMuted ? `${name} muted microphone` : `${name} unmuted microphone`, { icon: '🎙️' });
      }
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('remote-media-toggled', handleRemoteMediaToggled);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('remote-media-toggled', handleRemoteMediaToggled);
    };
  }, [socket, contact, targetSocketId]);

  // 4. Bind Streams strictly to correct DOM elements
  // Local stream -> localVideoRef (PiP frame)
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Remote stream -> remoteVideoRef (Main background frame)
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // 5. Toggle Local Camera (Video Track)
  const toggleVideo = () => {
    const nextMuted = !isVideoMuted;
    setIsVideoMuted(nextMuted);

    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }

    if (socket) {
      socket.emit('toggle-media-track', {
        targetUsername: contact?.username,
        targetUserId: contact?.id,
        targetSocketId,
        type: 'video',
        isMuted: nextMuted
      });
    }

    toast(nextMuted ? 'Your camera is off' : 'Your camera is on', { icon: '📷' });
  };

  // 6. Toggle Local Microphone (Audio Track)
  const toggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);

    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }

    if (socket) {
      socket.emit('toggle-media-track', {
        targetUsername: contact?.username,
        targetUserId: contact?.id,
        targetSocketId,
        type: 'audio',
        isMuted: nextMuted
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

  const receiverName = contact?.name || contact?.fullName || contact?.username || 'Receiver';

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

      {/* MAIN FRAME: Receiver / Sender Remote Live Video Stream Container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        background: '#090d16'
      }}>
        {/* Remote Video element - strictly bound to remoteStream */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: (remoteStream && !isRemoteVideoMuted) ? 'block' : 'none'
          }}
        />

        {/* Remote User Placeholder when remoteStream is inactive OR receiver camera is OFF */}
        {(!remoteStream || isRemoteVideoMuted) && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
            padding: '24px',
            textAlign: 'center',
            gap: '16px'
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={contact?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact?.username || 'user'}`}
                alt={receiverName}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: isRemoteVideoMuted ? '4px solid #ef4444' : '4px solid #38bdf8',
                  objectFit: 'cover',
                  boxShadow: isRemoteVideoMuted ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 0 30px rgba(56, 189, 248, 0.3)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isRemoteVideoMuted ? '#ef4444' : isRemoteAudioMuted ? '#f59e0b' : '#10b981',
                border: '3px solid #0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isRemoteVideoMuted ? (
                  <CameraOff size={14} color="white" />
                ) : isRemoteAudioMuted ? (
                  <VolumeX size={14} color="white" />
                ) : (
                  <Volume2 size={14} color="white" />
                )}
              </div>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
                {receiverName}
              </h3>

              {/* Explicit status message required by user */}
              <div style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: isRemoteVideoMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: isRemoteVideoMuted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isRemoteVideoMuted ? '#f87171' : '#94a3b8',
                fontSize: '13.5px',
                fontWeight: '600'
              }}>
                {isRemoteVideoMuted ? (
                  <>
                    <CameraOff size={16} />
                    <span>{receiverName}'s camera is off</span>
                  </>
                ) : (
                  <span>{connectionStatus}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Soft Ambient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(0,0,0,0) 35%, rgba(15, 23, 42, 0.8) 100%)',
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
        {/* Back / End Call Button */}
        <button
          onClick={onEndCall}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
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
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
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

      {/* PIP FRAME: Floating Local Participant Self Camera Window (Bottom Right) */}
      <div style={{
        position: 'absolute',
        bottom: '95px',
        right: '16px',
        width: '110px',
        height: '148px',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
        border: '2px solid rgba(255, 255, 255, 0.25)',
        zIndex: 20,
        background: '#1e293b'
      }}>
        {/* Local Video element - strictly bound to localStream */}
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

        {/* Fallback box when local camera is disabled */}
        {(!hasWebcam || isVideoMuted) && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#94a3b8',
            fontSize: '11px',
            gap: '6px'
          }}>
            <VideoOff size={22} color="#f87171" />
            <span>Camera Off</span>
          </div>
        )}

        {/* Muted Audio Badge on Local Preview */}
        {isAudioMuted && (
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'rgba(239, 68, 68, 0.9)',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MicOff size={10} color="white" />
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
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '12px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.12)'
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
            <button type="submit" style={{ background: '#2563eb', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer' }}>
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
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Camera Toggle Button */}
        <button
          onClick={toggleVideo}
          title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isVideoMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.1)',
            border: isVideoMuted ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
            color: isVideoMuted ? '#ef4444' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        {/* Microphone Toggle Button */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isAudioMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.1)',
            border: isAudioMuted ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
            color: isAudioMuted ? '#ef4444' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
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
            background: showChatOverlay ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
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
            if (socket) {
              socket.emit('end-call', {
                targetUsername: contact?.username,
                targetUserId: contact?.id,
                targetSocketId
              });
            }
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
