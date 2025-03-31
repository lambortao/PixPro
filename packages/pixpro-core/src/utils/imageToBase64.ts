import type { IDrawCanvasInfo } from '@/types/IType';

/**
 * 图片转换 base64
 * @param canvas 画布
 * @param originalImage 原始图片
 * @param nowStep 当前步骤
 */
export default (
  canvas: HTMLCanvasElement,
  originalImage: HTMLImageElement,
  nowStep: IDrawCanvasInfo
) => {
  if (!canvas || !originalImage) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  if (!nowStep) {
    console.error('当前步骤不存在!');
    return;
  }
  let {
    /** 源文件图片绘制 x 轴起点 */
    sx,
    /** 源文件图片绘制 y 轴起点 */
    sy,
    /** 源文件图片目标绘制宽度 */
    sWidth,
    /** 源文件图片目标绘制高度 */
    sHeight,
    /** 目标 canvas 绘制 x 轴起点 */
    dx,
    /** 目标 canvas 绘制 y 轴起点 */
    dy,
    /** 目标 canvas 绘制宽度 */
    dWidth,
    /** 目标 canvas 绘制高度 */
    dHeight,
    /** 目标 canvas 显示宽度 */
    domWidth,
    /** 目标 canvas 显示高度 */
    domHeight,
    /** 旋转角度 */
    rotate,
    /** 旋转 x 轴 */
    rotateX,
    /** 旋转 y 轴 */
    rotateY,
    /** 缩放 */
    scale,
    /** 缩放 x 轴 */
    scaleX,
    /** 缩放 y 轴 */
    scaleY,
    /** 方向 */
    direction,
    /** 翻转 */
    flip
  } = nowStep;

  /** 补充默认值 */
  direction = direction ?? 'vertical';
  scale = scale ?? 1;
  rotate = rotate ?? 0;

  /** 1. 设置 canvas 的尺寸 */
  canvas.width = dWidth;
  canvas.height = dHeight;

  /** 2. 设置显示尺寸 */
  canvas.style.width = `${domWidth}px`;
  canvas.style.height = `${domHeight}px`;

  /** 3. 保存当前上下文状态 */
  ctx.save();

  /** 4. 移动到画布中心点 */
  ctx.translate(dWidth / 2, dHeight / 2);

  /** 5. 应用旋转 */
  if (rotate) {
    // 如果设置了旋转中心点，则移动到指定的旋转中心点
    const centerX = rotateX ?? 0;
    const centerY = rotateY ?? 0;
    if (rotateX !== undefined || rotateY !== undefined) {
      ctx.translate(centerX - dWidth / 2, centerY - dHeight / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-(centerX - dWidth / 2), -(centerY - dHeight / 2));
    } else {
      // 如果没有设置任何旋转中心点，则使用画布中心点作为旋转中心
      ctx.rotate((rotate * Math.PI) / 180);
    }
  }

  /** 6. 应用缩放 */
  if (scale && scaleX && scaleY) {
    ctx.scale(scale * scaleX, scale * scaleY);
  }

  /** 7. 应用镜像翻转 */
  if (flip === 'x') {
    // 水平镜像：沿 Y 轴翻转
    ctx.scale(-1, 1);
  } else if (flip === 'y') {
    // 垂直镜像：沿 X 轴翻转
    ctx.scale(1, -1);
  }

  /** 8. 移动回原点 */
  ctx.translate(-dWidth / 2, -dHeight / 2);

  /** 9. 绘制图片 */
  ctx.drawImage(
    originalImage,
    sx,
    sy,
    sWidth,
    sHeight,
    dx,
    dy,
    dWidth,
    dHeight
  );

  /** 10. 恢复上下文状态 */
  ctx.restore();

  /** 返回 base64 图片 */
  const base64 = canvas!.toDataURL('image/png').split(',')[1];
  return `data:image/png;base64,${base64}`;
}