export interface Msg {
  id: string;
  senderId: string;
  text?: string;
  timestamp: string;
  voiceNote?: boolean;
  reactions?: string[];
  image?: string;
  images?: string[];
  replyTo?: { id: string; senderId: string; text: string };
  status?: "sent" | "delivered" | "seen";
}
