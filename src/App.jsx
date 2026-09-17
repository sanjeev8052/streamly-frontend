import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import MobileContainer from './components/MobileContainer';
import JoinForm from './components/JoinForm';
import ChatsList from './components/ChatsList';
import ChatRoom from './components/ChatRoom';
import VideoCall from './components/VideoCall';
import CallsList from './components/CallsList';
import SettingsView from './components/SettingsView';
import BottomNav from './components/BottomNav';
import IncomingCallModal from './components/IncomingCallModal';
import OutgoingCallModal from './components/OutgoingCallModal';

import { API_BASE, SOCKET_URL } from './config';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('streamly_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [contacts, setContacts] = useState([]);
  const [messagesMap, setMessagesMap] = useState({});
  const [callLogs, setCallLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'calls' | 'settings'
  const [activeChatContact, setActiveChatContact] = useState(null);
  const [activeCallContact, setActiveCallContact] = useState(null);

  // Call Signaling State
  const [incomingCall, setIncomingCall] = useState(null); // { caller, callType, callerSocketId }
  const [outgoingCall, setOutgoingCall] = useState(null); // { contact, callType }

  const [showJoinModal, setShowJoinModal] = useState(!currentUser);

  // Initialize Socket.io Realtime Connection & Signaling
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.emit('register-user', {
      username: currentUser.username,
      userId: currentUser.id
    });

    // Realtime Incoming Message Handler
    newSocket.on('receive-message', (incoming) => {
      const targetContactId = incoming.sender === 'me' ? incoming.contactId : (incoming.senderId || incoming.contactId);
      
      setMessagesMap(prev => {
        const existingList = prev[targetContactId] || [];
        if (existingList.some(m => m.id === incoming.id)) return prev;
        return {
          ...prev,
          [targetContactId]: [...existingList, incoming]
        };
      });

      setContacts(prev => prev.map(c =>
        c.id === targetContactId || c.username === targetContactId
          ? {
              ...c,
              lastMessage: incoming.type === 'audio' ? '🎤 Voice Message' : incoming.type === 'image_grid' ? '📷 Photo Attachment' : incoming.text,
              time: incoming.time
            }
          : c
      ));
    });

    // Realtime Incoming Call Alert
    newSocket.on('incoming-call', ({ caller, callType, callerSocketId }) => {
      console.log('📞 Incoming call from:', caller);
      setIncomingCall({ caller, callType, callerSocketId });
    });

    // Realtime Call Accepted by Receiver
    newSocket.on('call-accepted', () => {
      console.log('✅ Call accepted by remote user');
      setOutgoingCall(prev => {
        if (prev) {
          setActiveCallContact({ contact: prev.contact, type: prev.callType });
        }
        return null;
      });
    });

    // Realtime Call Declined by Receiver
    newSocket.on('call-declined', () => {
      toast.error('Call declined');
      setOutgoingCall(null);
    });

    // Realtime Call Cancelled by Caller
    newSocket.on('call-cancelled', () => {
      toast('Call cancelled');
      setIncomingCall(null);
    });

    // Target user offline notification
    newSocket.on('user-offline', () => {
      toast.error('User is offline, but starting demo video feed');
      setOutgoingCall(prev => {
        if (prev) {
          setActiveCallContact({ contact: prev.contact, type: prev.callType });
        }
        return null;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Fetch real registered users directly from database API
  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_BASE}/contacts?currentUserId=${currentUser?.id || ''}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContacts(data);
        }
      })
      .catch(() => setContacts([]));
  }, [currentUser]);

  const handleJoin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('streamly_user', JSON.stringify(userData));
    setShowJoinModal(false);
    setActiveTab('chats');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('streamly_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    setCurrentUser(null);
    localStorage.removeItem('streamly_user');
    setShowJoinModal(true);
    setActiveChatContact(null);
    setActiveCallContact(null);
  };

  const handleSelectChat = (contact) => {
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
    setActiveChatContact(contact);

    fetch(`${API_BASE}/messages/${contact.id}?currentUserId=${currentUser?.id || ''}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessagesMap(prev => ({ ...prev, [contact.id]: data }));
        }
      })
      .catch(() => {});
  };

  // Realtime Socket Chat Message Sender
  const handleSendMessage = (newMsg) => {
    const contactId = activeChatContact ? activeChatContact.id : (contacts[0]?.id || 'c1');
    const targetUsername = activeChatContact ? activeChatContact.username : null;

    if (socket && socket.connected) {
      socket.emit('send-message', {
        senderId: currentUser?.id,
        contactId,
        targetUsername,
        text: newMsg.text,
        type: newMsg.type,
        images: newMsg.images,
        audioDuration: newMsg.audioDuration
      });
    } else {
      fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || ''}`
        },
        body: JSON.stringify({
          senderId: currentUser?.id,
          contactId,
          text: newMsg.text,
          type: newMsg.type,
          images: newMsg.images,
          audioDuration: newMsg.audioDuration
        })
      }).catch(() => {});

      setMessagesMap(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), newMsg]
      }));
    }
  };

  // Start Call (Caller side)
  const handleStartCall = (contact, type = 'video') => {
    if (!contact) return;
    setOutgoingCall({ contact, callType: type });

    if (socket && socket.connected) {
      socket.emit('call-user', {
        targetUserId: contact.id,
        targetUsername: contact.username,
        caller: currentUser,
        callType: type
      });
    } else {
      setActiveCallContact({ contact, type });
      setOutgoingCall(null);
    }
  };

  // Accept Incoming Call (Receiver side)
  const handleAcceptCall = () => {
    if (incomingCall && socket) {
      socket.emit('accept-call', {
        callerSocketId: incomingCall.callerSocketId
      });
      setActiveCallContact({
        contact: incomingCall.caller,
        type: incomingCall.callType
      });
      setIncomingCall(null);
    }
  };

  // Decline Incoming Call (Receiver side)
  const handleDeclineCall = () => {
    if (incomingCall && socket) {
      socket.emit('decline-call', {
        callerSocketId: incomingCall.callerSocketId
      });
      setIncomingCall(null);
    }
  };

  // Cancel Outgoing Call (Caller side)
  const handleCancelOutgoingCall = () => {
    if (outgoingCall && socket) {
      socket.emit('cancel-call', {
        targetUserId: outgoingCall.contact?.id,
        targetUsername: outgoingCall.contact?.username
      });
      setOutgoingCall(null);
    }
  };

  const handleEndCall = () => {
    if (activeCallContact) {
      if (socket) {
        socket.emit('end-call', {
          targetUserId: activeCallContact.contact?.id,
          targetUsername: activeCallContact.contact?.username
        });
      }
      const newLog = {
        id: Date.now().toString(),
        user: activeCallContact.contact,
        type: activeCallContact.type || 'video',
        status: 'ended',
        duration: '05:32',
        time: 'Just now'
      };
      setCallLogs(prev => [newLog, ...prev]);
    }
    setActiveCallContact(null);
  };

  return (
    <MobileContainer>
      <Toaster position="top-center" reverseOrder={false} />

      {/* Incoming Call Notification Modal */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.caller}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Outgoing Ringing Modal */}
      {outgoingCall && (
        <OutgoingCallModal
          contact={outgoingCall.contact}
          callType={outgoingCall.callType}
          onCancel={handleCancelOutgoingCall}
        />
      )}

      {/* Main View Router */}
      {!currentUser || showJoinModal ? (
        <JoinForm
          onJoin={handleJoin}
          existingUsers={contacts}
        />
      ) : activeCallContact ? (
        <VideoCall
          contact={activeCallContact?.contact || contacts[0]}
          onEndCall={handleEndCall}
        />
      ) : activeChatContact ? (
        <ChatRoom
          contact={activeChatContact}
          messages={messagesMap[activeChatContact.id] || []}
          onSendMessage={handleSendMessage}
          onStartVideoCall={(c) => handleStartCall(c, 'video')}
          onStartAudioCall={(c) => handleStartCall(c, 'audio')}
          onBack={() => setActiveChatContact(null)}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'chats' && (
              <ChatsList
                contacts={contacts}
                currentUser={currentUser}
                onSelectChat={handleSelectChat}
                onStartCall={(c) => handleStartCall(c, 'video')}
              />
            )}

            {activeTab === 'calls' && (
              <CallsList
                callLogs={callLogs}
                onStartCall={(c, type) => handleStartCall(c, type)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                onSwitchUser={handleLogout}
              />
            )}
          </div>

          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setActiveChatContact(null);
              setActiveCallContact(null);
            }}
            onQuickCall={() => handleStartCall(contacts[0], 'video')}
          />
        </div>
      )}
    </MobileContainer>
  );
}
