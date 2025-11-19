# 🚀 Déploiement sur Vercel

## ✅ Configuration Terminée !

Votre application est maintenant prête pour Vercel avec **Serverless Functions**.

---

## 📁 Structure

```
/api                    → Serverless Functions (Backend)
  /auth
    /login.ts          → POST /api/auth/login
    /register.ts       → POST /api/auth/register
  /projects
    /index.ts          → GET/POST /api/projects

/src                    → Frontend React
/server                 → Backend Express (dev uniquement)
```

---

## 🔧 Configuration

### 1. Variables d'Environnement sur Vercel

Allez dans **Settings → Environment Variables** et ajoutez :

```
DATABASE_URL=votre_url_postgresql_neon
```

### 2. Build Settings

Vercel détectera automatiquement :

- **Build Command** : `npm run vercel-build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

---

## 🚀 Déploiement

### Option 1 : Via GitHub (Recommandé)

1. **Push votre code sur GitHub**

   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Importer votre repo GitHub
   - Ajouter la variable `DATABASE_URL`
   - Cliquer sur "Deploy"

### Option 2 : Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Ou directement en production
vercel --prod
```

---

## 🧪 Test Local

### Développement (avec serveur Express)

```bash
npm run dev:all
```

- Frontend : http://localhost:5173
- Backend : http://localhost:3001

### Test Vercel Local

```bash
vercel dev
```

- Tout sur : http://localhost:3000
- Simule l'environnement Vercel

---

## 📊 Fonctionnement

### En Développement

- Frontend appelle `http://localhost:3001/api`
- Backend Express répond

### En Production (Vercel)

- Frontend appelle `/api` (même domaine)
- Serverless Functions répondent
- Pas besoin de CORS

---

## ✅ Checklist Avant Déploiement

- [x] @vercel/node installé
- [x] /api créé avec les Serverless Functions
- [x] vercel.json configuré
- [x] API_URL configuré (dev vs prod)
- [x] vercel-build script dans package.json
- [ ] DATABASE_URL configuré sur Vercel
- [ ] Code pushé sur GitHub
- [ ] Projet connecté à Vercel

---

## 🔄 Workflow

1. **Développement Local**

   ```bash
   npm run dev:all
   ```

2. **Commit & Push**

   ```bash
   git add .
   git commit -m "Feature: ..."
   git push
   ```

3. **Auto-Deploy**
   - Vercel détecte le push
   - Build automatique
   - Deploy en production

---

## 🐛 Troubleshooting

### Erreur : "Module not found @prisma/client"

```bash
# Sur Vercel, vérifier que vercel-build est bien exécuté
# Il contient : prisma generate
```

### Erreur : "DATABASE_URL not found"

- Vérifier les variables d'environnement sur Vercel
- Settings → Environment Variables

### Erreur 500 sur /api

- Vérifier les logs : `vercel logs`
- Vérifier que Prisma est généré

---

## 📝 Notes

- **Cold Starts** : Première requête peut être lente (2-3s)
- **Timeout** : Max 10 secondes par fonction
- **Limites Gratuites** :
  - 100 GB-hours/mois
  - 100 déploiements/jour
  - Serverless Functions illimitées

---

## 🎉 C'est Prêt !

Votre application fonctionne maintenant :

- ✅ En local avec Express
- ✅ Sur Vercel avec Serverless Functions
- ✅ Avec la même base de données PostgreSQL

**Déployez et profitez ! 🚀**
