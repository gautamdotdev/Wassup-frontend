export interface User {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  online?: boolean;
  lastSeen?: string;
}

/** A single reaction entry as stored in the DB / returned from API */
export interface MsgReaction {
  user: string | User;   // userId or populated user object
  emoji: string;
}

/** Grouped reaction for display: how many people reacted + did *I* react? */
export interface GroupedReaction {
  emoji: string;
  count: number;
  reacted: boolean;   // current user already reacted with this emoji
}

export interface Msg {
  id: string;
  senderId: string;
  sender?: User; // Populated sender info for groups
  text?: string;
  timestamp: string;
  voiceNote?: boolean;
  reactions?: MsgReaction[];
  image?: string;
  images?: string[];
  mediaType?: "image" | "video" | "voice";
  replyTo?: { id: string; senderId: string; text: string };
  status?: "sent" | "delivered" | "seen";
  readBy?: User[]; // Users who read the message
  isUploading?: boolean;  // true while media file is being uploaded to Cloudinary
}

export interface Chat {
  _id: string;
  chatType: 'direct' | 'group';
  chatName?: string;
  description?: string;
  avatar?: string;
  participants: User[];
  latestMessage?: any;
  admins: (string | User)[];
  createdBy: string | User;
  mutedBy: string[];
  blockedBy?: string;
  clearedAt: { user: string; at: string }[];
  theme?: string;
  groupSettings: {
    canSendMessage: 'all' | 'admins';
    canAddMembers: 'all' | 'admins';
  };
  unreadCount?: number;
  isMuted?: boolean;
  isLocked?: boolean;
}
