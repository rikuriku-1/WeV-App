import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/WeV-App/',
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@pixiv/three-vrm'],
          mediapipe: ['@mediapipe/face_mesh', '@mediapipe/camera_utils', '@mediapipe/drawing_utils'],
          kalidokit: ['kalidokit']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'three',
      '@pixiv/three-vrm',
      '@mediapipe/face_mesh',
      '@mediapipe/camera_utils', 
      '@mediapipe/drawing_utils',
      'kalidokit',
      'stats.js'
    ]
  }
})