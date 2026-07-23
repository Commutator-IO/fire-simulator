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
  server: {
    // Respecte le port imposé par l'environnement (aperçu, conteneur, CI).
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
