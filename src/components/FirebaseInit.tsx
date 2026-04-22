import { useEffect } from "react";
import { generateToken, onMessageListener } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export const FirebaseInit = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only setup FCM if user exists AND has notifications enabled
    if (user && user.pushNotificationsEnabled !== false) {
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
  }, [user, user?.pushNotificationsEnabled]);

  useEffect(() => {
    const unsubscribe = onMessageListener((payload: any) => {
      console.log("Push notification received in foreground:", payload);
      
      const currentHash = window.location.hash;
      const payloadChatId = payload.data?.chatId;
      
      // Auto-ignore if we are already in this chat
      if (payloadChatId && currentHash.includes(`/chat/${payloadChatId}`)) {
        return;
      }
      
      console.log("Notifying background only (in-app UI suppressed)");
    });
    
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return null;
};
