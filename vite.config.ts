import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EntsorgungsauftragForm',
      formats: ['es', 'iife'],
      fileName: (format) =>
        format === 'iife' ? 'entsorgungsauftrag-form.js' : 'entsorgungsauftrag-form.es.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    open: true,
  },
});
