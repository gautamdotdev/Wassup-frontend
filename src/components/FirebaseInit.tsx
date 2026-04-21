import { useEffect } from "react";
import { generateToken, onMessageListener } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { toast } from "sonner";

export const FirebaseInit = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const setupFCM = async () => {
        try {
          const token = await generateToken();
          if (token) {
            await api.post("/users/save-fcm-token", { token });
            console.log("FCM Token registered");
          }
        } catch (err) {
          console.warn("FCM setup failed:", err);
        }
      };
      setupFCM();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onMessageListener((payload: any) => {
      console.log("Push notification received in foreground:", payload);
      
      const currentHash = window.location.hash;
      const payloadChatId = payload.data?.chatId;
      
      // Auto-ignore if we are already in this chat
      if (payloadChatId && currentHash.includes(`/chat/${payloadChatId}`)) {
        return;
      }

      toast(payload.notification.title, {
        description: payload.notification.body,
        action: {
          label: "View",
          onClick: () => {
            if (payloadChatId) {
              window.location.hash = `#/chat/${payloadChatId}`;
            }
          }
        }
      });
    });
    
    return () => {
      // unsubscribe is returned from onMessage
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return null;
};
