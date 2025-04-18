import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // 你的入口
      name: 'PixProReact',                             // UMD 模式下的全局变量名，可随便填
      fileName: (format) => `index.${format}.js`,      // 控制输出的文件名
      formats: ['es', 'cjs'],                           // 输出两种格式，供主流工具使用
    },
    rollupOptions: {
      // 这些依赖在使用时由外部项目提供，不要打包进去
      external: ['react', 'react-dom'],
    },
    outDir: 'dist',      // 输出目录
    emptyOutDir: true,   // 每次构建前清空
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    })
  ],
  assetsInclude: ['**/*.svg'],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    port: 1220,
    open: true,
    host: true,
    proxy: {
      '^/api/.*': {
        target: 'https://pixpro.brandsh.cn',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  }
});