# SaasConcour

Une application SaaS moderne construite avec React, TypeScript, et Tailwind CSS.

## 🚀 Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Base de données**: Prisma ORM
- **Authentification**: bcryptjs
- **UI/UX**: TailAdmin template, ApexCharts, FullCalendar
- **Build**: Vite
- **Déploiement**: Vercel ready

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- pnpm (recommandé) ou npm
- Base de données (PostgreSQL, MySQL, ou SQLite)

## 🛠️ Installation

1. **Cloner le repository**

   ```bash
   git clone <repository-url>
   cd SaasConcour
   ```

2. **Installer les dépendances**

   ```bash
   pnpm install
   ```

3. **Configuration de l'environnement**

   ```bash
   cp .env.example .env
   ```

   Remplissez les variables d'environnement dans le fichier `.env`

4. **Configuration de la base de données**
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

## 🚀 Démarrage

### Développement

```bash
pnpm dev
```

### Build de production

```bash
pnpm build
```

### Prévisualisation

```bash
pnpm preview
```

## 📊 Scripts disponibles

- `pnpm dev` - Démarre le serveur de développement
- `pnpm build` - Build l'application pour la production
- `pnpm preview` - Prévisualise le build de production
- `pnpm lint` - Vérifie le code avec ESLint
- `pnpm db:generate` - Génère le client Prisma
- `pnpm db:push` - Pousse le schéma vers la base de données
- `pnpm db:migrate` - Exécute les migrations
- `pnpm db:studio` - Ouvre Prisma Studio
- `pnpm db:seed` - Seed la base de données
- `pnpm db:reset` - Reset et seed la base de données

## 🏗️ Structure du projet

```
src/
├── components/     # Composants réutilisables
├── layout/        # Composants de mise en page
├── pages/         # Pages de l'application
├── hooks/         # Hooks React personnalisés
├── utils/         # Fonctions utilitaires
└── types/         # Types TypeScript

prisma/
├── schema.prisma  # Schéma de base de données
└── seed.ts       # Script de seed

public/           # Assets statiques
```

## 🔧 Configuration

### Variables d'environnement

Consultez `.env.example` pour voir toutes les variables d'environnement requises.

### Base de données

Le projet utilise Prisma ORM. Configurez votre `DATABASE_URL` dans le fichier `.env` selon votre base de données.

## 🚀 Déploiement

### Vercel (recommandé)

```bash
pnpm vercel-build
```

### GitHub Pages

```bash
pnpm deploy
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support, n'hésitez pas à ouvrir une issue sur GitHub.
