import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'vercel-api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/status') && req.method === 'GET') {
              try {
                process.env = { ...process.env, ...env };
                const urlObj = new URL(req.url, `http://${req.headers.host}`);
                req.query = Object.fromEntries(urlObj.searchParams);
                const handler = (await import('./api/status.js')).default;
                await handler(req, res);
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({error: 'Dev server mock error', details: e.message}));
              }
              return;
            }

            if (req.url === '/api/transaction' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  // Inject env variables so transaction.js can read process.env.MIDTRANS_SERVER_KEY
                  process.env = { ...process.env, ...env };
                  req.body = body ? JSON.parse(body) : {};
                  const handler = (await import('./api/transaction.js')).default;
                  await handler(req, res);
                } catch (e) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({error: 'Dev server mock error', details: e.message}));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'ui-vendor': ['lucide-react', 'motion']
          }
        }
      }
    }
  };
});
