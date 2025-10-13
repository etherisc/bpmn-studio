import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['bpmn-js', 'bpmn-js-properties-panel', 'bpmnlint']
  }
})
