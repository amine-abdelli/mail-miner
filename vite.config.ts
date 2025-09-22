import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: 'src/index.ts',
      name: 'mail-miner',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['fs', 'path', 'url', 'crypto', 'os', 'util', 'stream', 'events'],
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  esbuild: {
    platform: 'node'
  }
})