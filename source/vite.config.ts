import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // El catálogo generado (~1 MB) va en su propio chunk; se carga con import() en data.ts.
          manualChunks(id) {
            if (id.includes('data2027.generated')) return 'catalogo-2027';
          },
        },
      },
      // Ese chunk de datos supera los 500 kB por diseño (88 kB gzip); el resto queda bajo el límite.
      chunkSizeWarningLimit: 1100,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
