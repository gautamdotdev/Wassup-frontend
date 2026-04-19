/** A single reaction entry as stored in the DB / returned from API */
export interface MsgReaction {
  user: string;   // userId
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
  text?: string;
  timestamp: string;
  voiceNote?: boolean;
  reactions?: MsgReaction[];
  image?: string;
  images?: string[];
  mediaType?: "image" | "video" | "voice";
  replyTo?: { id: string; senderId: string; text: string };
  status?: "sent" | "delivered" | "seen";
}
