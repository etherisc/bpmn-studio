import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/bpmn-studio/app/' : '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
  },
  optimizeDeps: {
    include: ['bpmn-js', 'bpmn-js-properties-panel', 'bpmnlint']
  },
  publicDir: 'assets'
}))
