# Teranga Services

Plateforme de mise en relation entre artisans et clients à Dakar.

## Lancer en local (optionnel)

```
npm install
npm run dev
```

## Déployer sur Vercel

1. Crée un compte sur https://github.com et https://vercel.com (tu peux te connecter à Vercel directement avec ton compte GitHub).
2. Crée un nouveau dépôt ("New repository") sur GitHub, et mets-y tous les fichiers de ce dossier (bouton "Add file" → "Upload files" → glisse tous les fichiers, y compris le dossier `src`).
3. Sur Vercel, clique "Add New..." → "Project" → choisis ton dépôt GitHub.
4. Vercel détecte automatiquement Vite. Laisse les réglages par défaut et clique "Deploy".
5. Après 1-2 minutes, tu reçois un lien public du type `teranga-services.vercel.app`.

## Base de données

Ce projet utilise Supabase (déjà connecté dans `src/supabaseClient.js`).
Les tables `artisans` et `bookings` doivent exister dans ton projet Supabase
(voir le script SQL fourni séparément).

## Important

La clé utilisée dans `supabaseClient.js` est la clé "anon" (publique).
Ne mets jamais la clé "service_role" dans ce fichier — elle doit rester secrète.
