import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// URL pública del sitio: único lugar a cambiar si cambia el dominio.
// Se usa en las metas Open Graph/Twitter de index.html (%SITE_URL%) y en robots.txt/sitemap.xml.
const SITE_URL = 'https://simuladorpaes.vercel.app';

function sitePlugin(): Plugin {
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`;
  const files: Record<string, [string, string]> = {
    'robots.txt': [robots, 'text/plain'],
    'sitemap.xml': [sitemap, 'application/xml'],
  };
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const f = files[(req.url ?? '').replace(/^\//, '')];
        if (!f) return next();
        res.setHeader('Content-Type', f[1]);
        res.end(f[0]);
      });
    },
    generateBundle() {
      for (const [fileName, [source]] of Object.entries(files)) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sitePlugin()],
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
