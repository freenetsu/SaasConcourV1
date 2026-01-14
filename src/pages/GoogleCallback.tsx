import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [authWaitAttempts, setAuthWaitAttempts] = useState(0);
  const MAX_AUTH_WAIT_ATTEMPTS = 20;

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        setError(`Erreur d'authentification: ${errorParam}`);
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setError("Code d'autorisation manquant");
        setIsProcessing(false);
        return;
      }

      if (isAuthLoading) {
        if (authWaitAttempts < MAX_AUTH_WAIT_ATTEMPTS) {
          setAuthWaitAttempts(authWaitAttempts + 1);
          return;
        }
        setError("Impossible de charger votre session. Veuillez réessayer.");
        setIsProcessing(false);
        return;
      }

      if (!user?.id) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/google/oauth/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Échec de la connexion");
        }

        await response.json();

        await fetch(`${API_URL}/events/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        navigate("/calendar");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de la connexion");
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [user, isAuthLoading, authWaitAttempts, navigate]);

  const handleRetry = () => {
    setError(null);
    setIsProcessing(true);
    setAuthWaitAttempts(0);
  };

  const handleNavigateToCalendar = () => {
    navigate("/calendar");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {isProcessing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connexion à Google Calendar
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Veuillez patienter pendant que nous configurons votre compte...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Erreur de connexion
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Réessayer
              </button>
              <button
                onClick={handleNavigateToCalendar}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition"
              >
                Aller au calendrier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
