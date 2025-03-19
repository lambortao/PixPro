import type { IDrawCanvasInfo, ICompressResult } from '../types/IType';

import { SILENT_IMAGE_QUALITY } from '../config/constants';

/**
 * 导出图片函数 - 处理图片的裁剪、旋转、翻转等变换并导出为 base64 格式
 * 
 * 改进的变换策略：
 * 1. 考虑翻转(turn)对坐标系的影响，相应调整镜像(flipX/flipY)的应用方式
 * 2. 先应用90度旋转(turn)
 * 3. 根据旋转后的坐标系应用正确的镜像效果
 * 4. 裁剪变换后的图像
 * 5. 应用自由旋转(rotate)和缩放(scale)
 * 6. 导出为base64格式
 * 
 * @param {boolean} hasBgColor - 是否需要添加背景色
 * @param {IDrawCanvasInfo} step - 当前编辑步骤的参数
 * @param {ICompressResult} image - 图片数据
 * @returns {Promise<string>} 返回处理后图片的 base64 字符串
 */
export default (hasBgColor: boolean = false, step: IDrawCanvasInfo, image: ICompressResult) => {
  /** 获取当前步骤的所有参数 */
  const {
    rotate = 0,           // 自由旋转角度
    flipX = 1,            // 水平翻转系数(1:不翻转, -1:翻转)
    flipY = 1,            // 垂直翻转系数(1:不翻转, -1:翻转)
    cropBoxWidth,         // 裁剪框宽度
    cropBoxHeight,        // 裁剪框高度
    currentDomWidth,      // 当前DOM显示宽度
    currentDomHeight,     // 当前DOM显示高度
    xDomOffset = 0,       // X轴偏移量
    yDomOffset = 0,       // Y轴偏移量
    scale = 1,            // 缩放比例
    turn = 0,             // 90度整数倍旋转次数(0-3)
    rawImgWidth,          // 原始图片宽度
    rawImgHeight,         // 原始图片高度
    bgColor               // 背景颜色
  } = { ...step };

  if (!image.base64) {
    throw new Error('图片数据丢失');
  }

  /** 确定图片格式(png或jpeg) */
  const imageType = image.base64.includes('data:image/png;base64,') ? 'png' : 'jpeg';
  
  // 创建临时图片对象用于加载原始图像
  const tempImage = new Image();
  
  return new Promise<string>((resolve, reject) => {
    tempImage.onload = () => {
      try {
        // 创建一个工作画布，用于应用所有变换
        const workCanvas = document.createElement('canvas');
        const workCtx = workCanvas.getContext('2d');
        
        if (!workCtx) {
          throw new Error('无法获取画布上下文');
        }
        
        // 设置初始画布尺寸为原始图像尺寸
        workCanvas.width = rawImgWidth;
        workCanvas.height = rawImgHeight;
        
        // 绘制原始图像
        workCtx.drawImage(tempImage, 0, 0, rawImgWidth, rawImgHeight);
        
        // 计算需要的画布尺寸
        // 如果有90度或270度旋转，宽高需要互换
        let finalWidth = rawImgWidth;
        let finalHeight = rawImgHeight;
        
        if (turn % 2 === 1) { // 90°或270°
          finalWidth = rawImgHeight;
          finalHeight = rawImgWidth;
        }
        
        // 创建变换画布
        const transformedCanvas = document.createElement('canvas');
        transformedCanvas.width = finalWidth;
        transformedCanvas.height = finalHeight;
        const transformedCtx = transformedCanvas.getContext('2d');
        
        if (!transformedCtx) {
          throw new Error('无法获取变换画布上下文');
        }
        
        // 关键改进: 根据旋转角度调整镜像应用方式
        transformedCtx.save();
        transformedCtx.translate(transformedCanvas.width / 2, transformedCanvas.height / 2);
        
        // 先应用旋转
        if (turn !== 0) {
          transformedCtx.rotate((turn * 90 * Math.PI) / 180);
        }
        
        // 根据旋转角度调整镜像的应用
        let adjustedFlipX = flipX;
        let adjustedFlipY = flipY;
        
        // 关键逻辑: 根据旋转角度调整镜像方向
        if (turn === 1) { // 90度
          // 交换X和Y，Y变为-X
          adjustedFlipX = flipY;
          adjustedFlipY = flipX;
        } else if (turn === 2) { // 180度
          // X和Y都反向
          adjustedFlipX = flipX;
          adjustedFlipY = flipY;
        } else if (turn === 3) { // 270度
          // 交换X和Y，X变为-Y
          adjustedFlipX = flipY;
          adjustedFlipY = flipX;
        }
        
        // 应用调整后的镜像
        transformedCtx.scale(adjustedFlipX, adjustedFlipY);
        
        // 绘制原始图像
        transformedCtx.drawImage(
          workCanvas,
          -workCanvas.width / 2,
          -workCanvas.height / 2,
          workCanvas.width,
          workCanvas.height
        );
        
        transformedCtx.restore();
        
        // 计算裁剪区域
        // 计算缩放比例
        const scaleRatioX = finalWidth / currentDomWidth;
        const scaleRatioY = finalHeight / currentDomHeight;
        
        // 计算裁剪区域的尺寸
        const cropW = cropBoxWidth * scaleRatioX;
        const cropH = cropBoxHeight * scaleRatioY;
        
        // 计算裁剪区域的位置
        // 处理xDomOffset和yDomOffset
        const cropX = Math.abs(xDomOffset) * scaleRatioX;
        const cropY = Math.abs(yDomOffset) * scaleRatioY;
        
        // 确保裁剪区域在画布范围内
        const safeX = Math.max(0, Math.min(cropX, transformedCanvas.width - 1));
        const safeY = Math.max(0, Math.min(cropY, transformedCanvas.height - 1));
        const safeW = Math.min(cropW, transformedCanvas.width - safeX);
        const safeH = Math.min(cropH, transformedCanvas.height - safeY);
        
        // 创建裁剪后的画布
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = safeW;
        croppedCanvas.height = safeH;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        if (!croppedCtx) {
          throw new Error('无法获取裁剪画布上下文');
        }
        
        // 从变换后的画布上裁剪指定区域
        croppedCtx.drawImage(
          transformedCanvas,
          safeX,
          safeY,
          safeW,
          safeH,
          0,
          0,
          safeW,
          safeH
        );
        
        // 创建最终输出画布
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = safeW;
        outputCanvas.height = safeH;
        const outputCtx = outputCanvas.getContext('2d');
        
        if (!outputCtx) {
          throw new Error('无法获取输出画布上下文');
        }
        
        // 如果需要背景色，先填充背景
        if (hasBgColor && bgColor) {
          outputCtx.fillStyle = bgColor;
          outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        }
        
        // 处理自由旋转和缩放
        if (rotate !== 0 || scale !== 1) {
          outputCtx.save();
          outputCtx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
          
          // 应用自由旋转
          if (rotate !== 0) {
            outputCtx.rotate((rotate * Math.PI) / 180);
          }
          
          // 应用缩放
          if (scale !== 1) {
            outputCtx.scale(scale, scale);
          }
          
          // 绘制裁剪后的图像
          outputCtx.drawImage(
            croppedCanvas,
            -croppedCanvas.width / 2,
            -croppedCanvas.height / 2,
            croppedCanvas.width,
            croppedCanvas.height
          );
          
          outputCtx.restore();
        } else {
          // 如果没有旋转和缩放，直接绘制裁剪后的图像
          outputCtx.drawImage(croppedCanvas, 0, 0);
        }
        
        // 导出为base64格式
        const base64 = outputCanvas.toDataURL(`image/${imageType}`, SILENT_IMAGE_QUALITY);
        resolve(base64);
      } catch (error) {
        console.error('导出图片失败:', error);
        reject(error);
      }
    };
    
    // 图片加载失败处理
    tempImage.onerror = () => {
      reject(new Error('加载图片失败'));
    };
    
    // 开始加载图片
    tempImage.src = image.base64;
  });
}
