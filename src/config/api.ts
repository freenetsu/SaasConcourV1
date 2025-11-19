// Configuration de l'URL de l'API
// En développement : utilise le serveur local Express
// En production (Vercel) : utilise les Serverless Functions (/api)

export const API_URL = import.meta.env.PROD
  ? "/api" // Production sur Vercel
  : "http://localhost:3001/api"; // Développement local
