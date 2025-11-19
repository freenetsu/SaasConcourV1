import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkAndCreateUsers() {
  try {
    console.log("🔍 Vérification des utilisateurs...\n");

    // Vérifier les utilisateurs existants
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - Rôle: ${user.role}`);
    });

    // Vérifier s'il y a au moins un ADMIN ou PROJECT_MANAGER
    const managers = users.filter(
      (u) => u.role === "ADMIN" || u.role === "PROJECT_MANAGER"
    );

    if (managers.length === 0) {
      console.log("\n⚠️  Aucun ADMIN ou PROJECT_MANAGER trouvé!");
      console.log("📝 Création d'un utilisateur ADMIN par défaut...\n");

      const hashedPassword = await bcrypt.hash("admin123", 10);

      const admin = await prisma.user.create({
        data: {
          email: "admin@example.com",
          password: hashedPassword,
          name: "Admin User",
          role: "ADMIN",
        },
      });

      console.log("✅ Utilisateur ADMIN créé:");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Rôle: ${admin.role}\n`);
    } else {
      console.log(`\n✅ ${managers.length} manager(s) disponible(s)\n`);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateUsers();
