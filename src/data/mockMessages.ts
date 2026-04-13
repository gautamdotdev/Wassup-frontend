import { Msg } from "@/types/chat";

export const FAKE_MESSAGES: Msg[] = [
  {
    id: "1",
    senderId: "other",
    text: "Not really, I probably missed that. I'll fix the spacing and re-upload.",
    timestamp: "",
  },
  {
    id: "2",
    senderId: "me",
    text: "Once updated, can you also include disabled + loading states?",
    timestamp: "11:11 AM",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop",
    status: "seen",
  },
  {
    id: "3",
    senderId: "other",
    voiceNote: true,
    timestamp: "11:40 AM",
  },
  {
    id: "4",
    senderId: "other",
    text: "FYI, if we reduce the sidebar width, some of the current components will break. Just keep the minimum 240px.",
    timestamp: "12:05 PM",
    reactions: ["👍"],
  },
  {
    id: "5",
    senderId: "other",
    text: "ASAP, brb!",
    timestamp: "1:00 PM",
    replyTo: { id: "4", senderId: "other", text: "FYI, if we reduce the sidebar width, some of the..." },
  },
];

export const TIME_DIVIDERS: Record<string, string> = { "1": "10:02 AM", "3": "11:40 AM" };
export const SWIPE_THRESHOLD = 58;
