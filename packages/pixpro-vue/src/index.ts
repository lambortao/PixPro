import PixProVue from './PixProVue.vue';
import { type ICropRatio, type IDrawCanvasInfo, type IImageMode } from '@pixpro/core';
import PixProVuePlugin from './plugin';
import './styles/index.less';

// 导出组件
export { PixProVue, ICropRatio, IDrawCanvasInfo, IImageMode };

// 导出默认插件
export default PixProVuePlugin;
