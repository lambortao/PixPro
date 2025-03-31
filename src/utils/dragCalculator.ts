import render from './event';
import type { IDrawCanvasInfo, IDraggableGripper } from '@/types/IType';

/** 拖拽计算 */
export default class DragBoundaryCalculator {
  /** 拖拽初始数据，该数据不会随着拖拽而改变 */
  private currentStepStartInfo: IDrawCanvasInfo;
  /** 渲染数据，该数据会随着拖拽而改变 */
  private renderStep: IDrawCanvasInfo;
  /** 当前裁剪比例 */
  private cropRatio: number | null;
  /** 是否允许拖拽 */
  private isAllowDrag: boolean;

  constructor(
    currentStepStartInfo: IDrawCanvasInfo,
    renderStep: IDrawCanvasInfo
  ) {
    this.currentStepStartInfo = { ...currentStepStartInfo };
    this.renderStep = renderStep;
    this.renderStep.controlMode = 'drag'
    /** 裁剪比例 */
    /** 裁剪比例为指定比例，则使用指定比例 */
    this.cropRatio = null;
    /** 是否允许拖拽 */
    this.isAllowDrag = true;
  }

  private allowTop = true
  // private allowRight = true
  // private allowBottom = true
  // private allowLeft = true

  /** 边界检查 */
  public checkBoundary(gripper: IDraggableGripper) {
    const nowMode = this.renderStep.mode
    /** 最大允许宽度 */
    let maxAllowWidth = 0
    /** 最大允许高度 */
    let maxAllowHeight = 0
    /** 最小允许宽度 */
    let minAllowWidth = 0
    /** 最小允许高度 */
    let minAllowHeight = 0

    /** 裁剪模式的时候设置最大和最小宽高 */
    if (nowMode === 'crop') {
      /** 最大允许宽度 */
      // maxAllowWidth = (this.renderStep.fenceMaxWidth ?? 0) - (this.renderStep.xDomOffset ?? 0)
      maxAllowWidth = Math.min(this.renderStep.fenceMaxWidth ?? 0, this.renderStep.currentDomWidth - (this.renderStep.xDomOffset ?? 0))
      /** 最大允许高度 */
      // maxAllowHeight = (this.renderStep.fenceMaxHeight ?? 0) - (this.renderStep.yDomOffset ?? 0)
      maxAllowHeight = Math.min(this.renderStep.fenceMaxHeight ?? 0, this.renderStep.currentDomHeight - (this.renderStep.yDomOffset ?? 0))
      /** 最小允许宽度 */
      minAllowWidth = this.renderStep.fenceMinWidth!
      /** 最小允许高度 */
      minAllowHeight = this.renderStep.fenceMinHeight!

      /** 固定比例情况下的宽高限制计算 */
      if (this.cropRatio) {
        switch (gripper) {
          case 'b': {
            const newMaxHeight = maxAllowWidth / this.cropRatio!
            maxAllowHeight = newMaxHeight > maxAllowHeight ? maxAllowHeight : newMaxHeight
            break;
          }
          case 't': {
            const newMaxHeight = maxAllowWidth / this.cropRatio!
            maxAllowHeight = newMaxHeight > maxAllowHeight ? maxAllowHeight : newMaxHeight
            break;
          }
          case 'r': {
            const newMinWidth = minAllowHeight * this.cropRatio!
            const newMaxWidth = maxAllowHeight * this.cropRatio!
            minAllowWidth = newMinWidth > minAllowWidth ? newMinWidth : minAllowWidth
            maxAllowWidth = newMaxWidth > maxAllowWidth ? maxAllowWidth : newMaxWidth
            break;
          }
          case 'l': {
            const newMinWidth = minAllowHeight * this.cropRatio!
            const newMaxWidth = maxAllowHeight * this.cropRatio!
            minAllowWidth = newMinWidth > minAllowWidth ? newMinWidth : minAllowWidth
            maxAllowWidth = newMaxWidth > maxAllowWidth ? maxAllowWidth : newMaxWidth
            break;
          }
        }
      }
    }

    /** 扩图模式 */
    if (nowMode === 'expand') {
      /** 图片的实时宽 - x 轴偏移量 - 裁切框偏移量 */
      maxAllowWidth = this.renderStep.fenceMaxWidth!
      /** 图片的实时高 - y 轴偏移量 - 裁切框偏移量 */
      maxAllowHeight = this.renderStep.fenceMaxHeight!
      /** 最小允许宽度 */
      minAllowWidth = this.renderStep.fenceMinWidth!
      /** 最小允许高度 */
      minAllowHeight = this.renderStep.fenceMinHeight!
    }
    
    /** 顶部拖拽 */
    if (gripper === 't') {
      if (nowMode === 'expand') {
        const currentDomHeight = this.renderStep.currentDomHeight
        const nowYDomOffset = this.renderStep.yDomOffset!
        const bottomBound = this.currentStepStartInfo.cropBoxHeight - this.currentStepStartInfo.currentDomHeight - Math.abs(this.currentStepStartInfo.yDomOffset ?? 0)

        if (this.cropRatio) {
          /** 扩图模式顶部拖拽在等比例的情况下要考虑右侧边框 */
          const maxRightBound = this.renderStep.cropBoxWidth! - this.renderStep.currentDomWidth! - Math.abs(this.renderStep.xDomOffset ?? 0)
          // console.log('右边框实时距离大于图片宽度', round(maxRightBound, 5), round(this.renderStep.currentDomWidth!, 5))
          if (maxRightBound > this.renderStep.currentDomWidth!) {
            console.log('右边框实时距离大于图片宽度', maxRightBound, this.renderStep.currentDomWidth)
            // this.allowTop = false
          } else {
            // this.allowTop = true
          }
        }

        if (Math.abs(nowYDomOffset) > currentDomHeight) {
          this.renderStep.yDomOffset = -currentDomHeight
          this.renderStep.cropBoxHeight = currentDomHeight + bottomBound + Math.abs(currentDomHeight)
          this.renderStep.moveY = -(currentDomHeight - (this.currentStepStartInfo.cropBoxHeight - currentDomHeight - bottomBound))
        }
        if (nowYDomOffset >= 0) {
          this.renderStep.yDomOffset = 0
          this.renderStep.cropBoxHeight = currentDomHeight + bottomBound
          this.renderStep.moveY = this.currentStepStartInfo.cropBoxHeight - currentDomHeight - bottomBound
        }
        
      } else if (nowMode === 'crop') {
        /** 底部的初始间隙 */
        const bottomBound = this.currentStepStartInfo.currentDomHeight - (this.currentStepStartInfo.yDomOffset ?? 0) - this.currentStepStartInfo.cropBoxHeight!

        /** 不允许 y 轴偏移量小于 0 */
        if (this.renderStep.yDomOffset! < 0) {
          this.renderStep.yDomOffset = 0
          this.renderStep.moveY = -(this.currentStepStartInfo.yDomOffset ?? 0)
          this.renderStep.cropBoxHeight = this.currentStepStartInfo.cropBoxHeight + (this.currentStepStartInfo.yDomOffset ?? 0)
        }

        /** 不能超过最大允许高度 */
        if (this.renderStep.cropBoxHeight! > maxAllowHeight) {
          this.renderStep.cropBoxHeight = maxAllowHeight
          this.renderStep.yDomOffset = this.currentStepStartInfo.currentDomHeight - maxAllowHeight - bottomBound
          this.renderStep.moveY = -(maxAllowHeight - this.currentStepStartInfo.cropBoxHeight)
        }

        /** 最小高度 */
        if (this.renderStep.cropBoxHeight! < minAllowHeight) {
          this.renderStep.cropBoxHeight = minAllowHeight
          const nowYDomOffset = this.currentStepStartInfo.cropBoxHeight + (this.currentStepStartInfo.yDomOffset ?? 0) - minAllowHeight
          this.renderStep.yDomOffset = nowYDomOffset
          this.renderStep.moveY = nowYDomOffset - (this.currentStepStartInfo.yDomOffset ?? 0)
        }

        /** 比例裁剪 */
        if (this.cropRatio) {
          /** 先用老数据算出额外 y 轴偏移量 */
          const extraY = this.currentStepStartInfo.currentDomHeight - ((this.currentStepStartInfo.yDomOffset ?? 0) + this.currentStepStartInfo.cropBoxHeight!)
          /** 再用新数据算出最小 y 轴偏移量 */
          const nowMixYDomOffset = this.renderStep.currentDomHeight - (extraY + maxAllowHeight)
          if ((this.renderStep.yDomOffset ?? 0) < nowMixYDomOffset) {
            this.renderStep.yDomOffset = nowMixYDomOffset
            this.renderStep.moveY = nowMixYDomOffset - (this.currentStepStartInfo.yDomOffset ?? 0)
          }
          /** 总的偏移量不能超过最大允许高度 */
          if (this.renderStep.cropBoxHeight! > maxAllowHeight) {
            this.renderStep.cropBoxHeight = maxAllowHeight
          }
        }
      }
    }
    /** 底部拖拽 */
    if (gripper === 'b') {
      /** 最大高度 */
      if (this.renderStep.cropBoxHeight! > maxAllowHeight) {
        this.renderStep.cropBoxHeight = maxAllowHeight
      }
      /** 最小高度 */
      if (this.renderStep.cropBoxHeight! < minAllowHeight) {
        this.renderStep.cropBoxHeight = minAllowHeight
      }
      if (nowMode === 'expand') {
        if (this.cropRatio) {
          /** 扩图模式顶部拖拽在等比例的情况下要考虑右侧边框 */
          const maxRightBound = this.renderStep.cropBoxWidth! - this.renderStep.currentDomWidth! - Math.abs(this.renderStep.xDomOffset ?? 0)
          // console.log('右边框实时距离大于图片宽度', round(maxRightBound, 5), round(this.renderStep.currentDomWidth!, 5))
          if (maxRightBound > this.renderStep.currentDomWidth!) {
            console.log('右边框实时距离大于图片宽度', maxRightBound, this.renderStep.currentDomWidth)
            // this.allowTop = false
          } else {
            // this.allowTop = true
          }
        }
        const maxHeight = this.renderStep.currentDomHeight * 2 + Math.abs(this.renderStep.yDomOffset ?? 0)
        const minHeight = this.renderStep.currentDomHeight + Math.abs(this.renderStep.yDomOffset ?? 0)
        if (this.renderStep.cropBoxHeight! > maxHeight) {
          this.renderStep.cropBoxHeight = maxHeight
        }
        if (this.renderStep.cropBoxHeight! < minHeight) {
          this.renderStep.cropBoxHeight = minHeight
        }
      }
    }
    /** 右拖拽 */
    if (gripper === 'r') {
      /** 最大宽度 */
      if (this.renderStep.cropBoxWidth! > maxAllowWidth) {
        this.renderStep.cropBoxWidth = maxAllowWidth
      }
      /** 最小宽度 */
      if (this.renderStep.cropBoxWidth! < minAllowWidth) {
        this.renderStep.cropBoxWidth = minAllowWidth
      }
      if (nowMode === 'expand') {
        const maxWidth = this.renderStep.currentDomWidth * 2 + Math.abs(this.renderStep.xDomOffset ?? 0)
        const minWidth = this.renderStep.currentDomWidth + Math.abs(this.renderStep.xDomOffset ?? 0)
        if (this.renderStep.cropBoxWidth! > maxWidth) {
          this.renderStep.cropBoxWidth = maxWidth
        }
        if (this.renderStep.cropBoxWidth! < minWidth) {
          this.renderStep.cropBoxWidth = minWidth
        }
      }
    }
    /** 左拖拽 */
    if (gripper === 'l') {
      if (nowMode === 'expand') {
        const currentDomWidth = this.renderStep.currentDomWidth
        const nowXDomOffset = this.renderStep.xDomOffset!
        const rightBound = this.currentStepStartInfo.cropBoxWidth - this.currentStepStartInfo.currentDomWidth - Math.abs(this.currentStepStartInfo.xDomOffset ?? 0)

        if (Math.abs(nowXDomOffset) > currentDomWidth) {
          this.renderStep.xDomOffset = -currentDomWidth
          this.renderStep.cropBoxWidth = currentDomWidth + rightBound + Math.abs(currentDomWidth)
          this.renderStep.moveX = -(currentDomWidth - (this.currentStepStartInfo.cropBoxWidth - currentDomWidth - rightBound))
        }
        if (nowXDomOffset >= 0) {
          this.renderStep.xDomOffset = 0
          this.renderStep.cropBoxWidth = currentDomWidth + rightBound
          this.renderStep.moveX = this.currentStepStartInfo.cropBoxWidth - currentDomWidth - rightBound
        }
      } else if (nowMode === 'crop') {
        /** 右侧的初始间隙 */
        const rightBound = this.currentStepStartInfo.currentDomWidth - (this.currentStepStartInfo.xDomOffset ?? 0) - this.currentStepStartInfo.cropBoxWidth!
        /** 最大宽度 */
        if (this.renderStep.xDomOffset! < 0) {
          this.renderStep.xDomOffset = 0
          this.renderStep.moveX = -(this.currentStepStartInfo.xDomOffset ?? 0)
          this.renderStep.cropBoxWidth = this.currentStepStartInfo.cropBoxWidth + (this.currentStepStartInfo.xDomOffset ?? 0)
        }
        
        /** 不能超过最大允许宽度 */
        if (this.renderStep.cropBoxWidth! > maxAllowWidth) {
          this.renderStep.cropBoxWidth = maxAllowWidth
          this.renderStep.xDomOffset = this.currentStepStartInfo.currentDomWidth - maxAllowWidth - rightBound
          this.renderStep.moveX = -(maxAllowWidth - this.currentStepStartInfo.cropBoxWidth)
        }
        /** 最小宽度 */
        if (this.renderStep.cropBoxWidth! < minAllowWidth) {
          this.renderStep.cropBoxWidth = minAllowWidth
          const nowXDomOffset = this.currentStepStartInfo.cropBoxWidth + (this.currentStepStartInfo.xDomOffset ?? 0) - minAllowWidth
          this.renderStep.xDomOffset = nowXDomOffset
          this.renderStep.moveX = nowXDomOffset - (this.currentStepStartInfo.xDomOffset ?? 0)
        }
      }

      /** 比例裁剪 */
      if (this.cropRatio) {
        if (this.renderStep.cropBoxWidth! > maxAllowWidth) {
          this.renderStep.cropBoxWidth = maxAllowWidth
        }
        /** 先用老数据算出额外 x 轴偏移量 */
        const extraX = this.currentStepStartInfo.currentDomWidth - ((this.currentStepStartInfo.xDomOffset ?? 0) + this.currentStepStartInfo.cropBoxWidth!)
        /** 再用新数据算出最小 x 轴偏移量 */
        const nowMixXDomOffset = this.renderStep.currentDomWidth - (extraX + maxAllowWidth)
        if ((this.renderStep.xDomOffset ?? 0) < nowMixXDomOffset) {
          this.renderStep.xDomOffset = nowMixXDomOffset
          this.renderStep.moveX = nowMixXDomOffset - (this.currentStepStartInfo.xDomOffset ?? 0)
        }
      }
    }
    /** 拖拽主体 */
    if (gripper === 'body') {
      if (nowMode === 'crop') {
        /** 左边界 */
        if ((this.renderStep.xDomOffset ?? 0) <= 0) {
          this.renderStep.xDomOffset = 0
        }
        /** 上边界 */
        if ((this.renderStep.yDomOffset ?? 0) <= 0) {
          this.renderStep.yDomOffset = 0
        }
        
        /** 最大围栏宽度 */
        const maxFenceWidth = Math.max(this.renderStep.currentDomWidth, this.renderStep.fenceMaxWidth)
        /** 最大围栏高度 */
        const maxFenceHeight = Math.max(this.renderStep.currentDomHeight, this.renderStep.fenceMaxHeight)

        const maxXOffset = maxFenceWidth - (this.renderStep.cropBoxWidth ?? 0)
        const maxYOffset = maxFenceHeight - (this.renderStep.cropBoxHeight ?? 0)

        /** 右边界 */
        if ((this.renderStep.xDomOffset ?? 0) > maxXOffset) {
          this.renderStep.xDomOffset = maxXOffset
        }
        /** 下边界 */
        if ((this.renderStep.yDomOffset ?? 0) > maxYOffset) {
          this.renderStep.yDomOffset = maxYOffset
        }
      } else if (nowMode === 'expand') {
        /** 在扩图模式下，主体不允许拖拽 */
        return
        // /** 左边界 */
        // if ((this.renderStep.xDomOffset ?? 0) >= 0) {
        //   this.renderStep.xDomOffset = 0
        // }
        // /** 上边界 */
        // if ((this.renderStep.yDomOffset ?? 0) >= 0) {
        //   this.renderStep.yDomOffset = 0
        // }

        // const maxXOffset = this.renderStep.cropBoxWidth! - (this.renderStep.currentDomWidth ?? 0)
        // const maxYOffset = this.renderStep.cropBoxHeight! - (this.renderStep.currentDomHeight ?? 0)
        // /** 右边界 */
        // if (Math.abs(this.renderStep.xDomOffset ?? 0) > maxXOffset) {
        //   this.renderStep.xDomOffset = -maxXOffset
        // }
        // /** 下边界 */
        // if (Math.abs(this.renderStep.yDomOffset ?? 0) > maxYOffset) {
        //   this.renderStep.yDomOffset = -maxYOffset
        // }

        /** 计算老的右边界 */
        // const oldRightBound = this.currentStepStartInfo.cropBoxWidth - this.currentStepStartInfo.currentDomWidth - Math.abs(this.currentStepStartInfo.xDomOffset ?? 0)
        // /** 基于老的右边界计算 x 轴的最小偏移量 */
        // const minXOffset = Math.abs(this.currentStepStartInfo.xDomOffset!) - ((this.currentStepStartInfo.currentDomWidth ?? 0) - oldRightBound)

        // console.log('oldRightBound', oldRightBound, minXOffset, this.renderStep.xDomOffset)

        // const leftBoundary = Math.min(0, minXOffset)

        /** 左边的边界最大不能超过左边框 */
        // if ((this.renderStep.xDomOffset ?? 0) >= leftBoundary) {
        //   this.renderStep.xDomOffset = leftBoundary
        // }
        // if ((this.renderStep.xDomOffset ?? 0) >= minXOffset) {
        //   this.renderStep.xDomOffset = minXOffset
        // }

        // /** x 轴最大不能超过图片的宽度 */
        // if (Math.abs(this.renderStep.xDomOffset ?? 0) > this.renderStep.currentDomWidth) {
        //   this.renderStep.xDomOffset = -this.renderStep.currentDomWidth
        // }
      

        /** 计算老的下边界 */
        // const oldBottomBound = this.currentStepStartInfo.cropBoxHeight - this.currentStepStartInfo.currentDomHeight - Math.abs(this.currentStepStartInfo.yDomOffset ?? 0)
        // /** 基于老的下边界计算 y 轴的最小偏移量 */
        // const minYOffset = this.renderStep.cropBoxHeight! - (this.renderStep.currentDomHeight ?? 0) - oldBottomBound

        // /** 下边的边界最小不能超过下边框，并且需要考虑位移的情况 */
        // if ((this.renderStep.yDomOffset ?? 0) >= -minYOffset) {
        //   this.renderStep.yDomOffset = -minYOffset
        // }
        // /** y 轴最大不能超过图片的高度 */
        // if (Math.abs(this.renderStep.yDomOffset ?? 0) > this.renderStep.currentDomHeight) {
        //   this.renderStep.yDomOffset = -this.renderStep.currentDomHeight
        // }
      }
    }
  }

  public resetAllow() {
    this.allowTop = true
    // this.allowRight = true
    // this.allowBottom = true
    // this.allowLeft = true
  }

  /** 
   * 拖拽动作
   */
  public drag(gripper: IDraggableGripper, moveX: number, moveY: number) {
    this.isAllowDrag = true
    this.cropRatio = this.currentStepStartInfo.cropRatio!
    switch (gripper) {
      /** 拖拽主体 */
      case 'body':
        if (this.renderStep.mode === 'crop') {
          const nowXDomOffset = this.currentStepStartInfo.xDomOffset! - moveX
          const nowYDomOffset = this.currentStepStartInfo.yDomOffset! - moveY
          this.renderStep.xDomOffset = nowXDomOffset
          this.renderStep.yDomOffset = nowYDomOffset
          this.checkBoundary('body')
        }
        break;
      /** 底部拖拽 */
      case 'b': {
        /** 锁定比例裁剪 */
        if (this.cropRatio) {
          const nowWidth = this.renderStep.cropBoxHeight * this.cropRatio!
          this.renderStep.cropBoxWidth = nowWidth
          this.checkBoundary('r')
        }
        /** 计算是否允许拖拽 */
        const nowHeight = this.currentStepStartInfo.cropBoxHeight + moveY
        this.renderStep.cropBoxHeight = nowHeight
        this.renderStep.moveY = moveY
        this.checkBoundary('b')
        break;
      }
      /** 右拖拽 */
      case 'r': {
        /** 锁定比例裁剪 */
        if (this.cropRatio) {
          const nowHeight = this.renderStep.cropBoxWidth / this.cropRatio!
          this.renderStep.cropBoxHeight = nowHeight
          this.checkBoundary('b')
        }
        const nowWidth = this.currentStepStartInfo.cropBoxWidth + moveX
        this.renderStep.cropBoxWidth = nowWidth
        this.renderStep.moveX = moveX
        this.checkBoundary('r')
        break;
      }
      /** 右下角拖拽 */
      case 'br': {
        this.renderStep.moveX = moveX
        this.renderStep.moveY = moveY
        /** 锁定比例裁剪 */
        if (this.cropRatio) {
          /** 以宽度为主导数据，高度由宽度和比例计算得出 */
          const nowWidth = this.currentStepStartInfo.cropBoxWidth + moveX
          const nowHeight = nowWidth / this.cropRatio!
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
        } else {
          const nowWidth = this.currentStepStartInfo.cropBoxWidth + moveX
          const nowHeight = this.currentStepStartInfo.cropBoxHeight + moveY
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
        }
        this.checkBoundary('b')
        this.checkBoundary('r')
        break;
      }
      /** 左侧拖拽 */
      case 'l': {
        /** 锁定比例裁剪 */
        if (this.cropRatio) {
          const nowHeight = this.renderStep.cropBoxWidth / this.cropRatio!
          this.renderStep.cropBoxHeight = nowHeight
          this.checkBoundary('b')
        }
        const nowWidth = this.currentStepStartInfo.cropBoxWidth - moveX
        const nowXDomOffset = (this.currentStepStartInfo.xDomOffset ?? 0) + moveX
        this.renderStep.cropBoxWidth = nowWidth
        this.renderStep.xDomOffset = nowXDomOffset
        this.renderStep.moveX = moveX
        this.checkBoundary('l')
        break;
      }
      /** 左下角拖拽 */
      case 'bl': {
        /** 锁定比例裁剪 */
        if (this.cropRatio) {
          const nowWidth = this.currentStepStartInfo.cropBoxWidth - moveX
          const nowHeight = nowWidth / this.cropRatio!
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.xDomOffset = (this.currentStepStartInfo.xDomOffset ?? 0) + moveX
        } else {
          const nowWidth = this.currentStepStartInfo.cropBoxWidth - moveX
          const nowHeight = this.currentStepStartInfo.cropBoxHeight + moveY
          const nowXDomOffset = (this.currentStepStartInfo.xDomOffset ?? 0) + moveX
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.xDomOffset = nowXDomOffset
        }
        this.renderStep.moveX = moveX
        this.renderStep.moveY = moveY
        this.checkBoundary('b')
        this.checkBoundary('l')
        break;
      }
      /** 顶部拖拽 */
      case 't': {
        /** 锁定比例裁剪 */
        if (this.cropRatio) {
          const nowWidth = this.renderStep.cropBoxHeight * this.cropRatio!
          this.renderStep.cropBoxWidth = nowWidth
          this.checkBoundary('r')
        }
        if (this.allowTop) {
          const nowHeight = this.currentStepStartInfo.cropBoxHeight - moveY
          const nowYDomOffset = (this.currentStepStartInfo.yDomOffset ?? 0) + moveY
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.yDomOffset = nowYDomOffset
          this.renderStep.moveY = moveY
          this.checkBoundary('t')
        }
        break;
      }
      /** 左上角拖拽 */
      case 'tl': {
        if (this.cropRatio) {
          // 等比例模式下，只基于左边框计算
          const nowWidth = this.currentStepStartInfo.cropBoxWidth - moveX
          const nowHeight = nowWidth / this.cropRatio
          const nowXDomOffset = (this.currentStepStartInfo.xDomOffset ?? 0) + moveX
          
          // 计算Y轴偏移：基于高度变化来计算
          const heightDiff = this.currentStepStartInfo.cropBoxHeight - nowHeight
          const nowYDomOffset = (this.currentStepStartInfo.yDomOffset ?? 0) + heightDiff
          
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.xDomOffset = nowXDomOffset
          this.renderStep.yDomOffset = nowYDomOffset
          this.renderStep.moveX = moveX
          this.renderStep.moveY = heightDiff
        } else {
          // 非等比例模式，保持原有逻辑
          const nowWidth = this.currentStepStartInfo.cropBoxWidth - moveX
          const nowXDomOffset = (this.currentStepStartInfo.xDomOffset ?? 0) + moveX
          const nowHeight = this.currentStepStartInfo.cropBoxHeight - moveY
          const nowYDomOffset = (this.currentStepStartInfo.yDomOffset ?? 0) + moveY
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.xDomOffset = nowXDomOffset
          this.renderStep.yDomOffset = nowYDomOffset
          this.renderStep.moveX = moveX
          this.renderStep.moveY = moveY
        }
        
        this.checkBoundary('l')
        this.checkBoundary('t')
        break;
      }
      /** 右上角拖拽 */
      case 'tr': {
        if (this.cropRatio) {
          // 等比例模式下，只基于右边框计算
          const nowWidth = this.currentStepStartInfo.cropBoxWidth + moveX
          const nowHeight = nowWidth / this.cropRatio
          
          // 计算Y轴偏移：基于高度变化来计算
          const heightDiff = this.currentStepStartInfo.cropBoxHeight - nowHeight
          const nowYDomOffset = (this.currentStepStartInfo.yDomOffset ?? 0) + heightDiff
          
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.yDomOffset = nowYDomOffset
          this.renderStep.moveX = moveX
          this.renderStep.moveY = heightDiff
        } else {
          // 非等比例模式，保持原有逻辑
          const nowHeight = this.currentStepStartInfo.cropBoxHeight - moveY
          const nowWidth = this.currentStepStartInfo.cropBoxWidth + moveX
          const nowYDomOffset = (this.currentStepStartInfo.yDomOffset ?? 0) + moveY
          this.renderStep.cropBoxHeight = nowHeight
          this.renderStep.cropBoxWidth = nowWidth
          this.renderStep.yDomOffset = nowYDomOffset
          this.renderStep.moveX = moveX
          this.renderStep.moveY = moveY
        }
        
        this.checkBoundary('r')
        this.checkBoundary('t')
        break;
      }
    }
    if (this.isAllowDrag) {
      this.renderStep.gripper = gripper
      render.changeCurtainBox(this.renderStep, gripper)
    }
  }
}
