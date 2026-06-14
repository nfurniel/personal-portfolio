import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  // Caché de pre-bundle en carpeta nueva: la anterior (.vite) quedó con un
  // temporal bloqueado por el antivirus y provocaba EBUSY al arrancar.
  cacheDir: 'node_modules/.vite-cache',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three'
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('motion')) return 'motion'
            if (id.includes('react-icons')) return 'icons'
            if (id.includes('ogl')) return 'ogl'
            return 'vendor'
          }
        }
      }
    }
  },
  server: {
    host: true
  }
})
