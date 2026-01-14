import React, { useState } from "react";
import { useGoogleCalendar } from "../context/GoogleCalendarContext";
import Button from "./ui/button/Button";

const GoogleCalendarConnect: React.FC = () => {
  const { isConnected, isLoading, lastSync, isSyncing, connect, disconnect, syncNow } = useGoogleCalendar();
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter Google Calendar ?")) {
      return;
    }

    try {
      setError(null);
      await disconnect();
      setSyncMessage("Google Calendar déconnecté avec succès");
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const handleSync = async () => {
    try {
      setError(null);
      setSyncMessage(null);
      const result = await syncNow();

      const parts = [];
      if (result.imported > 0) parts.push(`${result.imported} importés`);
      if (result.updated > 0) parts.push(`${result.updated} mis à jour`);
      if (result.deleted > 0) parts.push(`${result.deleted} supprimés`);
      if (result.conflicts.length > 0) parts.push(`${result.conflicts.length} conflits détectés`);

      setSyncMessage(
        parts.length > 0
          ? `Synchronisation réussie: ${parts.join(", ")}`
          : "Synchronisation réussie, aucun changement"
      );

      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mb-4 sm:mb-6 transition-shadow hover:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              Google Calendar
            </h3>
            {isConnected ? (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Connecté
                </span>
                {lastSync && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Sync: {lastSync.toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Synchronisez vos événements
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isConnected ? (
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {isSyncing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="hidden sm:inline">Sync...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Synchroniser</span>
                  </span>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              >
                <span className="sm:hidden">Déco.</span>
                <span className="hidden sm:inline">Déconnecter</span>
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} variant="primary" size="sm" className="w-full sm:w-auto">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Connecter
              </span>
            </Button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="mt-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">{syncMessage}</p>
        </div>
      )}

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarConnect;
