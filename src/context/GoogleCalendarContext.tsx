import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { API_URL } from "../config/api";

interface GoogleCalendarContextType {
  isConnected: boolean;
  isLoading: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncNow: () => Promise<{ success: boolean; imported: number; updated: number; deleted: number; conflicts: Array<{ eventId: string; title: string; localUpdated: string; googleUpdated: string }> }>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | null>(null);

export const GoogleCalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkConnectionStatus();
    } else {
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/google/status?userId=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        if (data.lastSync) {
          setLastSync(new Date(data.lastSync));
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Failed to check Google Calendar connection:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/google/oauth/url`);

      if (!response.ok) {
        throw new Error("Failed to get authorization URL");
      }

      const { authUrl } = await response.json();

      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to connect Google Calendar:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/google/disconnect`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setIsConnected(false);
        setLastSync(null);
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error("Failed to disconnect Google Calendar:", error);
      throw error;
    }
  };

  const syncNow = async () => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      setIsSyncing(true);
      const response = await fetch(`${API_URL}/events/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Sync failed");
      }

      const result = await response.json();
      setLastSync(new Date());

      return result;
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <GoogleCalendarContext.Provider
      value={{
        isConnected,
        isLoading,
        lastSync,
        isSyncing,
        connect,
        disconnect,
        syncNow,
      }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
};

export const useGoogleCalendar = () => {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error("useGoogleCalendar must be used within GoogleCalendarProvider");
  }
  return context;
};
