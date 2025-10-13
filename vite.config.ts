import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/bpmn-studio/app/' : '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['bpmn-js', 'bpmn-js-properties-panel', 'bpmnlint']
  },
  publicDir: 'assets'
})
