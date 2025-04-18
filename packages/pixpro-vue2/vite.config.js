import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'svg',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
    },
  },
  css: {
    modules: {
      scopeBehaviour: 'local',
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),  // 👈 你的组件入口文件
      name: 'PixProVue2',                         // UMD 打包时的全局变量名，可随便写
      fileName: (format) => `index.${format}.js`, // 输出的文件名规则
      formats: ['es', 'umd'],                     // 输出 ESModule + UMD
    },
    rollupOptions: {
      external: ['vue'], // 👈 vue 不打进去，作为 peer 依赖
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});