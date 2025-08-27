import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

// Plugin to copy assets and srv folder after build
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    writeBundle() {
      const distDir = 'dist';
      
      // Ensure dist directory exists
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }

      // Copy .htaccess file to dist root
      const htaccessSrc = '.htaccess';
      const htaccessDest = join(distDir, '.htaccess');
      
      if (existsSync(htaccessSrc)) {
        try {
          copyFileSync(htaccessSrc, htaccessDest);
          console.log('✅ Copied .htaccess to dist/');
        } catch (error) {
          console.warn('⚠️ Failed to copy .htaccess:', error);
        }
      } else {
        console.warn('⚠️ .htaccess file not found');
      }

      // Copy PNG files from assets to dist root
      const assetFiles = ['logo.png', 'docs-logo.png'];
      assetFiles.forEach(file => {
        const srcPath = join('assets', file);
        const destPath = join(distDir, file);
        
        if (existsSync(srcPath)) {
          try {
            copyFileSync(srcPath, destPath);
            console.log(`✅ Copied ${file} to dist/`);
          } catch (error) {
            console.warn(`⚠️ Failed to copy ${file}:`, error);
          }
        } else {
          console.warn(`⚠️ Asset file not found: ${srcPath}`);
        }
      });

      // Copy srv folder to dist
      const srvSrcPath = 'srv';
      const srvDestPath = join(distDir, 'srv');
      
      if (existsSync(srvSrcPath)) {
        try {
          cpSync(srvSrcPath, srvDestPath, { 
            recursive: true,
            force: true 
          });
          console.log('✅ Copied srv folder to dist/srv/');
        } catch (error) {
          console.warn('⚠️ Failed to copy srv folder:', error);
        }
      } else {
        console.warn('⚠️ srv folder not found');
      }

      console.log('✅ Build assets copy completed');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/srv': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/srv/, '/srv')
      }
    }
  },
  build: {
    // Copy srv folder to dist
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  // Add publicDir to copy srv folder
  publicDir: false, // Disable default public dir copying
});
