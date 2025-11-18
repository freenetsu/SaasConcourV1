import {
  AppointmentStatus,
  EventType,
  PrismaClient,
  ProjectStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyer la base de données
  await prisma.appointment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Base de données nettoyée");

  // Créer des utilisateurs
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@saasconcour.com",
      name: "Admin Principal",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const marie = await prisma.user.create({
    data: {
      email: "marie@saasconcour.com",
      name: "Marie Dupont",
      password: hashedPassword,
      role: Role.USER,
    },
  });

  const sophie = await prisma.user.create({
    data: {
      email: "sophie@saasconcour.com",
      name: "Sophie Bernard",
      password: hashedPassword,
      role: Role.USER,
    },
  });

  const thomas = await prisma.user.create({
    data: {
      email: "thomas@saasconcour.com",
      name: "Thomas Leroy",
      password: hashedPassword,
      role: Role.USER,
    },
  });

  const lucas = await prisma.user.create({
    data: {
      email: "lucas@saasconcour.com",
      name: "Lucas Petit",
      password: hashedPassword,
      role: Role.USER,
    },
  });

  const emma = await prisma.user.create({
    data: {
      email: "emma@saasconcour.com",
      name: "Emma Dubois",
      password: hashedPassword,
      role: Role.USER,
    },
  });

  console.log("✅ Utilisateurs créés");

  // Créer des projets
  const project1 = await prisma.project.create({
    data: {
      name: "Refonte Site Web",
      description:
        "Refonte complète du site web de l'entreprise avec une nouvelle identité visuelle",
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-06-30"),
      projectManagerId: marie.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Application Mobile",
      description: "Développement d'une application mobile iOS et Android",
      status: ProjectStatus.PLANNING,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-12-31"),
      projectManagerId: thomas.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Migration Cloud",
      description: "Migration de l'infrastructure vers AWS",
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-08-31"),
      projectManagerId: marie.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: "Système CRM",
      description: "Implémentation d'un nouveau système CRM",
      status: ProjectStatus.COMPLETED,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-12-31"),
      projectManagerId: thomas.id,
    },
  });

  console.log("✅ Projets créés");

  // Créer des tâches
  await prisma.task.createMany({
    data: [
      // Tâches pour Refonte Site Web
      {
        title: "Maquettes UI/UX",
        description: "Créer les maquettes pour toutes les pages du site",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: new Date("2025-02-15"),
        projectId: project1.id,
        assigneeId: sophie.id,
      },
      {
        title: "Développement Frontend",
        description: "Développer les composants React",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: new Date("2025-04-30"),
        projectId: project1.id,
        assigneeId: lucas.id,
      },
      {
        title: "Intégration API",
        description: "Intégrer les APIs backend",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date("2025-05-15"),
        projectId: project1.id,
        assigneeId: emma.id,
      },
      // Tâches pour Application Mobile
      {
        title: "Spécifications fonctionnelles",
        description: "Rédiger les spécifications détaillées",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        dueDate: new Date("2025-03-15"),
        projectId: project2.id,
        assigneeId: sophie.id,
      },
      {
        title: "Architecture technique",
        description: "Définir l'architecture de l'application",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date("2025-04-01"),
        projectId: project2.id,
        assigneeId: lucas.id,
      },
      // Tâches pour Migration Cloud
      {
        title: "Audit infrastructure",
        description: "Auditer l'infrastructure actuelle",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: new Date("2025-02-28"),
        projectId: project3.id,
        assigneeId: emma.id,
      },
      {
        title: "Configuration AWS",
        description: "Configurer les services AWS",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        dueDate: new Date("2025-04-15"),
        projectId: project3.id,
        assigneeId: lucas.id,
      },
      {
        title: "Tests de migration",
        description: "Effectuer les tests de migration",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date("2025-06-30"),
        projectId: project3.id,
        assigneeId: sophie.id,
      },
    ],
  });

  console.log("✅ Tâches créées");

  // Créer des événements
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.event.createMany({
    data: [
      {
        title: "Réunion d'équipe",
        description: "Point hebdomadaire avec l'équipe",
        type: EventType.MEETING,
        startDate: new Date(tomorrow.setHours(10, 0, 0, 0)),
        endDate: new Date(tomorrow.setHours(11, 0, 0, 0)),
        userId: marie.id,
      },
      {
        title: "Deadline Maquettes",
        description: "Date limite pour la livraison des maquettes",
        type: EventType.DEADLINE,
        startDate: new Date("2025-02-15T23:59:00"),
        endDate: new Date("2025-02-15T23:59:00"),
        userId: sophie.id,
      },
      {
        title: "Formation React",
        description: "Session de formation sur React 18",
        type: EventType.MEETING,
        startDate: new Date(nextWeek.setHours(14, 0, 0, 0)),
        endDate: new Date(nextWeek.setHours(17, 0, 0, 0)),
        userId: lucas.id,
      },
      {
        title: "Rappel: Revue de code",
        description: "Ne pas oublier la revue de code",
        type: EventType.REMINDER,
        startDate: new Date(tomorrow.setHours(15, 0, 0, 0)),
        endDate: new Date(tomorrow.setHours(15, 30, 0, 0)),
        userId: emma.id,
      },
    ],
  });

  console.log("✅ Événements créés");

  // Créer des clients
  const client1 = await prisma.client.create({
    data: {
      name: "Jean Durand",
      email: "jean.durand@entreprise.fr",
      phone: "+33 6 12 34 56 78",
      company: "Entreprise ABC",
      address: "123 Rue de la Paix, 75001 Paris",
      notes: "Client VIP - Contrat annuel",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Claire Moreau",
      email: "claire.moreau@startup.io",
      phone: "+33 6 98 76 54 32",
      company: "Startup XYZ",
      address: "456 Avenue des Champs, 69001 Lyon",
      notes: "Intéressé par nos services de développement",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Thomas Laurent",
      email: "thomas.laurent@corporation.com",
      phone: "+33 6 11 22 33 44",
      company: "Corporation Global",
      address: "789 Boulevard du Commerce, 33000 Bordeaux",
    },
  });

  console.log("✅ Clients créés");

  // Créer des rendez-vous
  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 2);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  await prisma.appointment.createMany({
    data: [
      {
        title: "Présentation du projet",
        description: "Présenter les maquettes et le planning",
        status: AppointmentStatus.CONFIRMED,
        startDate: new Date(nextDay.setHours(10, 0, 0, 0)),
        endDate: new Date(nextDay.setHours(11, 30, 0, 0)),
        location: "Bureaux Paris - Salle de réunion A",
        clientId: client1.id,
        userId: marie.id,
      },
      {
        title: "Découverte des besoins",
        description: "Premier rendez-vous pour comprendre les besoins",
        status: AppointmentStatus.SCHEDULED,
        startDate: new Date(inThreeDays.setHours(14, 0, 0, 0)),
        endDate: new Date(inThreeDays.setHours(15, 0, 0, 0)),
        location: "Visioconférence",
        clientId: client2.id,
        userId: thomas.id,
      },
      {
        title: "Suivi projet CRM",
        description: "Point d'avancement sur le projet CRM",
        status: AppointmentStatus.COMPLETED,
        startDate: new Date("2025-01-10T09:00:00"),
        endDate: new Date("2025-01-10T10:00:00"),
        location: "Bureaux client",
        clientId: client3.id,
        userId: marie.id,
      },
      {
        title: "Démonstration produit",
        description: "Démonstration de la nouvelle application",
        status: AppointmentStatus.SCHEDULED,
        startDate: new Date(nextWeek.setHours(11, 0, 0, 0)),
        endDate: new Date(nextWeek.setHours(12, 0, 0, 0)),
        location: "Bureaux Lyon",
        clientId: client2.id,
        userId: sophie.id,
      },
    ],
  });

  console.log("✅ Rendez-vous créés");

  // Afficher un résumé
  const userCount = await prisma.user.count();
  const projectCount = await prisma.project.count();
  const taskCount = await prisma.task.count();
  const eventCount = await prisma.event.count();
  const clientCount = await prisma.client.count();
  const appointmentCount = await prisma.appointment.count();

  console.log("\n📊 Résumé du seeding:");
  console.log(`   - ${userCount} utilisateurs`);
  console.log(`   - ${projectCount} projets`);
  console.log(`   - ${taskCount} tâches`);
  console.log(`   - ${eventCount} événements`);
  console.log(`   - ${clientCount} clients`);
  console.log(`   - ${appointmentCount} rendez-vous`);
  console.log("\n🎉 Seeding terminé avec succès!");
  console.log("\n🔑 Identifiants de connexion:");
  console.log("   Email: admin@saasconcour.com");
  console.log("   Mot de passe: password123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
