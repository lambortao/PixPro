import type { IDraggableGripper, IDrawCanvasInfo, IDomSize } from '@/types/IType';
import WeakTip from './weakTip';
import render from './event';
import { DRAG_GRIPPER_NAME, SCALE_GRANULARITY, THROTTLE_TIME } from '../config/constants';
import { calculateImageZoom, removeClass, round, getCropBoxAndAttachmentWH, calculateMinWH } from './utils';
import DragBoundaryCalculator from './dragCalculator';
import { startStepInfo } from '@/config/default'
import { debounce } from 'lodash-es';

/** 拖拽操作基础 */
class DragHandler {
  private static instance: DragHandler | null = null;
  /** 拖拽的把手 */
  private gripperActiveElement: HTMLElement | null = null;
  /** 拖拽的把手类型 */
  private gripperActive: IDraggableGripper | null = null;
  /** 是否正在拖拽 */
  private isMoving = false;
  /** 开始拖拽的坐标 */
  private startPoint = { x: 0, y: 0 };
  /** 当前拖拽的坐标 */
  private mousePoint = { x: 0, y: 0 };
  /** requestAnimationFrame 渲染步骤 */
  private rafId: number | null = null;
  /** 容器 */
  private containerRect: DOMRect;
  /** 预览父框体的 dom 实例 */
  public previewDom: HTMLElement | null = null;
  /** 操作框体的 dom 实例 */
  public curtainDom: HTMLElement | null = null;
  /** 预览窗帘的 dom 实例 */
  public previewCurtainDom: HTMLElement | null = null;
  /** 提醒图片的父级 dom 实例 */
  public remindImageDom: HTMLElement | null = null;
  /** 框体原始宽高 */
  private rawDomSize: IDomSize | null = null;
  /** canvas DOM */
  private canvasDom: HTMLImageElement | null = null;
  /** 当前正在操作步骤的数据，也就是需要渲染的步骤，该数据会随着拖动而改变 */
  private renderStep: IDrawCanvasInfo | null = null;
  /**
   * 当前步骤的起始数据，不会随着拖动而改变
   * 会在拖动开始时赋值，拖动时用户计算，拖动结束后重置
   */
  private currentStepStartInfo: IDrawCanvasInfo = { ...startStepInfo };

  /** 允许缩放 */
  private isAllowZoom = true;

  private nowXDomOffset = 0;
  private nowYDomOffset = 0;

  private dragBoundaryCalculator: DragBoundaryCalculator | null = null;

  /** 鼠标缩放提示的 DOM 实例 */
  private mouseZoomTipDom: HTMLElement | null = null;
  /** 是否已经显示过鼠标缩放提示 */
  private hasShownMouseZoomTip = false;

  private constructor(container: HTMLElement, canvas: HTMLImageElement) {
    this.containerRect = container.getBoundingClientRect();
    this.canvasDom = canvas;
    this.initEvents();
  }

  /** 获取实例 */
  public static getInstance(container: HTMLElement, canvas: HTMLImageElement): DragHandler {
    if (!DragHandler.instance) {
      DragHandler.instance = new DragHandler(container, canvas);
    } else {
      // 重新初始化现有实例
      DragHandler.instance.containerRect = container.getBoundingClientRect();
      DragHandler.instance.canvasDom = canvas;
      DragHandler.instance.initEvents();
    }
    return DragHandler.instance;
  }

  /** 初始化事件 */
  private initEvents() {
    this.previewDom = document.querySelector('.preview-container') as HTMLElement;
    this.curtainDom = document.querySelector('.control-container') as HTMLElement;
    this.previewCurtainDom = document.querySelector('#preview-curtain-box') as HTMLElement;
    this.remindImageDom = document.querySelector('#remind-image') as HTMLElement;
    this.mouseZoomTipDom = document.querySelector('#mouse-zoom-tip') as HTMLElement;
    
    /** 销毁所有事件 */
    this.destroy();
    
    /** 添加事件 */
    if (this.curtainDom) {
      this.curtainDom.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
    }
  }

  /** 初始化拖拽体 */
  public initDragBoundaryCalculator(rawDomSize: IDomSize) {
    this.rawDomSize = rawDomSize;
    
    /** 销毁所有事件 */
    this.destroy();
    
    /** 添加事件 */
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    if (this.curtainDom) {
      this.curtainDom.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
    }
    
    this.updateRenderStep();

    this.dragBoundaryCalculator = new DragBoundaryCalculator(
      this.currentStepStartInfo,
      this.renderStep as IDrawCanvasInfo
    );
  }

  /** 更新当前步骤的数据 */
  private updateRenderStep() {
    /** 初始化当前步骤的数据，该数据会随着拖动变化 */
    this.renderStep = { ...render.getNowStep() };
    /** 设置当前步骤的起始数据，该数据不会随着操作而改变 */
    this.currentStepStartInfo = { ...this.renderStep };
  }

  /** 鼠标按下 */
  private onMouseDown(e: MouseEvent) {
    /** 获取按下的实例，判断是否为拖拽把手 */
    const target = e.target as HTMLElement;
    const gripperType = target.dataset.draggable as IDraggableGripper;
    if (!gripperType && !DRAG_GRIPPER_NAME.includes(gripperType)) return;

    this.updateRenderStep()
    /** 设置拖拽把手 */
    this.gripperActiveElement = target;
    this.gripperActive = gripperType;

    /** 设置拖动状态 */
    this.isMoving = true;

    /** 显示提醒图片 */
    render.toogleRemindImage(true)

    /** 设置拖动起点 */
    this.mousePoint = { x: e.clientX, y: e.clientY };
    this.nowXDomOffset = this.renderStep!.xDomOffset ?? 0;
    this.nowYDomOffset = this.renderStep!.yDomOffset ?? 0;
    e.preventDefault();

    /** 实例化 DragBoundaryCalculator */
    this.dragBoundaryCalculator = new DragBoundaryCalculator(
      this.currentStepStartInfo,
      this.renderStep as IDrawCanvasInfo
    );
  }

  /** 鼠标移动 */
  private onMouseMove(e: MouseEvent) {
    if (!this.isMoving || !this.gripperActive) return;

    /** 使用 requestAnimationFrame 的话，如果人手的速度大于屏幕刷新率，则会出现鼠标抬起在鼠标移动之后执行的问题 */
    // if (this.rafId) {
    //   cancelAnimationFrame(this.rafId);
    // }

    // this.rafId = requestAnimationFrame(() => {
    //   const moveX = e.clientX - this.mousePoint.x;
    //   const moveY = e.clientY - this.mousePoint.y;

    //   this.dragBoundaryCalculator?.drag && this.dragBoundaryCalculator.drag(this.gripperActive!, moveX, moveY);
    // });
    const moveX = e.clientX - this.mousePoint.x;
    const moveY = e.clientY - this.mousePoint.y;
    this.dragBoundaryCalculator?.drag && this.dragBoundaryCalculator.drag(this.gripperActive!, moveX, moveY);

    e.preventDefault();
  }

  /** 鼠标抬起 */
  private onMouseUp(e: MouseEvent) {
    if (!this.isMoving || !this.gripperActive || !this.renderStep) return;
    /** 隐藏提醒图片 */
    render.toogleRemindImage(false);
    if (
      (this.renderStep.cropBoxHeight !== this.currentStepStartInfo.cropBoxHeight ||
      this.renderStep.cropBoxWidth !== this.currentStepStartInfo.cropBoxWidth) &&
      this.renderStep.mode === 'crop'
    ) {
      /** 显示鼠标缩放提示 */
      // this.showMouseZoomTip();
      const weakTip = new WeakTip({
        text: '请滚动鼠标滚轮以缩放图片',
        duration: 5000,
        fadeOutDuration: 200,
        storageKey: 'PIXPRO_MOUSE_ZOOM_COUNT',
        maxShowCount: 3
      })
      weakTip.show()
    }
    if (this.gripperActive === 'body') {
      removeClass(this.canvasDom as Element, 'hide');
    }
    if (this.renderStep.mode === 'crop') {
      /** 这里要进行图片放大 */
      this.renderStep = getCropBoxAndAttachmentWH(this.renderStep as IDrawCanvasInfo, this.rawDomSize as IDomSize)
    }

    this.dragBoundaryCalculator?.resetAllow()

    /** 拖拽结束后将当前数据添加到步骤 */
    render.handleStepList(this.renderStep as IDrawCanvasInfo);

    /** 设置当前步骤的 dom 最终形态 */
    render.setNowStepDom(this.renderStep as IDrawCanvasInfo);


    this.isMoving = false;
    this.gripperActiveElement = null;
    this.gripperActive = null;
    e.preventDefault();
  }

  /** 滚动是否开始 */
  private isWheelStart = false;
  /** 滚动开始的初始步骤 */
  private wheelStartStep: IDrawCanvasInfo | null = null;

  /** 鼠标滚轮 */
  private onMouseWheel(e: WheelEvent) {
    /** 获取按下的实例，判断是否为拖拽把手 */
    const target = e.target as HTMLElement;
    const gripperType = target.dataset.draggable as IDraggableGripper;
    /** 更新当前步骤 */
    this.updateRenderStep()
    if (gripperType === 'body' && this.renderStep?.mode === 'crop') {
      if (!this.isWheelStart) {
        this.isWheelStart = true;
        this.wheelStartStep = { ...this.renderStep };
      }

      /** 滚动逻辑 */
      this.mouseWheel(e);
      /** 滚动结束后将当前数据添加到步骤，使用防抖函数 */
      this.debouncedHandleStepList();
    }
    e.preventDefault();
  }

  /** 防抖操作步骤 - 只在操作结束后执行一次 */
  public debouncedHandleStepList = debounce(() => {
    /** 使用初始方法重置滚动步骤 */
    render.updateNowStep({ ...this.wheelStartStep as IDrawCanvasInfo });
    /** 添加新的步骤 */
    render.handleStepList({ ...this.renderStep as IDrawCanvasInfo });
    /** 重置滚动状态 */
    this.isWheelStart = false;
  }, THROTTLE_TIME);

  /** 鼠标滚动操作 */
  public mouseWheel(e: WheelEvent) {
    /** 获取滚轮方向 */
    const scale = e.deltaY > 0 ? -SCALE_GRANULARITY : SCALE_GRANULARITY;

    /** 当前的缩放 */
    let nowZoom = round(this.currentStepStartInfo.zoom! + scale, 2)

    const maxZoom = (this.renderStep?.currentDomWidth ?? 0) / (this.renderStep?.fenceMinWidth ?? 0)

    /** 如果当前缩放大于最大缩放，则将缩放设置为最大缩放 */
    if (nowZoom > maxZoom) {
      nowZoom = maxZoom
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.renderStep!.controlMode = 'zoom'

    /** 计算新的宽高 */
    const {
      width: newWidth,
      height: newHeight,
      offsetX,
      offsetY
    } = calculateImageZoom(this.renderStep as IDrawCanvasInfo, nowZoom, mouseX, mouseY)

    /** 设置新的宽高 */
    this.renderStep!.currentDomWidth = newWidth
    this.renderStep!.currentDomHeight = newHeight
    /** 设置新的偏移量 */
    this.renderStep!.xDomOffset = (this.renderStep!.xDomOffset ?? 0) + offsetX
    this.renderStep!.yDomOffset = (this.renderStep!.yDomOffset ?? 0) + offsetY
    /** 设置新的缩放倍数 */
    this.renderStep!.zoom = nowZoom
    /** 设置拖拽把手 */
    this.renderStep!.gripper = 'zoom'
    
    /** 缩放之后设置电子围栏 */
    /** 最大允许宽高，图片和围栏的宽高取最小值 */
    this.renderStep!.fenceMaxWidth = Math.min((this.rawDomSize!.width ?? 0), newWidth)
    this.renderStep!.fenceMaxHeight = Math.min((this.rawDomSize!.height ?? 0), newHeight)
    /** 最小允许宽高 */
    const { minWidth, minHeight } = calculateMinWH(this.renderStep as IDrawCanvasInfo)
    this.renderStep!.fenceMinWidth = minWidth
    this.renderStep!.fenceMinHeight = minHeight

    this.checkBoundary()

    /** 实时变化 */
    render.handleRealTimeChange(this.renderStep as IDrawCanvasInfo)

    /** 应用参数 */
    render.changeImageSize(this.renderStep as IDrawCanvasInfo)
  }

  /** 缩放和检查边界 */
  private checkBoundary() {
    const {
      xDomOffset,
      yDomOffset,
      currentDomWidth,
      currentDomHeight,
      rawDomHeight,
      rawDomWidth,
      cropBoxHeight,
      cropBoxWidth,
      zoom
    } = this.renderStep as IDrawCanvasInfo

    /**
     * 最小缩放尺寸
     * 1. 先获取当前裁切框体与原图的缩放比例，并取宽高的最小缩放比（如果不等于1说明裁切框体被修改过）
     * 2. 对比当前缩放比，如果小于最小缩放比，则将缩放比设置为最小缩放比
     */
    const heightZoom = cropBoxHeight / rawDomHeight
    const widthZoom = cropBoxWidth / rawDomWidth
    const minZoom = Math.min(heightZoom, widthZoom)
    if ((zoom ?? 1) < minZoom) {
      this.renderStep!.zoom = minZoom
    }

    /** 缩放过程中的边界检查 */
    const currentY = currentDomHeight - cropBoxHeight
    const currentX = currentDomWidth - cropBoxWidth
    if ((xDomOffset ?? 0) < 0) {
      this.renderStep!.xDomOffset = 0
    }
    if ((xDomOffset ?? 0) > currentX) {
      this.renderStep!.xDomOffset = currentX
    }
    if ((yDomOffset ?? 0) < 0) {
      this.renderStep!.yDomOffset = 0
    }
    if ((yDomOffset ?? 0) > currentY) {
      this.renderStep!.yDomOffset = currentY
    }
  }

  /** 重置单例实例 */
  public static resetInstance(): void {
    if (DragHandler.instance) {
      DragHandler.instance.destroy();
      DragHandler.instance = null;
    }
  }

  /** 销毁所有监听事件 */
  public destroy() {
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    if (this.curtainDom) {
      this.curtainDom.removeEventListener('wheel', this.onMouseWheel);
    }
  }
}

export default DragHandler.getInstance;
/** 导出重置方法 */
export const resetDragHandlerInstance = DragHandler.resetInstance;
