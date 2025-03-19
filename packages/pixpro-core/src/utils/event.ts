/**
 * 渲染组件类，负责的功能如下
 * 1. 将图片渲染成 canvas
 * 2. 记录每次操作的步骤
 * 3. 添加撤销/重做功能
 */
import { v4 as uuidv4 } from 'uuid';
import DragHandler from './dragHandle';
import Eraser from './eraser';
import { debounce } from 'lodash-es';
import httpClient from './CustomFetch';
import type {
  IImageMode,
  IDomSize,
  IDrawCanvasInfo,
  ICropRatio,
  ICompressResult,
  IDraggableGripper,
  IErasePoints
} from '@/types/IType';
import {
  calculateDimensions,
  round,
  compressImage,
  setStyle,
  addClass,
  removeClass,
  calcTurnData,
  calculateCropTransform,
  removeBase64Header,
  addBase64Header,
  canvasToGrayBase64,
  getWidthForHeigth,
  getHeightForWidth,
  getNewWHXYData,
  calculateExpandBoxWH,
  calculateExpandBoxUniversal
} from './utils';
import {
  CANVAS_RENDER_MIN_HEIGHT,
  CANVAS_RENDER_MIN_WIDTH,
  CROP_RATIO,
  THROTTLE_TIME,
  SILENT_IMAGE_QUALITY,
  DEFAULT_RESULT_FORMAT,
  DEFAULT_RESULT_IMAGE_FORMAT,
  DEFAULT_ERASER_SIZE,
  MAX_EXPAND_IMAGE_HEIGHT,
  MAX_EXPAND_IMAGE_WIDTH
} from '@/config/constants';
import { ConfirmExpandTemplate } from '@/templates/App';
import handleExportImage from './exportImage';
import WeakTip from './weakTip';

class Renderer {
  private static instance: Renderer;
  /** 展示图片的实例 */
  private showImageBox: HTMLSpanElement | null = null;
  /** 展示图片的 img 实例 */
  private showImage: HTMLCanvasElement | null = null;
  /** 图片列表 */
  public imagesList: Record<string, ICompressResult> = {};
  /** 渲染步骤列表 */
  private stepList: IDrawCanvasInfo[] = []
  /** 当前步骤索引 */
  private currentStepIndex: number = -1;
  /** canvas 与 DOM 的缩放比例 */
  public proportions: number = 0;
  /** 操作框体的 dom 实例 */
  public curtainDom: HTMLElement | null = null;
  /** 预览父框体的 dom 实例 */
  public previewDom: HTMLElement | null = null;
  /** 预览窗帘的 dom 实例 */
  public previewCurtainDom: HTMLElement | null = null;
  /** 提醒图片的 img 实例 */
  public remindImageImg: HTMLCanvasElement | null = null;
  /** 提醒图片的父级 dom 实例 */
  public remindImageDom: HTMLElement | null = null;
  /** 擦除画布的父级 dom 实例 */
  public eraserContainerDom: HTMLElement | null = null;
  /** 擦除画布 */
  public eraserCanvas: HTMLCanvasElement | null = null;
  /** 擦除实例 */
  public eraser: Eraser | null = null;
  /** 预览裁切框体的父级 dom 实例 */
  public previewControlContainerDom: HTMLElement | null = null;
  /** 初始上传的图片，该图片用来做默认导出 */
  public defaultImage: File | null = null;
  /** 是否导出原图 */
  public isExportOriginal: boolean = true;

  /** 请求 host */
  private host: string = '';
  /** 请求 routes */
  private routes: string = '';
  /** 请求 action */
  private action: {
    extend: string
    erase: string
    removeBg: string
    hd: string
  } = {
    extend: '',
    erase: '',
    removeBg: '',
    hd: ''
  }


  /**
   * 是否启用拖拽框体，该设置一般用于不同模式
   * 目前只有裁剪模式和扩图模式下，裁切框体是必须的，所以默认启用
   * 拖拽框体影响的地方有：
   * 1. 拖拽裁切框体是否显示
   * 2. 鼠标置入图片内的鼠标拖拽样式
   */
  public isDragCropBox: boolean = true;

  /** 框体原始宽高 */
  private rawDomSize: IDomSize | null = null;

  /** 图片的原比例 */
  private originalRatio = { vertical: 0, horizontal: 0 };

  /** 需要移动 x 轴偏移量的把手 */
  private dragGripperX: IDraggableGripper[] = ['l', 'bl', 'tl'];

  /** 需要移动 y 轴偏移量的把手 */
  private dragGripperY: IDraggableGripper[] = ['t', 'tl', 'tr'];

  // 添加回调函数属性
  private onStepChangeCallback: (({ stepList, currentStepIndex }: { stepList: IDrawCanvasInfo[], currentStepIndex: number }) => void) | null = null;

  private onFinish: (() => void) | null = null;

  private realTimeChange: ((step: IDrawCanvasInfo) => void) | null = null;

  /** 是否是开发模式 */
  public isDev: boolean = false;

  private constructor() {
    // 在构造函数中初始化防抖函数
    this.debouncedHandleStepList = debounce((step: IDrawCanvasInfo) => {
      this.handleStepList(step);
    }, THROTTLE_TIME);
  }

  /** 实时变化 */
  public handleRealTimeChange(step: IDrawCanvasInfo) {
    this.realTimeChange && this.realTimeChange(step);
  }

  public static getInstance(): Renderer {
    if (!Renderer.instance) {
      Renderer.instance = new Renderer();
    }
    return Renderer.instance;
  }

  /** 设置请求配置 */
  public setHttpConfig(host: string, routes: string, action: {
    extend: string
    erase: string
    removeBg: string
    hd: string
  }) {
    this.host = host;
    this.routes = routes;
    this.action = action;
    
    // 更新 httpClient 的 baseURL
    httpClient.setBaseURL(host);
  }

  /** 图片初始上传的初始化 */
  public async init(file: File): Promise<{
    styleHeight: number;
    styleWidth: number;
  }> {
    if (!file) {
      throw new Error('图片不能为空');
    }
    /** 实例化 DOM 元素 */
    this.showImageBox = this.showImageBox ?? document.querySelector('#container-canvas') as HTMLSpanElement;
    this.showImage = this.showImage ?? document.querySelector('#container-canvas canvas') as HTMLCanvasElement;
    this.curtainDom = document.querySelector('.control-container') as HTMLElement;
    this.previewDom = document.querySelector('.preview-container') as HTMLElement;
    this.previewCurtainDom = document.querySelector('#preview-curtain-box') as HTMLElement;
    this.remindImageDom = document.querySelector('#remind-image') as HTMLElement;
    this.remindImageImg = document.querySelector('#remind-image canvas') as HTMLCanvasElement;
    this.eraserContainerDom = document.querySelector('.eraser-container') as HTMLElement;
    this.eraserCanvas = document.querySelector('#eraser-canvas') as HTMLCanvasElement;
    this.previewControlContainerDom = document.querySelector('.preview-control-container') as HTMLElement;
    try {
      /** 压缩图片 */
      const image = await compressImage(file);
      /** 保存原始图片 */
      const nowImageId = uuidv4();
      this.imagesList[nowImageId] = image;
  
      return this.renderImage(nowImageId);
      
    } catch (error) {
      console.error(error)
      throw new Error('图片渲染失败');
    }
  }

  /**
   * 导出图片函数 - 处理图片的裁剪、旋转、翻转等变换并导出为 base64 格式
   * 
   * 该函数执行以下步骤：
   * 1. 创建原始图像画布并绘制原始图像
   * 2. 计算裁剪区域在原始图像上的位置和尺寸
   * 3. 处理90度整数倍旋转(turn)
   * 4. 处理水平/垂直翻转(flip)
   * 5. 裁剪图像
   * 6. 处理自由旋转(rotate)和缩放(scale)
   * 7. 导出为 base64 格式
   * 
   * @param {boolean} hasBgColor - 是否需要添加背景色，默认为 false
   * @returns {Promise<string>} 返回处理后图片的 base64 字符串
   */
  public exportImage(hasBgColor: boolean = false) {
    return handleExportImage(
      hasBgColor,
      this.getNowStep(),
      this.imagesList[this.getNowStep().imgId]
    );
  }

  /** 渲染图片 */
  public async renderImage(uuid: string, switchMode: boolean = false, toMode: IImageMode = 'crop'): Promise<{
    styleHeight: number;
    styleWidth: number;
  }> {
    if (!this.showImageBox) {
      throw new Error('Canvas element is required');
    }
    const image = this.imagesList[uuid];

    /** 根据图片的尺寸计算 canvas 的尺寸 */
    const {
      canvasWidth,
      canvasHeight,
      styleWidth,
      styleHeight
    } = calculateDimensions(this.rawDomSize!, image.width, image.height);
    /** 计算 canvas 画布与 DOM 的缩放比例 */
    this.proportions = round(styleWidth / canvasWidth);
    console.log('this.proportions', styleWidth, canvasWidth, canvasHeight)

    /** 计算原图与 canvas 的缩放比例 */
    const imageToCanvasRatio = round(image.width / canvasWidth);

    /** 根据宽高计算方向 */
    const direction = styleWidth > styleHeight ? 'horizontal' : 'vertical';

    /** 计算当前图片的宽高比 */
    const rawAspectRatio = round(image.width / image.height);

    /** 计算原图的比例 */
    this.originalRatio = {
      vertical: round(canvasHeight / canvasWidth),
      horizontal: round(canvasWidth / canvasHeight)
    };

    const minWidth = CANVAS_RENDER_MIN_WIDTH * this.proportions
    const minHeight = CANVAS_RENDER_MIN_HEIGHT * this.proportions

    /** 初始化步骤 */
    const nowStep: IDrawCanvasInfo = {
      imgId: uuid,
      mode: toMode,
      moveX: 0,
      moveY: 0,
      gripper: 'body',
      rawImgWidth: image.width,
      rawImgHeight: image.height,
      rawDomWidth: styleWidth,
      rawDomHeight: styleHeight,
      cropBoxWidth: styleWidth,
      cropBoxHeight: styleHeight,
      currentDomWidth: styleWidth,
      currentDomHeight: styleHeight,
      fenceMaxWidth: styleWidth,
      fenceMaxHeight: styleHeight,
      fenceMinWidth: minWidth,
      fenceMinHeight: minHeight,
      xCropOffset: 0,
      yCropOffset: 0,
      xDomOffset: 0,
      yDomOffset: 0,
      turn: 0,
      zoom: 1,
      sx: 0,
      sy: 0,
      sWidth: image.width,
      sHeight: image.height,
      dx: 0,
      dy: 0,
      dWidth: canvasWidth,
      dHeight: canvasHeight,
      rotate: 0,
      rotateX: undefined,
      rotateY: undefined,
      flipX: 1,
      flipY: 1,
      scaleX: 1,
      scaleY: 1,
      cdProportions: this.proportions,
      direction,
      bgColor: 'transparent',
      controlMode: 'drag',
      rawAspectRatio,
      cropRatio: null,
      cropRationLabel: 'none',
      proportion: imageToCanvasRatio,
      domMinWidth: minWidth,
      domMinHeight: minHeight
    }
    /** 设置 canvas 的样式 */
    this.showImageBox!.style.width = `${styleWidth}px`;
    this.showImageBox!.style.height = `${styleHeight}px`;
    /** 记录步骤 */
    this.handleStepList(nowStep);

    /** 清除 canvas 的 data 属性 */
    this.showImageBox.removeAttribute('data');

    if (switchMode) {
      /** 切换模式的时候，需要重新设置窗帘和围栏 */
      this.changeCurtainBox(nowStep);
      this.setNowStepDom(nowStep);
    } else {
      /** 将当前步骤图片的 base64 数据渲染出来 */
      await this.renderImageToCanvas(nowStep);
    }
    /** 默认运行的时候，初始化拖拽处理器 */
    DragHandler(
      this.curtainDom as HTMLElement,
      this.showImageBox as HTMLImageElement
    ).initDragBoundaryCalculator(this.rawDomSize!);

    return ({
      styleHeight,
      styleWidth
    });
  }

  /** 将当前步骤图片的 base64 数据渲染到 canvas 上 */
  public async renderImageToCanvas(step: IDrawCanvasInfo, turn: number = 0) {
    const nowImages = this.imagesList[step.imgId];
    const tempImage = new Image();

    await new Promise((resolve) => {
      tempImage.onload = resolve;
      tempImage.src = nowImages.base64;
    });

    const angle = (turn * 90 * Math.PI) / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));

    const rotatedWidth = nowImages.width * cos + nowImages.height * sin;
    const rotatedHeight = nowImages.width * sin + nowImages.height * cos;

    /** 设置背景颜色 */
    this.changeRemoveBgColor(step);

    const renderToContext = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) {
        console.error('Canvas is null');
        return;
      }

      canvas.width = rotatedWidth;
      canvas.height = rotatedHeight;

      const ctx = canvas.getContext('2d', {
        alpha: true
      });
      if (!ctx) {
        console.error('Context is null');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 再绘制图片
      ctx.save();
      ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
      ctx.rotate(angle);
      ctx.drawImage(
        tempImage,
        -nowImages.width / 2,
        -nowImages.height / 2,
        nowImages.width,
        nowImages.height
      );
      ctx.restore();
    };

    renderToContext(this.showImage);
    renderToContext(this.remindImageImg);
  }

  /** 修改移除背景板块的背景色 */
  public changeRemoveBgColor(step: IDrawCanvasInfo) {
    /** 设置背景颜色 */
    if (step?.bgColor) {
      if (step?.bgColor === 'transparent') {
        this.previewDom!.style.removeProperty('background');
      } else {
        this.previewDom!.style.background = step?.bgColor;
      }
    }
  }

  /** 实时修改窗帘框体 */
  public changeCurtainBox(config: IDrawCanvasInfo, nowGripper?: IDraggableGripper) {
    const {
      cropBoxHeight,
      cropBoxWidth,
      moveX,
      moveY,
      xDomOffset = 0,
      yDomOffset = 0,
      gripper,
      flipX,
      flipY,
      rotate,
      rotateX,
      rotateY,
      scale
    } = config;

    this.realTimeChange && this.realTimeChange(config);

    const curtainStyle: any = {
      height: `${cropBoxHeight}px`,
      width: `${cropBoxWidth}px`
    }
    const previewCurtainStyle: any = {
      height: `${cropBoxHeight}px`,
      width: `${cropBoxWidth}px`
    }
    const nowYDomOffset = -1 * yDomOffset
    const nowXDomOffset = -1 * xDomOffset
    const showImageBoxStyle: any = {
      transform: `translate(${nowXDomOffset}px, ${nowYDomOffset}px) scale(${flipX}, ${flipY}) rotate(${rotate}deg) scale(${scale ?? 1})`
    }
    if (rotateX && rotateY) {
      showImageBoxStyle.transformOrigin = `${rotateX}px ${rotateY}px`
    } else {
      showImageBoxStyle.transformOrigin = 'center'
    }
    /** 拖拽 y 轴 */
    if (this.dragGripperY.includes(gripper)) {
      curtainStyle.transform = `translateY(${moveY}px)`
      previewCurtainStyle.transform = `translateY(${moveY}px)`
    }

    /** 拖拽 x 轴 */
    if (this.dragGripperX.includes(gripper)) {
      curtainStyle.transform = `translateX(${moveX}px)`
      previewCurtainStyle.transform = `translateX(${moveX}px)`
    }

    /** 拖拽 x 轴和 y 轴 */
    if (this.dragGripperX.includes(gripper) && this.dragGripperY.includes(gripper)) {
      curtainStyle.transform = `translate(${moveX}px, ${moveY}px)`
      previewCurtainStyle.transform = `translate(${moveX}px, ${moveY}px)`
    }

    /** 把手的父级框体 */
    setStyle(this.curtainDom as HTMLElement, curtainStyle)
    /** 预览图片的父级框体 */
    setStyle(this.previewCurtainDom as HTMLElement, previewCurtainStyle)
    /** 预览图片本体 */
    setStyle(this.showImageBox as HTMLElement, showImageBoxStyle)
    /**  */
    // setStyle(this.remindImageDom as HTMLElement, showImageBoxStyle)


    if (nowGripper === 'body') {
      this.setNowStepDom(config)
    }
  }

  /** 实时修改图片大小（滚动缩放） */
  public changeImageSize(config: IDrawCanvasInfo) {
    const {
      currentDomWidth,
      currentDomHeight,
      xDomOffset,
      yDomOffset,
      flipX,
      flipY,
      rotate
    } = config;

    const previewCurtainStyle: any = {
      height: `${currentDomHeight}px`,
      width: `${currentDomWidth}px`,
      transform: `translate(-${xDomOffset}px, -${yDomOffset}px) scale(${flipX}, ${flipY})`
    }

    if (rotate) {
      previewCurtainStyle.transform = `translate(-${xDomOffset}px, -${yDomOffset}px) scale(${flipX}, ${flipY}) rotate(${rotate}deg)`
    }

    /** 修改预览图的宽高 */
    setStyle(this.showImageBox as HTMLElement, previewCurtainStyle)

    /** 修改提醒图片父级框体的宽高 */
    setStyle(this.remindImageDom as HTMLElement, previewCurtainStyle)

    /** 修改提醒图片的宽高 */
    setStyle(this.remindImageImg as HTMLElement, {
      height: `${currentDomHeight}px`,
      width: `${currentDomWidth}px`
    })
    setStyle(this.showImage as HTMLElement, {
      height: `${currentDomHeight}px`,
      width: `${currentDomWidth}px`
    })
    this.updateNowStep(config);
  }

  /** 更新当前步骤的数据 */
  public updateNowStep(step: IDrawCanvasInfo) {
    this.stepList[this.currentStepIndex] = { ...step };
  }

  /**
   * 设置当前步骤的 dom 最终形态
   * 
   * @param step 当前步骤
   * @param renderImage 是否重新渲染图片，默认 false
   */
  public async setNowStepDom(step: IDrawCanvasInfo, renderImage: boolean = false) {
    const {
      currentDomWidth,
      currentDomHeight,
      cropBoxHeight,
      cropBoxWidth,
      xDomOffset,
      yDomOffset,
      rotate,
      scale,
      flipX,
      flipY,
      rotateX,
      rotateY,
      turn
    } = { ...step };
    /** 设置预览框体的样式 */
    setStyle(this.previewDom as HTMLElement, {
      height: `${cropBoxHeight}px`,
      width: `${cropBoxWidth}px`
    })

    setStyle(this.curtainDom as HTMLElement, {
      height: `${cropBoxHeight}px`,
      width: `${cropBoxWidth}px`,
      transform: `translateX(0px)`
    })

    setStyle(this.previewCurtainDom as HTMLElement, {
      height: `${cropBoxHeight}px`,
      width: `${cropBoxWidth}px`,
      transform: `translateX(0px) translateY(0px)`
    })

    // console.log('cropBoxHeight', cropBoxHeight)
    // console.log('cropBoxWidth', cropBoxWidth)

    const nowXDomOffset = -1 * (xDomOffset ?? 0)
    const nowYDomOffset = -1 * (yDomOffset ?? 0)
    const remindImageDomStyle: any = {
      height: `${currentDomHeight}px`,
      width: `${currentDomWidth}px`,
      transform: `
        translate(${nowXDomOffset}px, ${nowYDomOffset}px)
        rotate(${rotate ?? 0}deg)
        scale(${flipX}, ${flipY})
        scale(${scale ?? 1})
      `
    }
    if (rotateX && rotateY) {
      remindImageDomStyle.transformOrigin = `${rotateX}px ${rotateY}px`
    }
    setStyle(this.remindImageDom as HTMLElement, remindImageDomStyle)
    setStyle(this.showImageBox as HTMLElement, remindImageDomStyle)

    setStyle(this.showImage as HTMLElement, {
      height: `${currentDomHeight}px`,
      width: `${currentDomWidth}px`
    })
    setStyle(this.remindImageImg as HTMLElement, {
      height: `${currentDomHeight}px`,
      width: `${currentDomWidth}px`
    })

    /** 如果需要重新渲染图片，则渲染，一般在模式切换的时候才会进行重新渲染 */
    if (renderImage) {
      await this.renderImageToCanvas({ ...step }, turn)
    }
  }

  /**
   * 操作 DOM 组
   * @param step 当前步骤
   * @param renderImage 是否重新渲染图片，默认 false
   * @param domBgColor 是否需要绘制背景颜色，默认 true
   */
  public async handleStepGroup(step: IDrawCanvasInfo, renderImage: boolean = false) {
    if (step.controlMode === 'zoom') {
      this.changeImageSize(step)
    } else if (step.controlMode === 'drag') {
      /** 修改窗帘 */
      this.changeCurtainBox(step);
    }
    /** 最终落地 */
    await this.setNowStepDom(step, renderImage);
  }

  /** 防抖操作步骤 - 只在操作结束后执行一次 */
  public debouncedHandleStepList = debounce((step: IDrawCanvasInfo) => {
    this.handleStepList(step);
  }, THROTTLE_TIME);

  /** 操作步骤 */
  public handleStepList(step: IDrawCanvasInfo) {
    /** 如果当前步骤不是最后一步，说明用户在回退后进行了新的操作 */
    if (this.currentStepIndex < this.stepList.length - 1) {
      /** 删除当前步骤之后的所有步骤 */
      this.stepList = this.stepList.slice(0, this.currentStepIndex + 1);
    }

    /** 添加新步骤 */
    this.stepList.push(step);

    /** 更新当前步骤索引 */
    this.currentStepIndex = this.stepList.length - 1;

    console.log('步骤更新：', this.stepList, step)

    /** 如果设置了回调函数，则调用它 */
    this.onStepChangeCallback && this.onStepChangeCallback({ stepList: this.stepList, currentStepIndex: this.currentStepIndex });
    if (this.onFinish) {
      this.onFinish()
    }
  }

  /** 获取当前步骤的数据 */
  public getNowStep() {
    return this.stepList[this.currentStepIndex];
  }

  /**
   * 操作会影响步骤的回调函数，这里会调用每个区域的方法，但是不会新增步骤，目前仅有恢复原图、返回上一步、前进
   * @param renderImage 是否重新渲染图片，默认 false
   */
  public async handleStepChangeCallback (renderImage = false) {
    if (this.onStepChangeCallback) {
      const nowIndex = this.currentStepIndex
      console.log('跳转步骤，当前配置', this.stepList[nowIndex])
      /** 跳转步骤的时候，看需求是否需要重新渲染图片 */
      if (renderImage) {
        await this.renderImageToCanvas({ ...this.stepList[nowIndex] }, this.stepList[nowIndex].turn)
      }
      this.onStepChangeCallback({ stepList: this.stepList, currentStepIndex: nowIndex });
      const nowMode = this.stepList[nowIndex].mode
      if(nowMode === 'crop' || nowMode === 'expand') {
        this.toggleCropBoxVisible(true)
      } else {
        this.toggleCropBoxVisible(false)
      }
      if (nowMode === 'erase') {
        this.switchEraseImage(this.stepList[nowIndex])
      } else {
        this.clearErase()
      }
      if (nowMode === 'remove-bg') {
        this.changeRemoveBgColor(this.stepList[nowIndex])
      }
    }
  }

  /** 步骤回退 */
  public backStep() {
    let renderImage = false
    if (this.currentStepIndex > 0) {
      const oldImageId = this.stepList[this.currentStepIndex].imgId
      const oldTurn = this.stepList[this.currentStepIndex].turn
      this.currentStepIndex--;
      /** 修改窗帘 */
      this.handleStepGroup(this.stepList[this.currentStepIndex]);
      const newImageId = this.stepList[this.currentStepIndex].imgId
      const newTurn = this.stepList[this.currentStepIndex].turn
      if (oldImageId !== newImageId || oldTurn !== newTurn) {
        renderImage = true
      }
    }
    this.handleStepChangeCallback(renderImage);
    return null;
  }


  /** 步骤前进 */
  public forwardStep() {
    let renderImage = false
    if (this.currentStepIndex < this.stepList.length - 1) {
      const oldImageId = this.stepList[this.currentStepIndex].imgId
      const oldTurn = this.stepList[this.currentStepIndex].turn
      this.currentStepIndex++;
      /** 修改窗帘 */
      this.handleStepGroup(this.stepList[this.currentStepIndex]);
      const newImageId = this.stepList[this.currentStepIndex].imgId
      const newTurn = this.stepList[this.currentStepIndex].turn
      if (oldImageId !== newImageId || oldTurn !== newTurn) {
        renderImage = true
      }
    }
    this.handleStepChangeCallback(renderImage);
    return null;
  }

  /** 恢复到初始状态 */
  public reset() {
    let renderImage = false
    const oldImageId = this.stepList[this.currentStepIndex].imgId
    const oldTurn = this.stepList[this.currentStepIndex].turn
    const initStep = { ...this.stepList[0] };
    this.stepList = [initStep];
    this.currentStepIndex = 0;
    this.handleStepGroup(initStep);
    const newImageId = this.stepList[this.currentStepIndex].imgId
    const newTurn = this.stepList[this.currentStepIndex].turn
    if (oldImageId !== newImageId || oldTurn !== newTurn) {
      renderImage = true
    }
    this.handleStepChangeCallback(renderImage);
  }


  /** 获取当前状态 */
  public status() {
    return {
      isAllowBack: this.currentStepIndex > 0,
      isAllowForward: this.currentStepIndex < this.stepList.length - 1
    };
  }

  /** 设置原始 dom 尺寸 */
  public setRawDomSize(size: IDomSize) {
    this.rawDomSize = size;
  }

  /** 显示/隐藏提醒图片 */
  public toogleRemindImage(add = false) {
    if (this.isDev) return;
    if (add) {
      removeClass(this.remindImageDom as HTMLElement, 'hide');
    } else {
      addClass(this.remindImageDom as HTMLElement, 'hide');
    }
  }

  /** 水平或垂直翻转 */
  public flip(flip: 'x' | 'y') {
    if (this.currentStepIndex === -1) return;
    const nowStep = { ...this.getNowStep() };
    if (nowStep) {
      if (flip === 'x') {
        nowStep.flipX = nowStep.flipX === 1 ? -1 : 1
      }
      if (flip === 'y') {
        nowStep.flipY = nowStep.flipY === 1 ? -1 : 1
      }
      /** 计算旋转中心，这里的复合计算有些问题，目前先不计算，代码保留 */
      // const { x, y } = calculateRotateCenter(nowStep);
      // nowStep.rotateX = x;
      // nowStep.rotateY = y;
      // /** 设置偏移量 */
      // if (nowStep.flipX === -1) {
      //   const nowXOffset = nowStep.currentDomWidth - ((nowStep.xDomOffset ?? 0) + nowStep.cropBoxWidth)
      //   nowStep.xDomOffset = nowXOffset
      // }

      /** 最终设置 */
      this.handleStepGroup(nowStep);
      this.debouncedHandleStepList(nowStep);
    }
  }

  /** 按比例裁剪 */
  public cropRatio({ ratio, label, isTrigger = true }: { ratio: number | null, label: string, isTrigger?: boolean }) {
    const nowStep = { ...this.getNowStep() };
    const fromRatio = nowStep.cropRationLabel ?? 'none'

    /** 如果裁剪比例相同，则取消裁剪比例 */
    if (fromRatio === label) {
      label = 'none'
      ratio = null
    }

    /**
     * 获取数字裁剪比例
     * 如果裁剪比例为 original，则获取当前图片的宽高比
     */
    const cropRatio = label === 'original' 
      ? nowStep.currentDomWidth / nowStep.currentDomHeight
      : ratio
    /** 设置裁剪标签 */
    nowStep.cropRationLabel = label;
    console.log('cropRatio', cropRatio, label)

    if (cropRatio != null) {
      /** 设置裁剪比，如果是 0 则需要获取原图的宽高比 */
      nowStep.cropRatio = cropRatio === 0 ? nowStep.rawImgWidth / nowStep.rawImgHeight : cropRatio

      nowStep.cropRatio = nowStep.cropRatio ? round(nowStep.cropRatio, 4) : null
    } else {
      nowStep.cropRatio = null
    }
    
    /** 当前模式 */
    const nowMode = nowStep.mode

    if (nowMode === 'expand') {
      /** 计算扩图框体的宽高和 xy 轴偏移量 */
      const {
        step: newStep,
        isOverMaxRatio
      } = calculateExpandBoxUniversal(nowStep, cropRatio)
      if (isOverMaxRatio) {
        newStep.cropRationLabel = 'none'
        const weakTip = new WeakTip({
          text: '当前图片无法拓展到该比例，请重新选择',
          duration: 2000,
          fadeOutDuration: 200
        })
        weakTip.show()
      }
      this.handleStepGroup(newStep);
      this.handleStepList(newStep);
    } else if (nowMode === 'crop') {
      /** 允许的最大宽高 */
      let nowMaxWidth = this.rawDomSize?.width ?? 0
      let nowMaxHeight = this.rawDomSize?.height ?? 0

      let newWidth = nowStep.cropBoxWidth
      let newHeight = nowStep.cropBoxHeight

      /** 计算宽高比 */
      if (nowStep.cropRatio) {
        if (nowStep.cropRatio >= 1) {
          newWidth = nowMaxWidth
          /** 先计算新的高度 */
          newHeight = nowMaxWidth / nowStep.cropRatio!
        }
        if (nowStep.cropRatio < 1) {
          newHeight = nowMaxHeight
          /** 先计算新的宽度 */
          newWidth = nowMaxHeight * nowStep.cropRatio!
        }

        const {
          width,
          height,
          xDomOffset,
          yDomOffset,
          currentDomWidth,
          currentDomHeight,
          zoom
        } = getNewWHXYData(newWidth, newHeight, nowMaxWidth, nowMaxHeight, nowStep)

        nowStep.zoom = zoom
        nowStep.currentDomHeight = currentDomHeight
        nowStep.currentDomWidth = currentDomWidth
        nowStep.cropBoxWidth = width
        nowStep.cropBoxHeight = height
        nowStep.xDomOffset = xDomOffset
        nowStep.yDomOffset = yDomOffset
      }
      
      this.handleStepGroup(nowStep);
      this.handleStepList(nowStep);
    }
  }

  /** 手动设置宽高 */
  public setWidthAndHeight(width: number, height: number, mainDirection: 'width' | 'height' = 'width') {
    const nowStep = { ...this.getNowStep() };
    let nowWidth = width * (nowStep.cdProportions ?? 1)
    let nowHeight = height * (nowStep.cdProportions ?? 1)

    if (nowWidth === nowStep.cropBoxWidth && nowHeight === nowStep.cropBoxHeight) return;

    if (nowWidth > nowStep.fenceMaxWidth) {
      nowWidth = nowStep.fenceMaxWidth
    }
    if (nowHeight > nowStep.fenceMaxHeight) {
      nowHeight = nowStep.fenceMaxHeight
    }

    if (nowWidth < nowStep.fenceMinWidth) {
      nowWidth = nowStep.fenceMinWidth
      nowStep.xDomOffset = 0
    }
    if (nowHeight < nowStep.fenceMinHeight) {
      nowHeight = nowStep.fenceMinHeight
      nowStep.yDomOffset = 0
    }

    /** 是否为按比例裁切的状态 */
    if (nowStep.cropRatio != null) {
      if (mainDirection === 'height') {
        const { width, height, xDomOffset, yDomOffset } = getWidthForHeigth(nowStep, nowHeight, this.rawDomSize!)
        nowWidth = width
        nowHeight = height
        nowStep.xDomOffset = xDomOffset
        nowStep.yDomOffset = yDomOffset
      }
      if (mainDirection === 'width') {
        const { width, height, xDomOffset, yDomOffset } = getHeightForWidth(nowStep, nowWidth, this.rawDomSize!)
        nowWidth = width
        nowHeight = height
        nowStep.xDomOffset = xDomOffset
        nowStep.yDomOffset = yDomOffset
      }
      console.log('按比例裁切', nowStep.cropRatio, mainDirection, nowWidth, nowHeight)
    }


    nowStep.cropBoxWidth = nowWidth
    nowStep.cropBoxHeight = nowHeight
    this.handleStepGroup(nowStep);
    this.handleStepList(nowStep);
  }

  /** 添加设置回调的方法 */
  public setOnStepChange(
    callback: ({ stepList, currentStepIndex }: { stepList: IDrawCanvasInfo[], currentStepIndex: number }) => void,
    onFinish: () => void,
    isDev: boolean = false,
    realTimeChange: ((step: IDrawCanvasInfo) => void) | null = null
  ) {
    this.onStepChangeCallback = callback;
    this.onFinish = onFinish;
    this.isDev = isDev;
    this.realTimeChange = realTimeChange;
  }

  /** 旋转 */
  public rotate(angle: number) {
    if (this.currentStepIndex === -1) return;
    const nowStep = { ...this.getNowStep() };
    if (nowStep.mode !== 'crop') return;

    /** 计算旋转后需要的尺寸 */
    const {
      scale,
      transformOrigin,
      rotatedRectSize,
      offset,
      newWidth,
      newHeight,
    } = calculateCropTransform(
      { width: nowStep.currentDomWidth, height: nowStep.currentDomHeight },
      { width: nowStep.cropBoxWidth, height: nowStep.cropBoxHeight },
      { x: nowStep.xDomOffset ?? 0, y: nowStep.yDomOffset ?? 0 },
      angle
    );
    const { x, y } = transformOrigin

    /** 设置旋转角度 */
    nowStep.rotate = angle;
    // nowStep.currentDomHeight = newHeight
    // nowStep.currentDomWidth = newWidth
    nowStep.rotateX = x;
    nowStep.rotateY = y;
    // nowStep.xDomOffset = domOffset.offsetX
    // nowStep.yDomOffset = domOffset.offsetY
    // nowStep.xCropOffset = cropOffset.offsetX
    // nowStep.yCropOffset = cropOffset.offsetY
    /** 设置缩放比例 */
    nowStep.scale = round(scale);
    console.log('旋转', rotatedRectSize, offset, newWidth, newHeight)
    

    this.setNowStepDom(nowStep);
    this.debouncedHandleStepList(nowStep);
    this.realTimeChange && this.realTimeChange(nowStep);
  }

  /** 转动 */
  public async turn(direction: 'left' | 'right') {
    if (this.currentStepIndex === -1) return;
    let nowStep = { ...this.getNowStep() };
    const oldTurn = nowStep.turn ?? 0
    if (direction === 'left') {
      nowStep.turn = (nowStep.turn ?? 0) - 1
    }
    if (direction === 'right') {
      nowStep.turn = (nowStep.turn ?? 0) + 1
    }
    if (nowStep.turn === 4) {
      nowStep.turn = 0
    }
    if (nowStep.turn === -1) {
      nowStep.turn = 3
    }

    /** 计算翻转数据 */
    nowStep = calcTurnData(nowStep, this.rawDomSize!, oldTurn, direction)

    /** 最终设置 */
    await this.handleStepGroup(nowStep, true);
    this.handleStepList(nowStep);
    this.realTimeChange && this.realTimeChange(nowStep);
  }

  /** 裁切框显示/隐藏 */
  public toggleCropBoxVisible(show = false) {
    if (show) {
      removeClass(this.curtainDom as HTMLElement, 'hide');
      removeClass(this.previewControlContainerDom as HTMLElement, 'none-drag');
      this.isDragCropBox = true;
    } else {
      addClass(this.curtainDom as HTMLElement, 'hide');
      addClass(this.previewControlContainerDom as HTMLElement, 'none-drag');
      this.isDragCropBox = false;
    }
  }

  /** 图片切片，该方法会返回最新的图片 ID */
  public async imageSlice(w?: number, h?: number, hasBgColor: boolean = false) {
    const nowStep = { ...this.getNowStep() };
    const uuid = uuidv4()
    const nowBL = nowStep.rawImgWidth / nowStep.currentDomWidth
    w = w ?? round(nowStep.cropBoxWidth * nowBL, 0)
    h = h ?? round(nowStep.cropBoxHeight * nowBL, 0)
    const image = await this.exportImage(hasBgColor);
    const nowimage = await compressImage(image, { quality: SILENT_IMAGE_QUALITY });
    this.imagesList[uuid] = {
      'base64': nowimage.base64,
      'width': w,
      'height': h
    };
    return uuid
  }

  /**
   * 切换模式，模式切换会新增步骤
   * @param mode 模式
   * @param newStep 是否新增步骤
   */
  public async switchMode(fromMode: IImageMode, toMode: IImageMode) {
    let nowStep = { ...this.getNowStep() };
    console.log('切换模式', 'from', fromMode, 'to', toMode, 'nowStep', nowStep.mode)
    /** 如果当前模式与切换模式相同，则不进行任何操作 */
    if (fromMode === toMode) return nowStep
    /** 设置当前步骤的模式 */
    nowStep.mode = toMode

    let newStep = true
    /** 是否需要重新渲染 canvas */
    let hasRenderCanvas = false

    /** 从裁切模式切换到其他模式 */
    if (fromMode === 'crop') {
      /** 隐藏裁切框 */
      this.toggleCropBoxVisible(false)
      /** 裁切目前的图片 */
      const nowImgId = await this.imageSlice()
      nowStep.imgId = nowImgId
      hasRenderCanvas = true
      /** 重置图片的大小与图片的偏移量 */
      nowStep = this.leaveCropStep(nowStep)
      console.log('离开裁切步骤', nowStep)
      nowStep.moveX = 0
      nowStep.moveY = 0
    }

    /** 从扩图模式切换到其他模式 */
    if (fromMode === 'expand') {
      /** 隐藏裁切框 */
      this.toggleCropBoxVisible(false)
      /** 按照最新的图片 ID 去重新渲染图片 */
      await this.renderImage(nowStep.imgId, true, toMode)
      nowStep = { ...this.getNowStep() }
      newStep = false
    }


    /** 从擦除模式切换到其他模式 */
    if (fromMode === 'erase') {
      /** 清除擦除功能 */
      this.clearErase();
      this.eraser = null
    }
    
    /** 从移除背景切换到其他模式 */
    if (fromMode === 'remove-bg') {
      /** 裁切目前的图片 */
      const nowImgId = await this.imageSlice(undefined, undefined, true)
      nowStep.imgId = nowImgId
      hasRenderCanvas = true
      nowStep.bgColor = 'transparent'
    }


    /** 从提升解析度切换到其他模式 */
    if (fromMode === 'hd') {
    }


    /** 从压缩容量切换到其他模式 */
    if (fromMode === 'compress') {
    }

    /** 目标模式是裁切模式 */
    if (toMode === 'crop') {
      /** 显示裁切框 */
      this.toggleCropBoxVisible(true)
    }

    /** 目标模式是扩图模式 */
    if (toMode === 'expand') {
      /** 启动扩图功能 */
      nowStep = this.expandImage(nowStep);
    }

    /** 目标模式是擦除模式 */
    if (toMode === 'erase') {
      /** 启动擦除功能 */
      nowStep.eraserSize = DEFAULT_ERASER_SIZE
      nowStep.erasePoints = []
      nowStep = this.switchEraseImage(nowStep);
    }

    if (newStep) {
      /** 指定的模式会在当前函数内新增步骤 */
      await this.handleStepGroup(nowStep, hasRenderCanvas);
      this.handleStepList(nowStep);
    }
    return nowStep
  }

  /** 离开裁切步骤到达并非扩图模式 */
  private leaveCropStep (nowStep: IDrawCanvasInfo) {
    const step = { ...nowStep }

    /** 重置所有偏移量和缩放 */
    step.xDomOffset = 0
    step.yDomOffset = 0
    step.xCropOffset = 0
    step.yCropOffset = 0
    step.moveX = 0
    step.moveY = 0
    step.zoom = 1
    step.turn = 0
    step.flipX = 1
    step.flipY = 1
    step.scaleX = 1
    step.scaleY = 1

    /** 根据裁剪框和图片显示的比例来计算新的原图大小：新的原图宽 = 老的原图宽 / （老的图片显示宽 / 老的裁切框宽） */
    step.rawImgWidth = step.rawImgWidth / (step.currentDomWidth / step.cropBoxWidth)
    step.rawImgHeight = step.rawImgHeight / (step.currentDomHeight / step.cropBoxHeight)

    /** 新的图片显示宽高等于裁切框的宽高 */
    step.currentDomHeight = step.cropBoxHeight
    step.currentDomWidth = step.cropBoxWidth

    /** 新的宽高比 */
    step.cdProportions = round(step.currentDomWidth / step.rawImgWidth)

    /** 新的围栏最大宽高 */
    step.fenceMaxWidth = step.currentDomWidth
    step.fenceMaxHeight = step.currentDomHeight

    return step
  }

  /** 计算扩图模式下裁切框的最大尺寸 */
  private getExpandCropBoxMaxWH(nowStep: IDrawCanvasInfo) {
    /** 获取裁切框的宽高比 */
    const nowProportions = nowStep.cropBoxWidth / nowStep.cropBoxHeight
    /** 获取裁切框的最大允许宽高 */
    const maxWidth = this.rawDomSize!.width / 3
    const maxHeight = this.rawDomSize!.height / 3
    console.log(this.rawDomSize, 'rawDomSize', maxWidth, maxHeight)

    /**
     * 如果裁切框的最大宽高都大于允许的最大宽高，计算的底层逻辑是：按比例缩放 cropBoxWidth 和 cropBoxHeight 到最大允许的宽高，
     * 假设：crop 的宽高为 400 * 800，而最大允许的宽高是 200 * 300，那么就需要按比例缩放 cropBoxWidth 和 cropBoxHeight 让其在最大允许的宽高内
     * 计算过程：
     * 1. 对比 Corp 的宽高，判断是宽和高谁更大，
     * 2. 如果宽比高大，则当前 crop 的宽为最大宽度，高为最大宽度除以宽高比
     * 3. 如果高比宽大，则当前 crop 的高为最大高度，宽为最大高度乘以宽高比
     * 4. 围栏的最大宽高为裁切框的宽高乘以 2
     */
    if (nowStep.cropBoxWidth > maxWidth && nowStep.cropBoxHeight > maxHeight) {
      if (nowStep.cropBoxWidth > nowStep.cropBoxHeight) {
        /** 考虑比较极端的情况 */
        let newCropBoxWidth = maxWidth
        let newCropBoxHeight = maxWidth / nowProportions
        if (newCropBoxHeight > maxHeight) {
          newCropBoxHeight = maxHeight
          newCropBoxWidth = maxHeight * nowProportions
        }
        return {
          cropBoxWidth: newCropBoxWidth,
          cropBoxHeight: newCropBoxHeight,
          fenceMaxWidth: maxWidth * 3,
          fenceMaxHeight: newCropBoxHeight * 3
        }
      } else {
        console.log('高比宽大')
        let newCropBoxHeight = maxHeight
        let newCropBoxWidth = maxHeight * nowProportions
        if (newCropBoxWidth > maxWidth) {
          newCropBoxWidth = maxWidth
          newCropBoxHeight = maxWidth / nowProportions
        }
        return {
          cropBoxHeight: newCropBoxHeight,
          cropBoxWidth: newCropBoxWidth,
          fenceMaxWidth: newCropBoxWidth * 3,
          fenceMaxHeight: maxHeight * 3
        }
      }
    }

    /** 如果裁切框的最大宽度大于最大允许的宽度 */
    if (nowStep.cropBoxWidth > maxWidth) {
      // console.log('裁切框的最大宽度大于最大允许的宽度')
      let newCropBoxWidth = maxWidth
      let newCropBoxHeight = maxWidth / nowProportions
      if (newCropBoxHeight > maxHeight) {
        newCropBoxHeight = maxHeight
        newCropBoxWidth = maxHeight * nowProportions
      }
      return {
        cropBoxWidth: newCropBoxWidth,
        cropBoxHeight: newCropBoxHeight,
        fenceMaxWidth: maxWidth * 3,
        fenceMaxHeight: newCropBoxHeight * 3
      }
    }
    /** 如果裁切框的最大高度大于最大允许的高度 */
    if (nowStep.cropBoxHeight > maxHeight) {
      // console.log('裁切框的最大高度大于最大允许的高度')
      let newCropBoxHeight = maxHeight
      let newCropBoxWidth = maxHeight * nowProportions
      if (newCropBoxWidth > maxWidth) {
        newCropBoxWidth = maxWidth
        newCropBoxHeight = maxWidth / nowProportions
      }
      return {
        cropBoxHeight: newCropBoxHeight,
        cropBoxWidth: newCropBoxWidth,
        fenceMaxHeight: maxHeight * 3,
        fenceMaxWidth: newCropBoxWidth * 3
      }
    }
    
    /** 否则根据宽高比来计算裁切框的最大宽高 */
    if (nowProportions >= 1) {
      /** 宽比高长，则宽为最大宽度，高为最大宽度除以宽高比 */
      const cropBoxHeight = maxWidth / nowProportions
      return {
        cropBoxWidth: maxWidth,
        cropBoxHeight,
        fenceMaxWidth: maxWidth * 3,
        fenceMaxHeight: cropBoxHeight * 3
      }
    } else {
      /** 高比宽长，则高为最大高度，宽为最大高度乘以宽高比 */
      const cropBoxWidth = maxHeight * nowProportions
      // console.log('高比宽长', cropBoxWidth, maxHeight)
      return {
        cropBoxHeight: maxHeight,
        cropBoxWidth,
        fenceMaxHeight: maxHeight * 3,
        fenceMaxWidth: cropBoxWidth * 3
      }
    }
  }

  /** 计算切换到扩图模式后原图的最大宽高 */
  private getExpandImageMaxWH(nowStep: IDrawCanvasInfo, cropBoxW: number) {
    /**
     * 先计算原图的最大宽高
     * 扩图模式，原图的最大的宽高是扩图模式支持最大分辨率的一半
     * 如果原图的宽高超过这个值，则按照这个值来计算
     * 如果原图小于这个值，就用这个值
     */
    const nowImgWidth = nowStep.cropBoxWidth / nowStep.cdProportions!
    const nowImgHeight = nowStep.cropBoxHeight / nowStep.cdProportions!

    let newImgWidth = nowImgWidth
    let newImgHeight = nowImgHeight

    /** 最大允许宽高，除以 2 的原因是因为图片最大只能放大一倍 */
    const maxAllowWidth = MAX_EXPAND_IMAGE_WIDTH / 3
    const maxAllowHeight = MAX_EXPAND_IMAGE_HEIGHT / 3

    /** 如果宽高都大于最大允许的高度 */
    if (nowImgWidth > maxAllowWidth && nowImgHeight > maxAllowHeight) {
      /** 比较宽高，取大的那个进行压缩 */
      if (nowImgWidth > nowImgHeight) {
        const bl = maxAllowWidth / nowImgWidth
        newImgWidth = maxAllowWidth
        newImgHeight = nowImgHeight * bl
      } else {
        const bl = maxAllowHeight / nowImgHeight
        newImgHeight = maxAllowHeight
        newImgWidth = nowImgWidth * bl
      }
    } else {
      /** 否则就看宽或者高是否大于最大允许的宽高 */
      if (nowImgWidth > maxAllowWidth) {
        const bl = maxAllowWidth / nowImgWidth
        newImgWidth = maxAllowWidth
        newImgHeight = nowImgHeight * bl
      }
      if (nowImgHeight > maxAllowHeight) {
        const bl = maxAllowHeight / nowImgHeight
        newImgHeight = maxAllowHeight
        newImgWidth = nowImgWidth * bl
      }
    }

    return {
      rawImgWidth: newImgWidth,
      rawImgHeight: newImgHeight,
      cdProportions: round(cropBoxW / newImgWidth)
    }

    /** 获得当前图片的最大宽高，与裁切盒子计算比例 */
    console.log('扩图模式，原图的最大宽高为：', newImgWidth, newImgHeight)
  }

  /** 扩图 */
  public expandImage(nowStep: IDrawCanvasInfo, hasProportions = true) {
    /** 显示操作框 */
    this.toggleCropBoxVisible(true)

    /** 计算扩图模式下裁切框的最大尺寸 */
    const { cropBoxWidth, cropBoxHeight, fenceMaxHeight, fenceMaxWidth } = this.getExpandCropBoxMaxWH(nowStep)
    
    /** 计算扩图模式下原图的最大尺寸 */
    const { rawImgWidth, rawImgHeight, cdProportions } = this.getExpandImageMaxWH(nowStep, cropBoxWidth)

    /** 设置图片和裁切框的大小 */
    nowStep.cropBoxWidth = cropBoxWidth
    nowStep.cropBoxHeight = cropBoxHeight
    nowStep.currentDomWidth = cropBoxWidth
    nowStep.currentDomHeight = cropBoxHeight
    /** 设置围栏的最小值 */
    nowStep.fenceMinWidth = cropBoxWidth
    nowStep.fenceMinHeight = cropBoxHeight
    /** 设置围栏的最大值，接口限制只能为图片的两倍大小 */
    nowStep.fenceMaxHeight = fenceMaxHeight
    nowStep.fenceMaxWidth = fenceMaxWidth
    /** 设置原图大小 */
    nowStep.rawImgWidth = rawImgWidth
    nowStep.rawImgHeight = rawImgHeight

    /** 重置裁切框与图片的偏移量 */
    nowStep.xDomOffset = 0
    nowStep.yDomOffset = 0

    /** 设置裁切框与最大边界的偏移量 */
    nowStep.xCropOffset = (nowStep.fenceMaxWidth - nowStep.currentDomWidth) / 2
    nowStep.yCropOffset = (nowStep.fenceMaxHeight - nowStep.currentDomHeight) / 2

    nowStep.moveX = 0
    nowStep.moveY = 0
    if (hasProportions) {
      nowStep.cdProportions = cdProportions
    }

    return nowStep
  }

  /** 设置橡皮擦大小 */
  public setEraserSize(size: number) {
    this.eraser?.setEraserSize(size);
  }

  /** 擦除路径回调 */
  private onEraseEnd(points: IErasePoints) {
    const nowStep = { ...this.getNowStep() }
    nowStep.erasePoints = points
    nowStep.eraserSize = points?.[0]?.[points.length - 1]?.size || 50
    this.handleStepGroup(nowStep, false);
    this.handleStepList(nowStep);
  }

  /** 处理接口返回的结果 */
  public async handleResult (image: string, type?: string) {
    const {
      imgId: oldImgId,
      rawImgWidth: oldRawImgWidth,
      rawImgHeight: oldRawImgHeight,
      cdProportions: oldCProportions
    } = this.getNowStep()
    const resultImage = image.length > 1000 ? addBase64Header(image) : image
    const newImage = await compressImage(resultImage, { quality: SILENT_IMAGE_QUALITY });
    const newImgUuid = uuidv4()
    this.imagesList[newImgUuid] = {
      'base64': newImage.base64,
      'width': newImage.width,
      'height': newImage.height
    };

    let newStep = { ...this.getNowStep() }
    newStep.rawImgHeight = newImage.height
    newStep.rawImgWidth = newImage.width
    
    /** 计算新的解析度 */
    const {
      canvasWidth,
      styleWidth
    } = calculateDimensions(this.rawDomSize!, newImage.width, newImage.height);
    newStep.cdProportions = round(styleWidth / canvasWidth);

    if (type === 'hd') {
      console.log('oldRawImgHeight', oldRawImgHeight)
      console.log('oldRawImgWidth', oldRawImgWidth)
      console.log('newImage.height', newImage.height)
      console.log('newImage.width', newImage.width)
      if (oldRawImgHeight !== newImage.height || oldRawImgWidth !== newImage.width) {
        /** 弹窗文案，图片分辨率已提升至：newImage.width x newImage.height */
        const weakTip = new WeakTip({
          text: `图片分辨率已提升至：${newImage.width} x ${newImage.height}`,
          duration: 5000,
          fadeOutDuration: 200
        })
        weakTip.show()
      }
      if (oldRawImgHeight === newImage.height && oldRawImgWidth === newImage.width) {
        /** 原始图片分辨率已为最佳，无需提升 */
        const weakTip = new WeakTip({
          text: '原始图片分辨率已为最佳，无需提升',
          duration: 5000,
          fadeOutDuration: 200
        })
        weakTip.show()
      }
    }
    
    /** 扩图 */
    if (type === 'expand') {
      /** 渲染图片到 canvas */
      newStep.imgId = newImgUuid
      newStep.currentDomHeight = newStep.cropBoxHeight
      newStep.currentDomWidth = newStep.cropBoxWidth
      newStep.xDomOffset = 0
      newStep.yDomOffset = 0
      newStep.disabledForm = true
      this.setNowStepDom(newStep);
      await this.renderImageToCanvas(newStep)
      this.realTimeChange && this.realTimeChange(newStep);

      // 添加确认扩展弹窗
      const confirmExpandWrapper = document.createElement('div');
      confirmExpandWrapper.className = 'confirm-expand-wrapper';
      confirmExpandWrapper.innerHTML = ConfirmExpandTemplate;
      
      // 添加到预览容器中
      const nowImgBox = document.querySelector('.image-box')
      nowImgBox?.appendChild(confirmExpandWrapper);
      
      // 绑定确认和取消事件
      const confirmBtn = confirmExpandWrapper.querySelector('.confirm-expand-container-btn-confirm');
      const cancelBtn = confirmExpandWrapper.querySelector('.confirm-expand-container-btn-cancel');
      this.onFinish && this.onFinish();
      
      // 确认按钮点击事件
      confirmBtn?.addEventListener('click', async () => {
        newStep.rawImgHeight = newImage.height
        newStep.rawImgWidth = newImage.width
        newStep.cdProportions = (newStep.cdProportions ?? 1) / 2
        newStep = this.expandImage(newStep, false)
        newStep.disabledForm = false
        
        // 添加退场动画
        confirmExpandWrapper.classList.add('confirm-expand-exit');
        
        // 等待动画完成后再移除元素
        setTimeout(() => {
          confirmExpandWrapper.remove();
        }, 200);
        
        newStep.imgId = newImgUuid;
        await this.handleStepGroup(newStep, false);
        this.handleStepList(newStep);
      });
      
      // 取消按钮点击事件
      cancelBtn?.addEventListener('click', async () => {
        newStep.currentDomHeight = newStep.fenceMinHeight
        newStep.currentDomWidth = newStep.fenceMinWidth
        newStep.cropBoxHeight = newStep.fenceMinHeight
        newStep.cropBoxWidth = newStep.fenceMinWidth
        newStep.rawImgHeight = oldRawImgHeight
        newStep.rawImgWidth = oldRawImgWidth
        newStep.cdProportions = oldCProportions
        newStep.disabledForm = false
        
        // 添加退场动画
        confirmExpandWrapper.classList.add('confirm-expand-exit');
        
        // 等待动画完成后再移除元素
        setTimeout(() => {
          confirmExpandWrapper.remove();
        }, 200);
        
        newStep.imgId = oldImgId;
        await this.handleStepGroup(newStep, true);
        this.handleStepList(newStep);
      });
    } else {
      newStep.imgId = newImgUuid;
      await this.handleStepGroup(newStep, true);
      this.handleStepList(newStep);
    }
  }

  /** 清除擦除功能 */
  public clearErase() {
    console.log(this.eraser)
    this.eraser?.clearEraser();
    addClass(this.eraserContainerDom as HTMLElement, 'hide');
    this.eraser = null
  }

  /** 初始化擦除功能 */
  public switchEraseImage(nowStep: IDrawCanvasInfo) {
    nowStep.mode = 'erase'

    if (this.eraser) {
      console.log('初始化擦除功能', nowStep.erasePoints)
      this.eraser!.redraw(nowStep.erasePoints || [])
    } else {
      console.log('初始化擦除功能', nowStep.erasePoints)
      this.eraser = new Eraser(
        this.eraserCanvas as HTMLCanvasElement,
        nowStep.eraserSize ?? DEFAULT_ERASER_SIZE,
        nowStep.currentDomWidth,
        nowStep.currentDomHeight,
        `${nowStep.currentDomWidth}px`,
        `${nowStep.currentDomHeight}px`,
        nowStep.erasePoints || [],
        (points) => {
          this.onEraseEnd(points)
        },
        this.remindImageImg as HTMLCanvasElement
      );
    }
    

    removeClass(this.eraserContainerDom as HTMLElement, 'hide');
    return nowStep
  }

  /** 一键擦除 API */
  public async eraseImage () {
    const imgId = await this.imageSlice(undefined, undefined, true)
    const nowImg = this.imagesList[imgId]
    const grayBase64 = canvasToGrayBase64(
      this.eraserCanvas as HTMLCanvasElement,
      nowImg.width,
      nowImg.height,
      false
    );
    try {
      const result = await httpClient.post(this.routes, {
        file: removeBase64Header(nowImg.base64),
        mask_file: grayBase64,
        result_format: DEFAULT_RESULT_IMAGE_FORMAT,
        return_url: DEFAULT_RESULT_FORMAT
      }, {
        action: this.action.erase
      });
      this.eraser?.clearCanvas()
      if (result.code === 0) {
        this.handleResult(result.data.image)
      } else {
        alert(result?.msg || '操作失败！')
        this.onFinish && this.onFinish()
        throw new Error(result)
      }
    } catch (error: any) {
      this.onFinish && this.onFinish()
    }
  }

  /** 一键移除背景 */
  public async removeBg() {
    try {
      const imgId = await this.imageSlice()
      const result = await httpClient.post(this.routes, {
        file: removeBase64Header(this.imagesList[imgId].base64),
        result_format: DEFAULT_RESULT_IMAGE_FORMAT,
        return_url: DEFAULT_RESULT_FORMAT
      }, {
        action: this.action.removeBg
      });
      if (result.code === 0) {
        this.handleResult(result.data.image)
      } else {
        alert(result?.msg || '操作失败！')
        this.onFinish && this.onFinish()
        throw new Error(result)
      }
    } catch (error: any) {
      this.onFinish && this.onFinish()
    }
  }

  /** 一键提升解析度 */
  public async hd() {
    try {
      const nowStep = { ...this.getNowStep() };
      const result = await httpClient.post(this.routes, {
        file: removeBase64Header(this.imagesList[nowStep.imgId].base64),
        result_format: DEFAULT_RESULT_IMAGE_FORMAT,
        return_url: DEFAULT_RESULT_FORMAT
      }, {
        action: this.action.hd
      });
      if (result.code === 0) {
        this.handleResult(result.data.image, 'hd')
      } else {
        alert(result?.msg || '操作失败！')
        this.onFinish && this.onFinish()
        throw new Error(result)
      }
    } catch (error: any) {
      this.onFinish && this.onFinish()
    }
  }

  /** 修改背景颜色 */
  public setRemoveBgColor(color: string) {
    const nowStep = { ...this.getNowStep() }
    nowStep.bgColor = color
    this.handleStepGroup(nowStep, true)
    this.handleStepList(nowStep)
  }

  /** 一键扩图 */
  public async expandImageBtn () {
    try {
      const {
        imgId,
        cropBoxHeight,
        cropBoxWidth,
        currentDomHeight,
        currentDomWidth,
        xDomOffset,
        yDomOffset
      } = { ...this.getNowStep() };
      /** 向左扩展 */
      const expansion_ratio_left = xDomOffset ? (((Math.abs(xDomOffset) ?? 1) / currentDomWidth)) : 0;
      /** 向上扩展 */
      const expansion_ratio_top = yDomOffset ? (((Math.abs(yDomOffset) ?? 1) / currentDomHeight)) : 0;
      /** 向右扩展 */
      const expansion_ratio_right = ((cropBoxWidth - currentDomWidth - Math.abs(xDomOffset ?? 1)) / currentDomWidth);
      /** 向下扩展 */
      const expansion_ratio_bottom = ((cropBoxHeight - currentDomHeight - Math.abs(yDomOffset ?? 1)) / currentDomHeight);

      /** 扩图保留小数点后 6 位 */
      const result = await httpClient.post(this.routes, {
        file: removeBase64Header(this.imagesList[imgId].base64),
        result_format: DEFAULT_RESULT_IMAGE_FORMAT,
        return_url: DEFAULT_RESULT_FORMAT,
        expansion_ratio_left: round(expansion_ratio_left, 6),
        expansion_ratio_top: round(expansion_ratio_top, 6),
        expansion_ratio_right: round(expansion_ratio_right, 6),
        expansion_ratio_bottom: round(expansion_ratio_bottom, 6)
      }, {
        action: this.action.extend
      });
      if (result.code === 0) {
        this.handleResult(result.data.image, 'expand')
      } else {
        alert(result?.msg || '操作失败！')
        this.onFinish && this.onFinish()
        throw new Error(result)
      }
    } catch (error: any) {
      this.onFinish && this.onFinish()
    }
  }

  /** 重置所有状态 */
  public resetAll() {
    /** 重置所有实例属性 */
    this.showImageBox = null;
    this.showImage = null;
    this.imagesList = {};
    this.stepList = [];
    this.currentStepIndex = -1;
    this.proportions = 0;
    this.curtainDom = null;
    this.previewDom = null;
    this.previewCurtainDom = null;
    this.remindImageImg = null;
    this.remindImageDom = null;
    this.eraserContainerDom = null;
    this.eraserCanvas = null;
    this.eraser = null;
    this.previewControlContainerDom = null;
    this.defaultImage = null;
    this.isExportOriginal = true;
    this.rawDomSize = null;
    this.originalRatio = { vertical: 0, horizontal: 0 };
    this.isDragCropBox = true;

    /** 重置回调函数 */
    this.onStepChangeCallback = null;
    this.onFinish = null;
    this.realTimeChange = null;
    this.isDev = false;

    /** 重置单例实例 */
    Renderer.instance = new Renderer();
  }
}

export default Renderer.getInstance();
