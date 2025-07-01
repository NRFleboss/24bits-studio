# Guide de Déploiement Vercel - 24bits

## 🔧 Corrections Apportées

### Problèmes Résolus :

1. **Configuration Next.js en double** ✅
   - Supprimé `next.config.ts` 
   - Fusionné les configurations dans `next.config.js`

2. **API FFmpeg obsolète** ✅
   - Mise à jour vers la nouvelle API `@ffmpeg/ffmpeg` v0.12.15
   - Ajout du package `@ffmpeg/util` v0.12.1
   - Correction des imports et de l'utilisation

3. **Edge Runtime incompatible** ✅
   - Supprimé `export const runtime = "edge"` de `audio-convert/route.ts`
   - FFmpeg.wasm fonctionne maintenant correctement

4. **Configuration Netlify en conflit** ✅
   - Supprimé `netlify.toml`
   - Ajouté `vercel.json` avec configuration optimisée

5. **Headers CORS pour FFmpeg.wasm** ✅
   - Ajouté les headers nécessaires dans `next.config.js` et `vercel.json`

## 🚀 Étapes de Déploiement sur Vercel

### 1. Variables d'Environnement
Ajoutez ces variables dans votre dashboard Vercel :

```env
ACOUSTID_API_KEY=your_acoustid_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GENIUS_API_TOKEN=your_genius_token
```

### 2. Installation des Dépendances
```bash
npm install
```

### 3. Test Local
```bash
npm run dev
```

### 4. Build de Production
```bash
npm run build
```

### 5. Déploiement
- Push votre code sur GitHub
- Connectez votre repo à Vercel
- Le déploiement se fera automatiquement

## ⚠️ Points d'Attention

1. **FFmpeg.wasm** : Nécessite les headers CORS spéciaux (déjà configurés)
2. **Timeouts** : Les API routes ont un timeout de 30s (configuré dans `vercel.json`)
3. **Taille des fichiers** : Limite de 10MB pour les uploads (configuré dans `next.config.js`)

## 🐛 Dépannage

Si vous rencontrez encore des erreurs :

1. Vérifiez que toutes les variables d'environnement sont bien configurées
2. Vérifiez les logs Vercel pour identifier les erreurs spécifiques
3. Assurez-vous que la nouvelle version d'@ffmpeg/util est bien installée

## 📝 Notes Techniques

- **React 19** et **Next.js 15.3.0** : Versions récentes mais stables
- **TypeScript** : Configuration mise à jour pour compatibilité
- **ESLint** : Ignore les erreurs pendant le build (configuration temporaire) 