<h1 align="center">PixPro 图片处理基础库</h1>

## 丨简介

PixPro 是一个图片处理基础库，提供了图片处理的基础功能，如裁剪、等比例缩放、翻转、镜像、旋转等功能。同时，PixPro 还提供了图片处理的 AI 高级功能，如 AI 扩图、AI 擦除、AI 去背景、AI 提升解析度等功能。

### 多平台兼容

PixPro 底层功能基于 TypeScript 进行开发，并提供 Vue3 以及 React18 的版本的 UI 套件，你可以在 example 目录下找到相对应的 UI 套件。

## 丨演示

点击链接注册并获取免费试用次数后即可进行在线操作：[PixPro 官网](https://pixpro.cc/)

## 丨功能

### 基础功能

PixPro 提供以下基础图像处理功能：

1. **裁剪（Crop）** - 支持多种裁剪比例，包括原始比例、1:1、4:3、16:9、9:16
2. **旋转（Rotate）** - 自由调整图像角度，支持指定角度旋转
3. **翻转（Flip）** - 支持水平和垂直翻转图像
4. **镜像（Mirror）** - 支持图像镜像处理
5. **缩放（Resize）** - 等比例缩放图像，保持原始比例

### AI 高级功能

PixPro 还提供以下 AI 驱动的高级图像处理功能：

1. **AI 扩图** - 向外扩展图片，AI 自动填充图片以外的部分
2. **AI 擦除** - 选取想要从图片中移除的物件，AI 自动修复
3. **AI 去背景** - 一键抠出图片中的主体，可选择透明或自定义背景色
4. **AI 提升解析度** - 提高图像清晰度，最大可提升至 3200 x 3200
5. **压缩容量** - 在保证图片质量的基础上，有效降低图片的容量

## 丨快速开始

### 基础使用

```typescript
import PixPro from './pixpro';

/** 初始化 PixPro 实例 */
const pixpro = new PixPro(document.getElementById('container'), {
  token: 'your-api-token',
  merchantId: 'your-merchant-id',
  host: 'https://api.your-service.com',
  routes: '/api',
  action: {
    extend: '/extend',
    erase: '/erase',
    removeBg: '/remove-background',
    hd: '/enhance-resolution'
  },
  onExportImage: (image) => {
    console.log('导出的图片地址：', image);
  },
  onUpload: () => {
    console.log('图片已上传');
  }
});
```

## 丨API 参考

### 主要方法

| 方法 | 描述 | 参数 |
| --- | --- | --- |
| `new PixPro(element, options)` | 初始化 PixPro 实例 | `element`: DOM元素, `options`: 配置选项 |
| `rollback()` | 回退到上一步 | - |
| `forward()` | 前进到下一步 | - |
| `reset()` | 恢复到初始状态 | - |
| `status()` | 获取当前状态 | - |
| `flip(direction)` | 水平或垂直翻转 | `direction`: 'x' 或 'y' |
| `cropRatio(options)` | 设置裁剪比例 | `options`: {ratio: number \| null, label: string} |
| `rotate(angle)` | 旋转图像 | `angle`: 旋转角度(度) |
| `exportImage()` | 导出图像 | - |
| `expandImageBtn()` | AI 扩图 | - |
| `eraseImage()` | AI 擦除 | - |
| `setEraserSize(size)` | 设置橡皮擦大小 | `size`: 橡皮擦尺寸 |
| `removeBg()` | AI 去背景 | - |
| `hd()` | AI 提升解析度 | - |
| `setRemoveBgColor(color)` | 设置去背景后的背景颜色 | `color`: 颜色值 |
| `resetAll()` | 重置所有操作 | - |

### 初始化选项

| 选项 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| `token` | string | 是 | 请求 token |
| `merchantId` | string | 是 | 请求 merchantId |
| `host` | string | 是 | 请求 host |
| `routes` | string | 是 | 请求 routes |
| `action` | object | 是 | 请求 action 对象 |
| `action.extend` | string | 是 | 扩图接口路径 |
| `action.erase` | string | 是 | 擦除接口路径 |
| `action.removeBg` | string | 是 | 去背景接口路径 |
| `action.hd` | string | 是 | 提升解析度接口路径 |
| `onStepChange` | function | 否 | 步骤变化回调 |
| `onExportImage` | function | 否 | 导出图片回调 |
| `onFinish` | function | 否 | 结束回调 |
| `onUpload` | function | 否 | 上传回调 |
| `realTimeChange` | function | 否 | 实时变化回调 |
| `isDev` | boolean | 否 | 是否是开发模式 |

```typescript
// onStepChange 回调函数类型
type OnStepChangeCallback = ({ 
  stepList, 
  currentStepIndex 
}: { 
  stepList: IDrawCanvasInfo[], 
  currentStepIndex: number 
}) => void;

// onExportImage 回调函数类型
type OnExportImageCallback = (image: string) => void;

// 完整配置示例
const options = {
  token: 'your-api-token',
  merchantId: 'your-merchant-id',
  host: 'https://api.your-service.com',
  routes: '/api',
  action: {
    extend: '/extend',
    erase: '/erase',
    removeBg: '/remove-background',
    hd: '/enhance-resolution'
  },
  onExportImage: (image) => {
    console.log('导出的图片地址：', image);
  },
  onUpload: () => {
    console.log('图片已上传');
  }
};
```

## 丨文档

### Vue3 版本

使用 Vue3 版本的 PixPro UI 套件可以快速构建图片处理应用。

```vue
<template>
  <div class="app-container">
    <PixProSkin
      :token="token"
      :merchant-id="merchantId"
      :api-host="apiHost"
      :api-routes="apiRoutes"
      :api-action="apiAction"
      @export-image="handleExportImage"
      @upload="handleUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PixProSkin from './PixProSkin/index.vue';

const token = ref('your-api-token');
const merchantId = ref('your-merchant-id');
const apiHost = ref('https://api.your-service.com');
const apiRoutes = ref('/api');
const apiAction = ref({
  extend: '/extend',
  erase: '/erase',
  removeBg: '/remove-background',
  hd: '/enhance-resolution'
});

const handleExportImage = (image: string) => {
  console.log('导出的图片地址：', image);
};

const handleUpload = () => {
  console.log('图片已上传');
};
</script>
```

### React18 版本

使用 React18 版本的 PixPro UI 套件可以快速构建图片处理应用。

```tsx
import React from 'react';
import PixProSkin from './PixProSkin';

const App: React.FC = () => {
  const token = 'your-api-token';
  const merchantId = 'your-merchant-id';
  const apiHost = 'https://api.your-service.com';
  const apiRoutes = '/api';
  const apiAction = {
    extend: '/extend',
    erase: '/erase',
    removeBg: '/remove-background',
    hd: '/enhance-resolution'
  };

  const handleExportImage = (image: string) => {
    console.log('导出的图片地址：', image);
  };

  const handleUpload = () => {
    console.log('图片已上传');
  };

  return (
    <div className="app-container">
      <PixProSkin
        token={token}
        merchantId={merchantId}
        apiHost={apiHost}
        apiRoutes={apiRoutes}
        apiAction={apiAction}
        onExportImage={handleExportImage}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default App;
```

## 丨开发

```bash
# 启动 Vue 示例
yarn vue

# 启动 React 示例
yarn react
```

## 丨许可证

MIT