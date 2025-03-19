# PixPro AI图片处理库（AI Image Processing Library）

PixPro 是一个图片处理工具，提供了图片处理的基础功能，如常用的裁剪、等比例缩放、翻转、镜像、旋转等功能。同时，PixPro 还嵌入了各类第三方的AI图像处理能力，例如AI 扩图、AI擦除、AI去背景、AI提升解析度（更多陆续更新..）

您可以在任意网页端快速嵌入该工具【任意图片上传框、表单、后台等等】，即可实现无缝AI图像处理体验。

详见 [Github 文档](https://github.com/lambortao/PixPro)。

## 安装

```bash
npm install @pixpro/core
```

## 基本使用

```typescript
import PixPro from '@pixpro/core';

const pixpro = new PixPro(document.getElementById('container'), {
  token: 'your-api-token',
  host: 'https://api.your-service.com',
  routes: '/api',
  action: {
    extend: '/extend',
    erase: '/erase',
    removeBg: '/remove-background',
    hd: '/enhance-resolution'
  }
});
```