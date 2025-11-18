-- Script pour réinitialiser la base de données
-- Supprimer toutes les données et recréer l'enum

-- 1. Supprimer toutes les données
TRUNCATE TABLE "appointments" CASCADE;
TRUNCATE TABLE "events" CASCADE;
TRUNCATE TABLE "tasks" CASCADE;
TRUNCATE TABLE "projects" CASCADE;
TRUNCATE TABLE "clients" CASCADE;
TRUNCATE TABLE "users" CASCADE;

-- 2. Supprimer l'ancien enum
DROP TYPE IF EXISTS "Role" CASCADE;

-- 3. Créer le nouvel enum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
