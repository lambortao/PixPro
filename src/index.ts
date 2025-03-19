/** 入口文件 */
import styles from '@/assets/style.css?inline';
import AppTemplate from '@/templates/App';
import { scopeStyles, scopeTemplate, generateScopeId } from '@/utils/utils';
import type { IDomSize, ICropRatio, IDrawCanvasInfo, IImageMode } from '@/types/IType';
import events from '@/utils/event';
import { addClass, removeClass, setStyle, delay } from '@/utils/utils';
import DragHandler from '@/utils/dragHandle';
import httpClient from './utils/CustomFetch';

/** 超级像素 */
class PixPro {
  private static instance: PixPro;
  private container: HTMLElement;
  private fileInput: HTMLInputElement | null = null;
  private mainFrame: HTMLElement | null = null;
  /** 主 canvas */
  private showImageBox: HTMLImageElement | null = null;
  /** 展示图片的 img 实例 */
  private showImage: HTMLCanvasElement | null = null;
  /** 框体原始宽高 */
  public rawDomSize: IDomSize = { width: 0, height: 0 };

  /** 操作框体的 dom 实例 */
  public controlDom: HTMLElement | null = null;
  /** 预览父框体的 dom 实例 */
  public previewDom: HTMLElement | null = null;
  /** 预览窗帘的 dom 实例 */
  public previewCurtainDom: HTMLElement | null = null;
  /** 提醒图片的父级 dom 实例 */
  public remindImageDom: HTMLElement | null = null;
  /** 提醒图片的 img 实例 */
  public remindImageImg: HTMLCanvasElement | null = null;
  /** 是否是开发模式 */
  public isDev: boolean = false;
  /** 导出图片的回调函数 */
  public onExportImage: (image: string) => void = () => {};
  /** onUpload 回调函数 */
  public onUpload: () => void = () => {};
  
  /** 请求 token */
  public token: string = '';
  /** 请求 merchantId */
  public merchantId: string = '';

  constructor(element: HTMLElement, options?: {
    /** 步骤变化回调 */
    onStepChange?: ({ stepList, currentStepIndex }: { stepList: IDrawCanvasInfo[], currentStepIndex: number }) => void
    /** 导出图片回调 */
    onExportImage?: (image: string) => void
    /** 结束回调 */
    onFinish?: () => void
    /** 上传回调 */
    onUpload?: () => void
    /** 实时变化回调 */
    realTimeChange?: (step: IDrawCanvasInfo) => void
    /** 是否是开发模式 */
    isDev?: boolean
    /** 请求 token */
    token: string
    /** 请求 merchantId */
    merchantId: string
    /** 请求 host */
    host: string
    /** 请求 routes */
    routes: string,
    /** 请求 action */
    action: {
      extend: string
      erase: string
      removeBg: string
      hd: string
    },
  }) {
    if (!element) {
      throw new Error('必须要传入一个容器！');
    }
    this.container = element;
    
    // 统一设置headers
    httpClient.setHeaderGetter('token', () => options?.token ?? '');
    httpClient.setHeaderGetter('merchant_id', () => options?.merchantId ?? '');
    
    // 如果有回调函数，就设置它
    if (options?.onStepChange) {
      events.setOnStepChange(
        options.onStepChange,
        options.onFinish ?? (() => {}),
        options.isDev ?? false,
        options.realTimeChange
      );
    }
    
    if (options?.host) {
      events.setHttpConfig(options.host, options.routes, options.action);
    }

    if (options?.onUpload) {
      this.onUpload = options.onUpload;
    }
    if (options?.onExportImage) {
      this.onExportImage = options.onExportImage;
    }
    this.isDev = options?.isDev ?? false;
    
    this.init();
  }

  public static getInstance(element: HTMLElement): PixPro {
    if (!PixPro.instance) {
      PixPro.instance = new PixPro(element);
    }
    return PixPro.instance;
  }

  /** 初始化 */
  init() {
    /** 渲染 DOM */
    this.renderDom();
    /** 获取 DOM 的宽高 */
    this.getFrameSize();
    /** 监听上传 */
    this.linstenerUpload();
    /** 拖拽 */
    DragHandler(this.mainFrame as HTMLElement, this.showImageBox as HTMLImageElement);

    console.log(this.isDev ? '开启调试' : '关闭调试')
    if (this.isDev) {
      removeClass(this.remindImageDom as HTMLElement, 'hide');
      addClass(this.controlDom as HTMLElement, 'is-dev');
    }
  }

  /** 渲染 DOM */
  renderDom() {
    const { container } = this;
    const scopeId = generateScopeId();

    /** 添加全局样式 */
    const styleElement = document.createElement('style');
    styleElement.textContent = scopeStyles(styles, scopeId);
    document.head.appendChild(styleElement);

    /** 添加全局模板 */
    container.innerHTML = scopeTemplate(AppTemplate, scopeId);

    this.fileInput = container.querySelector('#photo-studio-upload-input') as HTMLInputElement;
    this.mainFrame = container.querySelector('.photo-studio-container') as HTMLElement;
    this.showImageBox = container.querySelector('#container-canvas') as HTMLImageElement;
    this.showImage = container.querySelector('#container-canvas canvas') as HTMLCanvasElement;
    this.controlDom = this.container.querySelector('.control-container') as HTMLElement;
    this.previewDom = this.container.querySelector('.preview-container') as HTMLElement;
    this.previewCurtainDom = this.container.querySelector('#preview-curtain-box') as HTMLElement;
    this.remindImageDom = this.container.querySelector('#remind-image') as HTMLElement;
    this.remindImageImg = this.container.querySelector('#remind-image canvas') as HTMLCanvasElement;
  }

  /** 监听上传 */
  linstenerUpload() {
    const { fileInput } = this;
    if (!fileInput) return;

    /** 监听input框的上传事件 */
    fileInput.addEventListener('change', async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        /** 触发 onUpload 方法 */
        this.onUpload && this.onUpload();
        await delay(0);
        this.getFrameSize();
        const file = target.files[0];
        const result = await events.init(file);

        /** 隐藏上传 */
        addClass(document.querySelector('.upload-container') as HTMLDivElement, 'hide');

        /** 给提醒图片添加宽高 */
        setStyle(this.remindImageDom as HTMLElement, {
          width: `${result.styleWidth}px`,
          height: `${result.styleHeight}px`
        });
        setStyle(this.remindImageImg as HTMLElement, {
          width: `${result.styleWidth}px`,
          height: `${result.styleHeight}px`
        });
        /** 给控制框体添加宽高 */
        setStyle(this.controlDom as HTMLElement, {
          width: `${result.styleWidth}px`,
          height: `${result.styleHeight}px`
        });

        /** 给显示框体添加宽高 */
        setStyle(this.previewDom as HTMLElement, {
          width: `${result.styleWidth}px`,
          height: `${result.styleHeight}px`
        });
        
        setStyle(this.showImage as HTMLElement, {
          width: `${result.styleWidth}px`,
          height: `${result.styleHeight}px`
        });

        /** 给窗帘添加宽高 */
        setStyle(this.previewCurtainDom as HTMLElement, {
          width: `${result.styleWidth}px`,
          height: `${result.styleHeight}px`
        });

        /** 显示预览 */
        removeClass(document.querySelector('.preview-control-container') as HTMLDivElement, 'hide');
      }
    });
  }

  /** 获取 DOM 的宽高 */
  getFrameSize() {
    const { mainFrame } = this;
    if (!mainFrame) return;
    this.rawDomSize = { width: mainFrame.clientWidth, height: mainFrame.clientHeight };
    events.setRawDomSize(this.rawDomSize);
  }

  /** 回退到上一步 */
  public rollback() {
    events.backStep();
  }

  /** 前进到下一步 */
  public forward() {
    return events.forwardStep();
  }

  /** 恢复到初始状态 */
  public reset() {
    return events.reset();
  }

  /** 获取当前状态 */
  public status() {
    return events.status();
  }

  /** 水平或垂直翻转 */
  public flip(flip: 'x' | 'y') {
    return events.flip(flip);
  }

  /** 裁剪比例 */
  public cropRatio(ratio: { ratio: number | null, label: string, isTrigger?: boolean }) {
    return events.cropRatio(ratio);
  }

  /** 旋转 */
  public rotate(angle: number) {
    return events.rotate(angle);
  }

  /** 导出图片 */
  public async exportImage() {
    const image = await events.exportImage(true);
    this.onExportImage(image);
  }

  /** 一键扩图 API */
  public expandImageBtn() {
    return events.expandImageBtn();
  }

  /** 转动 */
  public turn(direction: 'left' | 'right') {
    return events.turn(direction);
  }

  /** 擦除 */
  public eraseImage() {
    return events.eraseImage();
  }

  /** 设置橡皮擦大小 */
  public setEraserSize(size: number) {
    return events.setEraserSize(size);
  }

  /** 一键移除背景 */
  public removeBg() {
    return events.removeBg();
  }

  /** 一键提升解析度 */
  public hd() {
    return events.hd();
  }

  /** 修改背景颜色 */
  public setRemoveBgColor(color: string) {
    return events.setRemoveBgColor(color);
  }

  /** 切换模式 */
  public switchMode(oldMode: IImageMode, newMode: IImageMode) {
    return events.switchMode(oldMode, newMode);
  }

  /** 设置宽高 */
  public setWidthAndHeight(width: number, height: number, direction: 'width' | 'height' = 'width') {
    return events.setWidthAndHeight(width, height, direction);
  }

  /** 重置所有状态 */
  public resetAll() {
    events.resetAll();
    /** 重置 DragHandler 实例 */
    resetDragHandlerInstance();
  }
}

export type { ICropRatio, IDrawCanvasInfo, IImageMode }

export default PixPro;