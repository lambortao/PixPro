import { App } from 'vue';
import { PixProVue } from './index';

// 导入样式
import './styles/index.less';

// 创建Vue插件
export default {
  install: (app: App) => {
    // 全局注册组件
    app.component('PixProVue', PixProVue);
  }
}; 