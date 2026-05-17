import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

function validateProductionEnv(): Plugin {
  return {
    name: 'validate-production-env',
    config(_config, { command, mode }) {
      const env = loadEnv(mode, process.cwd(), '')

      if (command === 'build' && mode === 'production' && !env.VITE_API_BASE_URL) {
        throw new Error('Missing VITE_API_BASE_URL. Set it on the frontend deploy service.')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [validateProductionEnv(), vue(), vueDevTools(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
