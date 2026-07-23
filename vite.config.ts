import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages sert un site de projet sous /<dépôt>/, un domaine dédié le
  // sert depuis la racine. Des chemins relatifs conviennent aux deux, et le
  // site n'en a pas besoin de plus : une seule page, aucun routeur côté
  // client. BASE_PATH reste disponible pour forcer un préfixe absolu.
  base: process.env.BASE_PATH ?? './',
  build: {
    rollupOptions: {
      output: {
        // KaTeX ne bouge jamais, le simulateur change à chaque déploiement :
        // les séparer laisse le cache du navigateur garder le premier quand le
        // second est remplacé.
        manualChunks: (id: string) => (id.includes('node_modules/katex') ? 'katex' : undefined),
      },
    },
  },
  server: {
    // Respecte le port imposé par l'environnement (aperçu, conteneur, CI).
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
