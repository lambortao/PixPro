/** 图片压缩方法合集 */

import Compressor from 'compressorjs';
import {
  CANVAS_RENDER_MAX_WIDTH,
  CANVAS_RENDER_MAX_HEIGHT,
  CANVAS_RENDER_MIN_HEIGHT,
  CANVAS_RENDER_MIN_WIDTH,
  MAX_UPLOAD_IMAGE_SIZE
} from '@/config/constants';
import type { ICompressResult } from '@/types/IType';

type ImageSource = File | string;

interface CompressOptions {
  maxSizeMB: number;    // 最大文件大小（MB）
  maxWidth?: number;    // 最大宽度
  maxHeight?: number;   // 最大高度
  minQuality?: number;  // 最小压缩质量，防止过度压缩
}

/**
 * 将Base64转换为File对象
 * @param base64 - base64字符串
 * @param filename - 文件名
 * @returns File对象
 */
function base64ToFile(base64: string, filename: string = 'image.jpg'): File {
  // 如果是完整的data URL，提取实际的base64内容
  const base64Content = base64.split(',')[1] || base64;
  
  // 从data URL中提取MIME类型，如果没有则默认为jpeg
  const mimeMatch = base64.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  
  // 解码base64
  const binaryStr = atob(base64Content);
  const len = binaryStr.length;
  const arr = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    arr[i] = binaryStr.charCodeAt(i);
  }
  
  return new File([arr], filename, { type: mimeType });
}

/**
 * 将URL转换为File对象
 * @param url - 图片URL
 * @returns Promise<File> - File对象
 */
async function urlToFile(url: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], 'image.jpg', { type: blob.type });
}

/**
 * 计算最佳压缩质量
 * @param file - 源文件
 * @param targetSize - 目标大小（bytes）
 * @param minQuality - 最小压缩质量
 * @returns Promise<number> - 计算出的压缩质量
 */
async function calculateOptimalQuality(
  file: File,
  targetSize: number,
  minQuality: number = 0.1
): Promise<number> {
  let low = minQuality;
  let high = 1;
  let closestQuality = high;
  let closestSize = Infinity;
  const maxIterations = 6; // 二分查找的最大迭代次数
  
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    
    const compressedFile = await new Promise<File>((resolve, reject) => {
      new Compressor(file, {
        quality: mid,
        success: (result) => resolve(result as File),
        error: (err) => reject(err),
      });
    });
    
    const compressedSize = compressedFile.size;
    
    if (Math.abs(compressedSize - targetSize) < Math.abs(closestSize - targetSize)) {
      closestQuality = mid;
      closestSize = compressedSize;
    }
    
    if (compressedSize > targetSize) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return closestQuality;
}

/**
 * 获取图片尺寸
 * @param file - 图片文件
 * @returns Promise<{width: number, height: number}>
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error('获取图片尺寸失败'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 检查图片是否需要压缩（基于尺寸或文件大小）
 * @param file - 图片文件
 * @param dimensions - 图片尺寸
 * @param options - 压缩选项
 * @returns boolean
 */
function needsCompression(
  file: File,
  dimensions: { width: number; height: number },
  options: CompressOptions
): boolean {
  const maxWidth = options.maxWidth || CANVAS_RENDER_MAX_WIDTH;
  const maxHeight = options.maxHeight || CANVAS_RENDER_MAX_HEIGHT;
  const targetSize = options.maxSizeMB * 1024 * 1024;

  return (
    file.size > targetSize ||
    dimensions.width > maxWidth ||
    dimensions.height > maxHeight
  );
}


/**
 * 压缩图片
 * @param imageFile - 图片文件
 * @param options - 压缩选项
 * @returns Promise<{file: File, width: number, height: number}> - 压缩后的文件及尺寸
 */
async function compressImage(
  imageFile: File,
  options: CompressOptions
): Promise<{
  file: File;
  width: number;
  height: number;
}> {
  const targetSize = options.maxSizeMB * 1024 * 1024;
  const minQuality = options.minQuality || 0.1;
  const maxWidth = options.maxWidth || CANVAS_RENDER_MAX_WIDTH;
  const maxHeight = options.maxHeight || CANVAS_RENDER_MAX_HEIGHT;
  const minWidth = CANVAS_RENDER_MIN_WIDTH;
  const minHeight = CANVAS_RENDER_MIN_HEIGHT;

  // 获取原始图片尺寸
  const dimensions = await getImageDimensions(imageFile);

  // 检查是否需要压缩（基于尺寸或文件大小）
  if (!needsCompression(imageFile, dimensions, options)) {
    return {
      file: imageFile,
      width: dimensions.width,
      height: dimensions.height
    };
  }

  // 确定压缩质量
  const quality = imageFile.size > targetSize
    ? await calculateOptimalQuality(imageFile, targetSize, minQuality)
    : 1; // 如果只需要调整尺寸，则使用最高质量

  return new Promise((resolve, reject) => {
    new Compressor(imageFile, {
      quality,
      maxWidth,
      maxHeight,
      minWidth,
      minHeight,
      /** 避免压缩后图片容量更大的情况出现 */
      strict: false,
      success(result) {
        // 获取压缩后的实际尺寸
        getImageDimensions(result as File)
          .then(({ width, height }) => {
            resolve({
              file: result as File,
              width,
              height
            });
          })
          .catch(err => reject(new Error(`获取压缩后图片尺寸失败: ${err.message}`)));
      },
      error(err) {
        reject(new Error(`图片压缩失败: ${err.message}`));
      },
    });
  });
}

/**
 * 验证字符串是否为有效的URL
 * @param str - 要验证的字符串
 * @returns boolean
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证字符串是否为有效的Base64
 * @param str - 要验证的字符串
 * @returns boolean
 */
function isValidBase64(str: string): boolean {
  if (str.startsWith('data:image/')) {
    return true;
  }
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * 将File对象转换为Base64
 * @param file - File对象
 * @returns Promise<string> - base64字符串
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 加载并处理图片源
 * @param source - 图片文件、URL或Base64字符串
 * @param options - 压缩选项
 * @returns Promise<string> - 处理后的Base64字符串
 */
export async function loadImageSource(
  source: ImageSource,
  options: CompressOptions = { maxSizeMB: MAX_UPLOAD_IMAGE_SIZE, minQuality: 0.1 }
): Promise<ICompressResult> {
  try {
    // 统一转换为File对象
    let imageFile: File;
    
    if (source instanceof File) {
      imageFile = source;
    } else if (typeof source === 'string') {
      if (isValidUrl(source)) {
        imageFile = await urlToFile(source);
      } else if (isValidBase64(source)) {
        imageFile = base64ToFile(source);
      } else {
        throw new Error('无效的图片源，请提供File对象、有效的URL或base64字符串');
      }
    } else {
      throw new Error('无效的图片源类型');
    }
    
    /** 入口压缩 */
    const compressedFile = await compressImage(imageFile, options);
    
    /** 转换为base64并返回 */
    const base64 = await fileToBase64(compressedFile.file);
    return {
      base64,
      width: compressedFile.width,
      height: compressedFile.height
    };
    
  } catch (error: any) {
    throw new Error(`图片处理失败: ${error.message}`);
  }
}
