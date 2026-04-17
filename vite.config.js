import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In GitHub Actions, GITHUB_REPOSITORY = "owner/repo-name"
// We use the repo name as the base path for GitHub Pages
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
})
