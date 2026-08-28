import { defineConfig } from 'vite'
export default defineConfig({ build: { target: 'es2022' }, test: { exclude: ['e2e/**', 'node_modules/**'] } })
