import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:3001/api";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectMembersProps {
  projectId: string;
  projectManagerId: string;
}

export default function ProjectMembers({
  projectId,
  projectManagerId,
}: ProjectMembersProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Member[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isProjectManager = user?.id === projectManagerId;
  const canManage = isAdmin || isProjectManager;

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setMembers(data.members || []);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/available-members`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setAvailableUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching available users:", err);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setIsAdding(true);
      setError("");

      const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      setMembers(data.members);
      setSelectedUsers([]);
      setShowAddModal(false);
      fetchAvailableUsers(); // Rafraîchir la liste
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre du projet ?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du retrait");
      }

      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    fetchAvailableUsers();
  };

  if (isLoading) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Chargement des membres...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Membres du projet ({members.length})
        </h3>
        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            + Ajouter des membres
          </button>
        )}
      </div>

      {/* Liste des membres */}
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun membre dans ce projet. Ajoutez des membres pour pouvoir leur
            assigner des tâches.
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/20">
                  <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Retirer
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Ajouter des membres
            </h3>

            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mb-4 space-y-2 max-h-64 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucun utilisateur disponible
                </p>
              ) : (
                availableUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== user.id)
                          );
                        }
                      }}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddMembers}
                disabled={isAdding || selectedUsers.length === 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? "Ajout..." : `Ajouter (${selectedUsers.length})`}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUsers([]);
                  setError("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
