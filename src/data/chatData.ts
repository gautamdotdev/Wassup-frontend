export const users = [
  { id: "1", name: "Linda Sarah", avatar: "https://i.pravatar.cc/150?img=1", online: true },
  { id: "2", name: "Michal Riviera", avatar: "https://i.pravatar.cc/150?img=2", online: true },
  { id: "3", name: "Tommy Lacoste", avatar: "https://i.pravatar.cc/150?img=3", online: false },
  { id: "4", name: "Marisol Bonaparte", avatar: "https://i.pravatar.cc/150?img=4", online: true },
  { id: "5", name: "Ryan McAfee", avatar: "https://i.pravatar.cc/150?img=5", online: false },
  { id: "6", name: "Luigi Sicario", avatar: "https://i.pravatar.cc/150?img=6", online: true },
  { id: "7", name: "Luiz Fernando", avatar: "https://i.pravatar.cc/150?img=7", online: false },
  { id: "8", name: "Drew Allison", avatar: "https://i.pravatar.cc/150?img=8", online: true },
];

export const currentUser = users[0];

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  image?: string;
  voiceNote?: { duration: string };
  replyTo?: { text: string };
  timestamp: string;
  reactions?: string[];
}

export const conversations: Record<string, Message[]> = {
  "1": [
    { id: "m1", senderId: "2", text: "Not really, I probably missed that.", timestamp: "10:02 AM" },
    { id: "m2", senderId: "1", text: "I'll fix the spacing and re-upload.", timestamp: "10:02 AM" },
    { id: "m3", senderId: "2", text: "Once updated, can you also include disabled + loading states? We'll need them for the next sprint.", timestamp: "11:11 AM", image: "https://i.pravatar.cc/100?img=10" },
    { id: "m4", senderId: "1", voiceNote: { duration: "4-voice" }, timestamp: "11:40 AM" },
    { id: "m5", senderId: "2", text: "FYI, if we reduce the sidebar width, some of the current components will break. Just keep the minimum 240px width so we don't need to refactor heavily.", timestamp: "12:05 PM", reactions: ["👍"] },
    { id: "m6", senderId: "1", text: "ASAP, brb!", timestamp: "1:00 PM", replyTo: { text: "FYI, if we reduce the sidebar width, some of the..." } },
  ],
};

export const latestMessages = [
  { userId: "2", text: "Design updates! take a look", time: "9.00 AM", unread: 1 },
  { userId: "3", text: "📎 Photo", time: "7.12 AM", unread: 2 },
  { userId: "8", text: "I reviewed yesterday's dashb...", time: "4.22 AM", unread: 1 },
];

export const threads = [
  { id: "t1", userId: "2", time: "a few minutes ago", text: "What steps can I take to prepare for a job interview as a beginner?", attachment: "earring-#1.png", likes: 593, comments: 12 },
];
