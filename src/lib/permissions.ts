// Types de rôles
export type Role = "ADMIN" | "PROJECT_MANAGER" | "USER";

// Interface utilisateur simplifiée pour les permissions
export interface UserPermissions {
  id: string;
  role: Role;
}

/**
 * Vérifie si l'utilisateur est un administrateur
 */
export const isAdmin = (user: UserPermissions | null): boolean => {
  return user?.role === "ADMIN";
};

/**
 * Vérifie si l'utilisateur est un chef de projet
 */
export const isProjectManager = (user: UserPermissions | null): boolean => {
  return user?.role === "PROJECT_MANAGER";
};

/**
 * Vérifie si l'utilisateur est un utilisateur simple
 */
export const isUser = (user: UserPermissions | null): boolean => {
  return user?.role === "USER";
};

/**
 * Vérifie si l'utilisateur peut gérer des projets (ADMIN ou PROJECT_MANAGER)
 */
export const canManageProjects = (user: UserPermissions | null): boolean => {
  return isAdmin(user) || isProjectManager(user);
};

/**
 * Vérifie si l'utilisateur peut créer un projet (ADMIN uniquement)
 */
export const canCreateProject = (user: UserPermissions | null): boolean => {
  return isAdmin(user);
};

/**
 * Vérifie si l'utilisateur peut modifier un projet spécifique
 * @param user - Utilisateur actuel
 * @param projectManagerId - ID du chef de projet du projet
 */
export const canEditProject = (
  user: UserPermissions | null,
  projectManagerId: string
): boolean => {
  if (!user) return false;

  // ADMIN peut tout modifier
  if (isAdmin(user)) return true;

  // PROJECT_MANAGER peut modifier ses propres projets
  if (isProjectManager(user) && user.id === projectManagerId) return true;

  return false;
};

/**
 * Vérifie si l'utilisateur peut supprimer un projet (ADMIN uniquement)
 */
export const canDeleteProject = (user: UserPermissions | null): boolean => {
  return isAdmin(user);
};

/**
 * Vérifie si l'utilisateur peut créer des tâches dans un projet
 * @param user - Utilisateur actuel
 * @param projectManagerId - ID du chef de projet du projet
 */
export const canCreateTask = (
  user: UserPermissions | null,
  projectManagerId: string
): boolean => {
  if (!user) return false;

  // ADMIN peut créer des tâches partout
  if (isAdmin(user)) return true;

  // PROJECT_MANAGER peut créer des tâches dans ses projets
  if (isProjectManager(user) && user.id === projectManagerId) return true;

  return false;
};

/**
 * Vérifie si l'utilisateur peut assigner des tâches
 * @param user - Utilisateur actuel
 * @param projectManagerId - ID du chef de projet du projet
 */
export const canAssignTask = (
  user: UserPermissions | null,
  projectManagerId: string
): boolean => {
  return canCreateTask(user, projectManagerId);
};

/**
 * Vérifie si l'utilisateur peut modifier le statut d'une tâche
 * @param user - Utilisateur actuel
 * @param taskAssigneeId - ID de la personne assignée à la tâche
 * @param projectManagerId - ID du chef de projet du projet
 */
export const canUpdateTaskStatus = (
  user: UserPermissions | null,
  taskAssigneeId: string,
  projectManagerId?: string
): boolean => {
  if (!user) return false;

  // ADMIN peut tout modifier
  if (isAdmin(user)) return true;

  // PROJECT_MANAGER peut modifier les tâches de ses projets
  if (
    isProjectManager(user) &&
    projectManagerId &&
    user.id === projectManagerId
  ) {
    return true;
  }

  // USER peut modifier ses propres tâches
  if (user.id === taskAssigneeId) return true;

  return false;
};

/**
 * Vérifie si l'utilisateur peut voir un projet
 * @param user - Utilisateur actuel
 * @param projectManagerId - ID du chef de projet du projet
 * @param hasAssignedTasks - Si l'utilisateur a des tâches assignées dans ce projet
 */
export const canViewProject = (
  user: UserPermissions | null,
  projectManagerId: string,
  hasAssignedTasks: boolean = false
): boolean => {
  if (!user) return false;

  // ADMIN peut tout voir
  if (isAdmin(user)) return true;

  // PROJECT_MANAGER peut voir ses projets
  if (isProjectManager(user) && user.id === projectManagerId) return true;

  // USER peut voir les projets où il a des tâches
  if (isUser(user) && hasAssignedTasks) return true;

  return false;
};

/**
 * Vérifie si l'utilisateur peut gérer les utilisateurs (ADMIN uniquement)
 */
export const canManageUsers = (user: UserPermissions | null): boolean => {
  return isAdmin(user);
};

/**
 * Vérifie si l'utilisateur peut promouvoir un utilisateur en PROJECT_MANAGER (ADMIN uniquement)
 */
export const canPromoteUser = (user: UserPermissions | null): boolean => {
  return isAdmin(user);
};

/**
 * Retourne un message d'erreur de permission
 */
export const getPermissionError = (action: string): string => {
  return `Vous n'avez pas la permission de ${action}`;
};
