#!/bin/bash

echo "🔄 Migration des rôles vers PROJECT_MANAGER"
echo "==========================================="
echo ""
echo "⚠️  ATTENTION: Cette opération va reset la base de données"
echo "Toutes les données actuelles seront perdues."
echo ""
read -p "Voulez-vous continuer? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "📦 Génération du client Prisma..."
    npx prisma generate
    
    echo ""
    echo "🗄️  Application de la migration..."
    echo "y" | npx prisma migrate dev --name add_project_manager_role
    
    echo ""
    echo "✅ Migration terminée!"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Redémarrer le serveur: npm run server"
    echo "2. Vérifier dans Prisma Studio: npm run db:studio"
    echo "3. Créer des utilisateurs avec les nouveaux rôles"
else
    echo ""
    echo "❌ Migration annulée"
    exit 1
fi
