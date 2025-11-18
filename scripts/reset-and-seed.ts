import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🔄 Réinitialisation de la base de données...\n");

  try {
    // 1. Supprimer toutes les données
    console.log("1️⃣ Suppression des données...");
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "appointments" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "events" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "tasks" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "projects" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "clients" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE;');
    console.log("✅ Données supprimées\n");

    // 2. Supprimer et recréer l'enum
    console.log("2️⃣ Mise à jour de l'enum Role...");
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "Role" CASCADE;');
    await prisma.$executeRawUnsafe(
      "CREATE TYPE \"Role\" AS ENUM ('ADMIN', 'USER');"
    );
    console.log("✅ Enum mis à jour\n");

    // 3. Recréer la colonne role avec le bon type
    console.log("3️⃣ Recréation de la colonne role...");
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT \'USER\';'
    );
    console.log("✅ Colonne recréée\n");

    console.log("✅ Base de données réinitialisée avec succès!\n");
    console.log("🌱 Lancement du seed...\n");

    // 4. Fermer la connexion Prisma
    await prisma.$disconnect();

    // 5. Lancer le seed
    execSync("npm run db:seed", { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Erreur:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetDatabase();
