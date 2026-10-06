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
    },
    esbuild: {
      legalComments: 'none' as const,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1200,
      sourcemap: true,
      cssCodeSplit: true,
      target: 'es2020',
      minify: 'esbuild' as const,
      modulePreload: {
        polyfill: false,
        resolveDependencies(_filename, deps) {
          // Strictly limit initial modulepreload to essential entry scripts.
          // Defer all secondary page chunks (Courses, MockTest, Pricing, Admin, etc.) and heavy libraries.
          return deps.filter(dep => 
            dep.includes('vendor-icons') || 
            dep.includes('vendor-supabase')
          );
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('@dnd-kit')) return 'vendor-dnd';
              if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
