export const INITIAL_CONTACTS = [
  {
    id: 'user-1',
    name: 'Leslie Rajora',
    username: 'leslierajora',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    status: 'Online',
    isOnline: true,
    lastSeen: 'Active now',
    recentUpdate: true,
    storyImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    unreadCount: 0,
    lastMessage: 'Wow look amazing!✨',
    time: '11:42 AM'
  },
  {
    id: 'user-2',
    name: 'Annela Black',
    username: 'annelablack',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    status: 'J. Turner is typing...',
    isOnline: true,
    lastSeen: 'Active now',
    recentUpdate: true,
    unreadCount: 2,
    lastMessage: 'J. Turner is typing...',
    time: '11.12 AM'
  },
  {
    id: 'user-3',
    name: 'Floyd Miles',
    username: 'floydmiles',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    status: 'Voice Message',
    isOnline: false,
    lastSeen: '15 mins ago',
    recentUpdate: true,
    unreadCount: 1,
    lastMessage: '🎤 Voice Message (0:13)',
    time: '10:55 AM'
  },
  {
    id: 'user-4',
    name: 'Zafira K',
    username: 'zafirak',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    status: 'Online',
    isOnline: true,
    recentUpdate: true,
    lastMessage: 'Hey! Ready for our call?',
    time: '10:30 AM'
  },
  {
    id: 'user-5',
    name: 'Ibrahem',
    username: 'ibrahem_m',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    status: 'Offline',
    isOnline: false,
    recentUpdate: true,
    lastMessage: 'Sent you the project documents.',
    time: '9:15 AM'
  },
  {
    id: 'user-6',
    name: 'pemuda pancasindra',
    username: 'pancasindra',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    status: 'don\'t forget karokae at 10 pm',
    isOnline: false,
    unreadCount: 1,
    lastMessage: 'don\'t forget karokae at 10 pm',
    time: 'Yesterday'
  },
  {
    id: 'user-7',
    name: 'Devon Lane',
    username: 'devonlane',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    status: 'Looks Good Bro 🤝',
    isOnline: true,
    lastMessage: 'Looks Good Bro 🤝',
    time: 'Yesterday'
  },
  {
    id: 'user-8',
    name: 'Luna Maya',
    username: 'lunamaya',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    status: 'Have a nice day ❤️',
    isOnline: true,
    lastMessage: 'Have a nice day ❤️',
    time: '2 days ago'
  }
];

export const INITIAL_MESSAGES = {
  'user-1': [
    {
      id: 'm1',
      sender: 'them',
      text: "Let's go on vacation! I have exciting vacation plans",
      time: '11:38 AM'
    },
    {
      id: 'm2',
      sender: 'me',
      text: "Let's go on vacation, what's the plan?",
      time: '11:40 AM'
    },
    {
      id: 'm3',
      sender: 'them',
      type: 'image_grid',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1476514525535-ce74f45814d3?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80'
      ],
      caption: 'I have a vacation plan in Labuan Bajo for next week',
      time: '11:41 AM'
    },
    {
      id: 'm4',
      sender: 'me',
      type: 'audio',
      audioDuration: '0:13',
      time: '11:41 AM'
    },
    {
      id: 'm5',
      sender: 'me',
      text: 'Wow look amazing!✨',
      time: '11:42 AM'
    }
  ]
};

export const MOCK_CALL_LOGS = [
  {
    id: 'c1',
    user: INITIAL_CONTACTS[0],
    type: 'video',
    direction: 'incoming',
    duration: '05:32',
    time: 'Today, 11:30 AM'
  },
  {
    id: 'c2',
    user: INITIAL_CONTACTS[1],
    type: 'audio',
    direction: 'outgoing',
    duration: '02:15',
    time: 'Yesterday, 4:20 PM'
  },
  {
    id: 'c3',
    user: INITIAL_CONTACTS[2],
    type: 'video',
    direction: 'missed',
    duration: '00:00',
    time: 'Sep 15, 9:10 AM'
  }
];
