import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBase = repo ? `/${repo}/` : '/'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages hosts this repo at /kosmic-portfolio/. Local `vite` stays at `/`.
  base: process.env.GITHUB_ACTIONS ? pagesBase : '/',
})
