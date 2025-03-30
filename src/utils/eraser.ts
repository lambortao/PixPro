import type { IErasePoint, IErasePoints, IEraserSize } from '@/types/IType';

export default class Eraser {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private defaultColor: string = 'rgba(24, 74, 255, 0.3)'
  private isDrawing: boolean = false;
  private eraserSize: IEraserSize = {
    min: 2,
    max: 100,
    default: 20
  };
  private lastX: number = 0;
  private lastY: number = 0;
  // 使用二维数组存储点位信息，每个子数组代表一次绘制
  private points: IErasePoints = [];
  // 当前绘制的轨迹
  private currentPath: Array<IErasePoint> = [];
  // 添加回调函数属性
  private onDrawEnd?: (points: IErasePoints) => void;

  private boundStartDrawing: (event: MouseEvent) => void;
  private boundDraw: (event: MouseEvent) => void;
  private boundStopDrawing: (event: MouseEvent) => void;
  private boundWheel: (event: WheelEvent) => void;
  private onEraserSizeChange?: (size: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    styleWidth: string,
    styleHeight: string,
    initPoints?: Array<Array<{x: number, y: number, size: number, color: string}>>,
    onDrawEnd?: (points: Array<Array<{x: number, y: number, size: number, color: string}>>) => void,
    dominantColorCanvas?: HTMLCanvasElement,
    eraserSize?: IEraserSize,
    onEraserSizeChange?: (size: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    if (eraserSize) {
      this.eraserSize = { ...eraserSize }
      if (onEraserSizeChange) {
        this.onEraserSizeChange = onEraserSizeChange;
      }
    }
    this.onDrawEnd = onDrawEnd;

    // 如果提供了dominantColorCanvas，先执行取色逻辑
    if (dominantColorCanvas) {
      this.updateDefaultColorByDominantColor(dominantColorCanvas);
    }
  
    this.updateCursor();

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = styleWidth;
    this.canvas.style.height = styleHeight;

    // 设置混合模式为 source-over
    this.ctx.globalCompositeOperation = 'source-over';

    this.boundStartDrawing = this.startDrawing.bind(this);
    this.boundDraw = this.draw.bind(this);
    this.boundStopDrawing = this.stopDrawing.bind(this);
    this.boundWheel = this.handleWheel.bind(this);
    
    this.setupEventListeners();
    this.clearCanvas();
    if (initPoints) {
      this.redraw(initPoints);
    }
  }

  /** 更新光标的大小 */
  private updateCursor(): void {
    const svgCursor = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${this.eraserSize.default}" 
           height="${this.eraserSize.default}" 
           viewBox="0 0 ${this.eraserSize.default} ${this.eraserSize.default}">
        <circle 
          cx="${this.eraserSize.default/2}" 
          cy="${this.eraserSize.default/2}" 
          r="${this.eraserSize.default/2}" 
          fill="${this.defaultColor}"
        />
      </svg>`;

    const encodedCursor = encodeURIComponent(svgCursor);
    this.canvas.style.cursor = `url('data:image/svg+xml;utf8,${encodedCursor}') ${this.eraserSize.default/2} ${this.eraserSize.default/2}, auto`;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.boundStartDrawing);
    this.canvas.addEventListener('mousemove', this.boundDraw);
    this.canvas.addEventListener('mouseup', this.boundStopDrawing);
    this.canvas.addEventListener('mouseleave', this.boundStopDrawing);
    this.canvas.addEventListener('wheel', this.boundWheel);
  }

  /** 移除监听 */
  public removeEventListeners(): void {
    this.canvas.removeEventListener('mousedown', this.boundStartDrawing);
    this.canvas.removeEventListener('mousemove', this.boundDraw);
    this.canvas.removeEventListener('mouseup', this.boundStopDrawing);
    this.canvas.removeEventListener('mouseleave', this.boundStopDrawing);
    this.canvas.removeEventListener('wheel', this.boundWheel);
  }

  private startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    const { x, y } = this.getMousePosition(event);
    this.lastX = x;
    this.lastY = y;
    // 开始新的轨迹
    this.currentPath = [{
      x: this.lastX,
      y: this.lastY,
      size: this.eraserSize.default,
      color: this.defaultColor
    }];
  }

  private draw(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const { x, y } = this.getMousePosition(event);
    
    // 添加点到当前轨迹
    this.currentPath.push({
      x,
      y,
      size: this.eraserSize.default,
      color: this.defaultColor
    });

    // 绘制路径
    this.drawPath([{
      x: this.lastX,
      y: this.lastY,
      size: this.eraserSize.default,
      color: this.defaultColor
    }, {
      x,
      y,
      size: this.eraserSize.default,
      color: this.defaultColor
    }]);

    this.lastX = x;
    this.lastY = y;
  }

  /** 根据点位信息绘制路径 */
  private drawPath(points: Array<{x: number, y: number, size: number, color: string}>): void {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    this.ctx.lineTo(points[1].x, points[1].y);
    this.ctx.lineWidth = points[0].size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = points[0].color;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  private stopDrawing(): void {
    if (this.isDrawing) {
      // 将当前轨迹添加到点位数组中
      if (this.currentPath.length > 0) {
        this.points.push([...this.currentPath]);
      }
      // 如果存在回调函数，则调用并传递点位信息
      if (this.onDrawEnd) {
        this.onDrawEnd([...this.points]);
      }
      this.currentPath = [];
    }
    this.isDrawing = false;
  }

  private getMousePosition(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  public setEraserSize(size: string | number): void {
    this.eraserSize.default = parseInt(size as string);
    /** 更新光标大小 */
    this.updateCursor();
    if (this.onEraserSizeChange) {
      this.onEraserSizeChange(this.eraserSize.default);
    }
  }

  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // 清空点位记录
    this.points = [];
    this.currentPath = [];
  }

  /** 清除画布并取消监听 */
  public clearEraser(): void {
    this.clearCanvas();
    this.stopDrawing();
    this.removeEventListeners();
    this.canvas.style.cursor = 'default';
  }

  /** 获取所有点位信息 */
  public getPoints(): Array<Array<{x: number, y: number, size: number, color: string}>> {
    return this.points;
  }

  /** 根据点位信息重绘 */
  public redraw(points: Array<Array<{x: number, y: number, size: number, color: string}>>): void {
    this.clearCanvas();
    
    // 遍历每条轨迹
    points.forEach(path => {
      // 绘制轨迹中的点
      for (let i = 0; i < path.length - 1; i++) {
        this.drawPath([path[i], path[i + 1]]);
      }
    });
  }

  /** 将 RGB 颜色转换为 HEX 格式 */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /** 将 HEX 颜色转换为 RGB 格式 */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /** 获取颜色的反色 */
  private getInverseColor(color: string): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return this.defaultColor;

    // 计算亮度
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    if (brightness < 128) {
      // 暗色返回亮色
      return '#FFFFFF';
    } else {
      // 亮色返回暗色
      return '#000000';
    }
  }

  /** 更新默认颜色基于主色的反色 */
  public updateDefaultColorByDominantColor(targetCanvas?: HTMLCanvasElement): void {
    if (!targetCanvas) return;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    const data = imageData.data;
    const colorCount: { [key: string]: number } = {};

    // 统计颜色出现次数
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // 跳过完全透明的像素
      if (a === 0) continue;

      const hex = this.rgbToHex(r, g, b);
      colorCount[hex] = (colorCount[hex] || 0) + 1;
    }

    // 找出出现次数最多的颜色
    let maxCount = 0;
    let dominantColor = '';
    for (const color in colorCount) {
      if (colorCount[color] > maxCount) {
        maxCount = colorCount[color];
        dominantColor = color;
      }
    }

    // 如果找到主色，则设置其反色为默认颜色
    if (dominantColor) {
      const inverseColor = this.getInverseColor(dominantColor);
      this.defaultColor = `${inverseColor}80`; // 80 相当于 0.5 的透明度
      this.updateCursor();
    }
  }

  /** 处理滚轮事件 */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY;
    // 根据滚轮方向调整橡皮擦大小
    const sizeChange = delta > 0 ? -2 : 2;
    const newSize = Math.max(this.eraserSize.min, Math.min(this.eraserSize.max, this.eraserSize.default + sizeChange));

    if (newSize !== this.eraserSize.default && newSize >= this.eraserSize.min && newSize <= this.eraserSize.max) {
      this.setEraserSize(newSize);
    }
  }
}
