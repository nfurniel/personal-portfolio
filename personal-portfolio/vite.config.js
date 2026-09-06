import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Nombre del paquete al que pertenece un módulo de node_modules ('@scope/name'
// incluido). Antes esto se resolvía con id.includes(), que además de 'three'
// capturaba cualquier ruta que contuviera esa cadena.
function packageOf(id) {
  const match = id.match(/[\\/]node_modules[\\/](?:(@[^\\/]+)[\\/])?([^\\/]+)/)
  if (!match) return null
  return match[1] ? `${match[1]}/${match[2]}` : match[2]
}

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
          const pkg = packageOf(id)
          if (!pkg) return

          // matter-js solo se alcanza desde un await import() dentro de Stack.
          // Asignarle un chunk manual lo devolvía al bundle inicial y anulaba
          // ese import dinámico, así que aquí se deja a Rollup.
          if (pkg === 'matter-js') return

          // three y r3f cuelgan del lazy() de ContactFigure: siguen siendo un
          // chunk propio, pero solo se descarga al llegar a la sección.
          if (pkg === 'three' || pkg.startsWith('@react-three')) return 'three'

          if (pkg === 'gsap') return 'gsap'
          if (pkg === 'motion' || pkg === 'motion-dom' || pkg === 'motion-utils') return 'motion'
          if (pkg === 'react-icons') return 'icons'
          if (pkg === 'ogl') return 'ogl'
          return 'vendor'
        }
      }
    }
  },
  server: {
    host: true
  }
})
