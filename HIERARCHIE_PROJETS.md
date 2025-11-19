# 🏗️ Hiérarchie de Gestion des Projets

## 📊 Vue d'ensemble

Le système implémente une hiérarchie à 3 niveaux pour la gestion des projets :

```
ADMIN (Administrateur)
    ↓
PROJECT_MANAGER (Chef de Projet)
    ↓
USER (Membre d'équipe)
```

---

## 👥 Rôles et Permissions

### 👑 ADMIN (Administrateur)

**Responsabilités :** Direction et supervision globale

**Permissions projets :**

- ✅ Voir **tous** les projets de l'entreprise
- ✅ Créer des projets
- ✅ Assigner des chefs de projet
- ✅ Modifier n'importe quel projet
- ✅ Supprimer des projets
- ✅ Réassigner des projets à d'autres chefs
- ✅ Voir toutes les tâches de tous les projets

**Permissions utilisateurs :**

- ✅ Créer/Modifier/Supprimer des utilisateurs
- ✅ Promouvoir des USER en PROJECT_MANAGER
- ✅ Rétrograder des PROJECT_MANAGER en USER
- ✅ Gérer les rôles

**API Endpoints :**

```typescript
GET    /api/projects              // Tous les projets
POST   /api/projects              // Créer un projet
PUT    /api/projects/:id          // Modifier n'importe quel projet
DELETE /api/projects/:id          // Supprimer un projet
GET    /api/users                 // Tous les utilisateurs
POST   /api/users/:id/promote     // Promouvoir un utilisateur
```

---

### 👨‍💼 PROJECT_MANAGER (Chef de Projet)

**Responsabilités :** Gestion opérationnelle de projets assignés

**Permissions projets :**

- ✅ Voir **uniquement ses projets** (où il est projectManager)
- ✅ Modifier ses projets (nom, description, dates, statut)
- ✅ Voir toutes les tâches de ses projets
- ❌ Ne peut **pas** créer de projet (seul ADMIN)
- ❌ Ne peut **pas** supprimer de projet
- ❌ Ne peut **pas** réassigner le projet à un autre chef
- ❌ Ne peut **pas** voir les projets des autres chefs

**Permissions tâches :**

- ✅ Créer des tâches dans ses projets
- ✅ Assigner des tâches aux membres (USER)
- ✅ Modifier toutes les tâches de ses projets
- ✅ Changer les priorités et deadlines
- ✅ Voir les statistiques de ses projets

**API Endpoints :**

```typescript
GET    /api/projects              // Ses projets uniquement
GET    /api/projects/:id          // Détails si c'est son projet
PUT    /api/projects/:id          // Modifier son projet
POST   /api/projects/:id/tasks    // Créer une tâche
PUT    /api/tasks/:id             // Modifier une tâche de son projet
GET    /api/users?role=USER       // Liste des USER pour assigner
```

---

### 👤 USER (Membre d'équipe)

**Responsabilités :** Exécution des tâches assignées

**Permissions projets :**

- ✅ Voir **uniquement les projets** où il a des tâches
- ✅ Voir les détails du projet (description, dates, chef)
- ❌ Ne peut **pas** modifier le projet
- ❌ Ne peut **pas** voir les projets où il n'a pas de tâches

**Permissions tâches :**

- ✅ Voir **uniquement ses tâches** assignées
- ✅ Modifier le statut de ses tâches (TODO → IN_PROGRESS → REVIEW → DONE)
- ✅ Ajouter des commentaires sur ses tâches
- ❌ Ne peut **pas** créer de tâches
- ❌ Ne peut **pas** assigner des tâches
- ❌ Ne peut **pas** voir les tâches des autres

**API Endpoints :**

```typescript
GET    /api/projects              // Projets où il a des tâches
GET    /api/projects/:id          // Détails si il a des tâches dedans
GET    /api/tasks/my-tasks        // Ses tâches uniquement
PUT    /api/tasks/:id/status      // Changer statut de sa tâche
```

---

## 🔐 Matrice des Permissions

| Action                        | ADMIN | PROJECT_MANAGER |  USER  |
| ----------------------------- | :---: | :-------------: | :----: |
| **PROJETS**                   |
| Voir tous les projets         |  ✅   |       ❌        |   ❌   |
| Voir ses projets              |  ✅   |       ✅        |  ✅\*  |
| Créer un projet               |  ✅   |       ❌        |   ❌   |
| Modifier un projet            |  ✅   |      ✅\*       |   ❌   |
| Supprimer un projet           |  ✅   |       ❌        |   ❌   |
| Réassigner un projet          |  ✅   |       ❌        |   ❌   |
| **TÂCHES**                    |
| Voir toutes les tâches        |  ✅   |      ✅\*       |   ❌   |
| Voir ses tâches               |  ✅   |       ✅        |   ✅   |
| Créer une tâche               |  ✅   |      ✅\*       |   ❌   |
| Assigner une tâche            |  ✅   |      ✅\*       |   ❌   |
| Modifier une tâche            |  ✅   |      ✅\*       | ✅\*\* |
| Supprimer une tâche           |  ✅   |      ✅\*       |   ❌   |
| **UTILISATEURS**              |
| Voir tous les utilisateurs    |  ✅   |       ❌        |   ❌   |
| Créer un utilisateur          |  ✅   |       ❌        |   ❌   |
| Promouvoir en PROJECT_MANAGER |  ✅   |       ❌        |   ❌   |
| Modifier un utilisateur       |  ✅   |       ❌        |   ❌   |

\* = Uniquement dans ses projets  
\*\* = Uniquement ses propres tâches

---

## 🔄 Flux de Travail Typique

### 1. Création d'un Projet

```mermaid
ADMIN crée projet
    ↓
Assigne PROJECT_MANAGER
    ↓
PROJECT_MANAGER crée tâches
    ↓
Assigne tâches aux USER
    ↓
USER exécute tâches
```

### 2. Exemple Concret

**Projet : "Refonte Site Web"**

1. **ADMIN** (Marie) crée le projet

   - Nom : "Refonte Site Web"
   - Chef de projet : Thomas (PROJECT_MANAGER)
   - Dates : 01/12/2024 → 31/01/2025

2. **PROJECT_MANAGER** (Thomas) organise

   - Crée tâche : "Design maquettes" → Assigne à Sophie (USER)
   - Crée tâche : "Développement frontend" → Assigne à Lucas (USER)
   - Crée tâche : "Tests" → Assigne à Emma (USER)

3. **USER** (Sophie, Lucas, Emma) exécutent
   - Sophie : Design maquettes (TODO → IN_PROGRESS → REVIEW → DONE)
   - Lucas : Dev frontend (TODO → IN_PROGRESS)
   - Emma : Attend que Lucas finisse

---

## 🛠️ Implémentation Technique

### Vérification des permissions (Backend)

```typescript
// Exemple : Modifier un projet
const canEdit =
  userRole === "ADMIN" ||
  (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId);

if (!canEdit) {
  return res.status(403).json({ error: "Permission refusée" });
}
```

### Filtrage des données selon le rôle

```typescript
// ADMIN : tous les projets
if (userRole === "ADMIN") {
  projects = await prisma.project.findMany();
}

// PROJECT_MANAGER : ses projets
else if (userRole === "PROJECT_MANAGER") {
  projects = await prisma.project.findMany({
    where: { projectManagerId: userId },
  });
}

// USER : projets où il a des tâches
else {
  projects = await prisma.project.findMany({
    where: {
      tasks: { some: { assigneeId: userId } },
    },
  });
}
```

---

## 📁 Fichiers Créés

### Backend

- `server/routes/projects.ts` - API de gestion des projets
- `server/routes/auth.ts` - Authentification (mis à jour)

### Frontend

- `src/lib/permissions.ts` - Fonctions de vérification des permissions
- `src/context/AuthContext.tsx` - Types mis à jour avec PROJECT_MANAGER

### Base de données

- `prisma/schema.prisma` - Enum Role mis à jour
- Migration à créer : `add_project_manager_role`

### Documentation

- `HIERARCHIE_PROJETS.md` - Ce fichier
- `MIGRATION_ROLES.md` - Guide de migration

---

## 🚀 Prochaines Étapes

### 1. Migration de la base de données

```bash
# Option A : Reset (développement)
npx prisma migrate dev --name add_project_manager_role

# Option B : Migration manuelle (production)
# Voir MIGRATION_ROLES.md
```

### 2. Créer les composants UI

- Dashboard ADMIN
- Dashboard PROJECT_MANAGER
- Dashboard USER
- Formulaire de création de projet
- Liste des projets avec filtres selon rôle

### 3. Implémenter les routes de tâches

- `POST /api/projects/:id/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/my-tasks`

### 4. Ajouter l'authentification JWT

- Remplacer `x-user-id` header par JWT token
- Middleware d'authentification
- Refresh tokens

---

## 💡 Conseils d'Utilisation

### Pour les ADMIN

- Créez d'abord des utilisateurs avec le rôle PROJECT_MANAGER
- Assignez-les aux projets lors de la création
- Surveillez les statistiques globales

### Pour les PROJECT_MANAGER

- Décomposez les projets en tâches claires
- Assignez les tâches selon les compétences
- Suivez l'avancement régulièrement

### Pour les USER

- Mettez à jour le statut de vos tâches
- Communiquez les blocages
- Respectez les deadlines

---

## 🔍 Exemples d'API

### Créer un projet (ADMIN)

```bash
POST /api/projects
Headers: x-user-id: <admin-id>
Body: {
  "name": "Nouveau Projet",
  "description": "Description du projet",
  "projectManagerId": "<manager-id>",
  "startDate": "2024-12-01",
  "endDate": "2025-01-31"
}
```

### Lister ses projets (PROJECT_MANAGER)

```bash
GET /api/projects
Headers: x-user-id: <manager-id>

Response: {
  "projects": [
    {
      "id": "...",
      "name": "Projet A",
      "projectManager": { "name": "Thomas" },
      "tasks": [...]
    }
  ]
}
```

### Voir ses tâches (USER)

```bash
GET /api/projects
Headers: x-user-id: <user-id>

Response: {
  "projects": [
    {
      "id": "...",
      "name": "Projet A",
      "tasks": [
        // Uniquement ses tâches
      ]
    }
  ]
}
```
