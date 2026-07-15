import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
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
    };
  }

  return {
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
      },
    },
    server: {
      open: true,
    },
    preview: {
      open: true,
    },
  };
});
