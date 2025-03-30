import { App } from 'vue';
import PixProVue from './PixProVue.vue';

// 导入样式
import './PixProSkin/assets/style/index.less';

// 创建Vue插件
export default {
  install: (app: App) => {
    // 全局注册组件
    app.component('PixProVue', PixProVue);
  }
}; 