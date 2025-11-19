import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAPI() {
  try {
    // Récupérer l'admin
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!admin) {
      console.log("❌ Aucun admin trouvé");
      return;
    }

    console.log("✅ Admin trouvé:", admin.email, admin.id);

    // Tester la requête comme le fait le frontend
    const response = await fetch(
      "http://localhost:3001/api/users/project-managers",
      {
        headers: {
          "x-user-id": admin.id,
        },
      }
    );

    const data = await response.json();

    console.log("\n📦 Réponse API:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data, null, 2));

    if (data.users) {
      console.log(`\n✅ ${data.users.length} manager(s) retourné(s)`);
      data.users.forEach((u: any) => {
        console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
