import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'svg'
        }
      }
    })
  ],
  server: {
    port: 1220,
    open: true,
    host: true,
    proxy: {
      '^/api/.*': {  // 使用正则匹配所有以 /api 开头的请求
        target: 'https://api.pixpro.cc',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
    },
  },
  css: {
    modules: {
      scopeBehaviour: 'local',
    }
  }
});