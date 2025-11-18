# Schéma de Base de Données - SaaS Concour

## Vue d'ensemble

Ce schéma Prisma définit la structure de la base de données PostgreSQL pour l'application SaaS de gestion d'entreprise.

## Entités principales

### 1. **User** (Utilisateurs)

- Gère les utilisateurs de l'application avec différents rôles (ADMIN, MANAGER, EMPLOYEE)
- Champs principaux : `email`, `name`, `password`, `role`
- Relations :
  - Gère plusieurs projets (1-n via `managedProjects`)
  - Possède plusieurs tâches assignées (1-n via `assignedTasks`)
  - Possède plusieurs événements de planning (1-n via `events`)
  - Possède plusieurs rendez-vous (1-n via `appointments`)

### 2. **Project** (Projets)

- Représente les projets de l'entreprise
- Champs principaux : `name`, `description`, `status`, `startDate`, `endDate`, `projectManagerId`
- Statuts disponibles : PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- Relations :
  - Appartient à un chef de projet (n-1 vers `User`)
  - Contient plusieurs tâches (1-n vers `Task`)

### 3. **Task** (Tâches)

- Représente les tâches liées aux projets
- Champs principaux : `title`, `description`, `status`, `priority`, `dueDate`, `projectId`, `assigneeId`
- Statuts : TODO, IN_PROGRESS, REVIEW, DONE
- Priorités : LOW, MEDIUM, HIGH, URGENT
- Relations :
  - Appartient à un projet (n-1 vers `Project`)
  - Assignée à un utilisateur (n-1 vers `User`)

### 4. **Event** (Événements)

- Gère le planning interne des utilisateurs
- Champs principaux : `title`, `description`, `type`, `startDate`, `endDate`, `userId`
- Types : MEETING, DEADLINE, REMINDER, OTHER
- Relations :
  - Appartient à un utilisateur (n-1 vers `User`)

### 5. **Client** (Clients)

- Représente les clients de l'entreprise
- Champs principaux : `name`, `email`, `phone`, `company`, `address`, `notes`
- Relations :
  - Possède plusieurs rendez-vous (1-n vers `Appointment`)

### 6. **Appointment** (Rendez-vous)

- Gère les rendez-vous avec les clients
- Champs principaux : `title`, `description`, `status`, `startDate`, `endDate`, `location`, `clientId`, `userId`
- Statuts : SCHEDULED, CONFIRMED, CANCELLED, COMPLETED
- Relations :
  - Appartient à un client (n-1 vers `Client`)
  - Appartient à un utilisateur (n-1 vers `User`)

## Relations du modèle

```
User (1) ----< (n) Project [projectManager]
User (1) ----< (n) Task [assignee]
User (1) ----< (n) Event [user]
User (1) ----< (n) Appointment [user]

Project (1) ----< (n) Task [project]

Client (1) ----< (n) Appointment [client]
```

## Installation et Configuration

### 1. Installer Prisma

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Configurer la base de données

Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="postgresql://username:password@localhost:5432/saas_concour?schema=public"
```

### 3. Initialiser la base de données

```bash
# Créer la migration initiale
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate
```

### 4. Ouvrir Prisma Studio (optionnel)

```bash
npx prisma studio
```

## Commandes utiles

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base de données (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Formater le schéma
npx prisma format

# Valider le schéma
npx prisma validate
```

## Fonctionnalités du schéma

- ✅ **Cascade Delete** : Suppression en cascade pour maintenir l'intégrité référentielle
- ✅ **Index** : Index sur les clés étrangères et champs fréquemment recherchés
- ✅ **Timestamps** : `createdAt` et `updatedAt` automatiques
- ✅ **Enums** : Types énumérés pour les statuts, rôles, priorités, etc.
- ✅ **Contraintes** : Emails uniques, relations obligatoires
- ✅ **Types de données** : Text pour les descriptions longues, DateTime pour les dates

## Exemple d'utilisation

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Créer un utilisateur
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    name: "John Doe",
    password: "hashed_password",
    role: "MANAGER",
  },
});

// Créer un projet avec son manager
const project = await prisma.project.create({
  data: {
    name: "Nouveau Projet",
    description: "Description du projet",
    status: "PLANNING",
    projectManagerId: user.id,
  },
});

// Créer une tâche liée au projet
const task = await prisma.task.create({
  data: {
    title: "Première tâche",
    status: "TODO",
    priority: "HIGH",
    projectId: project.id,
    assigneeId: user.id,
  },
});
```
