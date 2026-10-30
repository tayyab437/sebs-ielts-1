import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function asyncCssPlugin() {
  return {
    name: 'async-css-plugin',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      // Replace standard render-blocking CSS link with non-blocking preload + media switch
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        '<link rel="preload" as="style" crossorigin href="$1" />\n    <link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media=\'all\'" />\n    <noscript><link rel="stylesheet" crossorigin href="$1" /></noscript>'
      );
    }
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), asyncCssPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router',
        'react-router-dom',
      ],
    },
    esbuild: {
      legalComments: 'none' as const,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 2500,
      sourcemap: true,
      cssCodeSplit: true,
      target: 'es2020',
      minify: 'esbuild' as const,
      modulePreload: {
        polyfill: false,
        resolveDependencies(_filename, deps) {
          // Strictly limit initial modulepreload to essential core framework and router scripts.
          // Defer all secondary libraries (vendor-supabase, vendor-base-ui, vendor-charts, vendor-markdown, etc.)
          return deps.filter(dep => 
            dep.includes('vendor-framework') ||
            dep.includes('vendor-router')
          );
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. Core React framework (react, react-dom, scheduler, use-sync-external-store, react-is)
              if (/[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store|react-is)[\\/]/.test(id)) {
                return 'vendor-framework';
              }
              // 2. React Router
              if (/[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id)) {
                return 'vendor-router';
              }
              // 3. Base UI and floating ui (only loaded by routes that use Dialog/Tabs/Accordion/Progress)
              if (id.includes('@base-ui') || id.includes('@floating-ui')) {
                return 'vendor-base-ui';
              }
              // 4. Lucide icons
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // 5. Lightweight UI styling utils
              if (/[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/.test(id)) {
                return 'vendor-utils';
              }
              // 6. Heavy feature libraries (deferred / lazy routes only)
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('@dnd-kit')) return 'vendor-dnd';
              if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('recharts') || id.includes('d3') || id.includes('victory') || id.includes('decimal.js')) return 'vendor-charts';
              if (id.includes('react-markdown') || id.includes('rehype') || id.includes('remark')) return 'vendor-markdown';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: false,
      watch: null,
    },
  };
});
