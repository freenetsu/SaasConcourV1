import React, { useState } from "react";
import { Modal } from "./ui/modal";
import Button from "./ui/button/Button";

interface ConflictEvent {
  eventId: string;
  title: string;
  localUpdated: string;
  googleUpdated: string;
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictEvent[];
  onResolve: (eventId: string, resolution: "local" | "google") => Promise<void>;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolve,
}) => {
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());

  const handleResolve = async (eventId: string, resolution: "local" | "google") => {
    try {
      setResolving(eventId);
      await onResolve(eventId, resolution);
      setResolvedConflicts(prev => new Set(prev).add(eventId));
    } catch (error) {
      console.error("Failed to resolve conflict:", error);
      alert("Échec de la résolution du conflit");
    } finally {
      setResolving(null);
    }
  };

  const unresolvedConflicts = conflicts.filter(c => !resolvedConflicts.has(c.eventId));

  const handleClose = () => {
    if (unresolvedConflicts.length === 0) {
      setResolvedConflicts(new Set());
      onClose();
    } else if (confirm(`Il reste ${unresolvedConflicts.length} conflit(s) non résolu(s). Fermer quand même?`)) {
      setResolvedConflicts(new Set());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-3xl mx-4 sm:mx-auto">
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Résolution de conflits
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choisissez quelle version conserver pour chaque événement
            </p>
          </div>
        </div>

        {unresolvedConflicts.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Tous les conflits ont été résolus !
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar mb-4 -mx-1 px-1">
            {unresolvedConflicts.map((conflict) => (
              <div
                key={conflict.eventId}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                  {conflict.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Local
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(conflict.localUpdated).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Google
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(conflict.googleUpdated).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleResolve(conflict.eventId, "local")}
                    disabled={resolving === conflict.eventId}
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center"
                  >
                    {resolving === conflict.eventId ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        En cours...
                      </span>
                    ) : "Garder local"}
                  </Button>

                  <Button
                    onClick={() => handleResolve(conflict.eventId, "google")}
                    disabled={resolving === conflict.eventId}
                    variant="primary"
                    size="sm"
                    className="flex-1 justify-center"
                  >
                    {resolving === conflict.eventId ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        En cours...
                      </span>
                    ) : "Garder Google"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleClose} variant="outline" className="w-full sm:w-auto justify-center">
            {unresolvedConflicts.length === 0 ? "Fermer" : "Annuler"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConflictResolutionModal;
