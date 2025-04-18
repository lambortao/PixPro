// photo-editor.js
import "../css/index.css";
import "../css/AngleAdjustment.css";
import "../css/ColoredBtn.css";
import "../css/SvgIcon.css";
import "../css/AddNewColor.css";

import { controlTextData, cropControlData } from "./config.js";
import useProgressBar from "./useProgressBar.js";
import PhotoStudio from "../../../../src/index";
import "./components/ColoredBtn.js";
import "./components/AngleAdjustment.js";
import "./components/EraserSizeSlider.js";
import "./components/AiLoading.js";
import useColors from "./useColors.js";

class PhotoEditor {
  constructor(
    {
      token = "",
      host = "https://api.pixpro.cc/",
      cropRatios = {
        original: 0,
        "1:1": 1,
        "3:4": 3 / 4,
        "4:3": 4 / 3,
        "9:16": 9 / 16,
        "16:9": 16 / 9,
      },
      fitstImage = null,
      showDownloadBtn = false,
      routes = "/image/processing",
      eraserSize = {
        min: 20,
        max: 100,
        default: 50,
      },
    } = {},
    togglePixProVisible
  ) {
    this.close = togglePixProVisible;
    this.token = token;
    this.host = host;
    this.cropRatios = cropRatios;
    this.fitstImage = fitstImage;
    this.showDownloadBtn = showDownloadBtn;
    this.routes = routes;
    this.eraserSize = eraserSize;
    this.defaultEraserSize = this.eraserSize.default;
    // 初始化状态变量
    this.nowLoading = {
      value: false,
    };
    this.isOperate = false;
    this.nowStep = null;
    this.nowStepList = [];
    this.realTimeStep = null;
    this.nowStepIndex = -1;
    this.width = 0; // 实际图片像素宽度
    this.height = 0; // 实际图片像素高度
    this.imgCurrentWidth = 0; // 当前DOM元素宽度
    this.imgCurrentHeight = 0; // 当前DOM元素高度
    this.originalWidth = 0; // 原始图片宽度
    this.originalHeight = 0; // 原始图片高度
    this.direction = null;
    this.cropRatios = null;
    this.aiLoading = false;
    this.disabledForm = false;
    this.isInit = false;
    this.activeTab = null;
    this.currentColor = "transparent";

    // 初始化DOM引用
    this.photoStudioContainer = null;
    this.controlTitle = null;
    this.controlDesc = null;
    this.controlContent = null;
    this.controlMenu = null;
    this.resolutionText = null;
    this.loadingIcon = null;
    this.progressBar = null;
    this.exportImgBox = null;
    this.exportedImage = null;
    this.imageRotateBox = null;
    this.fullScreenBlocker = null;

    // pixpro实例
    this.imageStudio = null;
    // 初始化颜色管理器
    this.useColorsData = null;
    // this.useColorsData = new useColors(this.handleColorChange.bind(this), this.currentColor);

    // 初始化编辑器
    this.initEditor();
  }

  // 初始化编辑器
  initEditor() {
    this.initPageStructure();
    this.initDOMReferences();
    this.initImageStudio();
    // 延迟执行，初始化图片
    setTimeout(() => {
      if (this.fitstImage) {
        this.imageStudio.uploadFile(this.fitstImage);
      }
    }, 0);
    this.initPage();

    // 初始化颜色管理器
    this.useColorsData = new useColors(this.handleColorChange, this.currentColor);
    /** 进度条相关逻辑 */
    useProgressBar(this.nowLoading);
  }

  // 初始化页面结构
  initPageStructure() {
    // 创建主容器
    const mainElement = document.createElement("main");
    mainElement.className = "editor-main";
    mainElement.id = "editorMain";

    // 创建HTML结构
    mainElement.innerHTML = `
    <div class="pix-pro-container">
      <nav>
        <menu id="controlMenu">
          <span class="menu-bg"></span>
          <div data-tab="crop">
            <img src="./src/img/icon/crop-btn.svg" alt="crop-btn" />
            <span>裁切</span>
          </div>
          <div data-tab="expand">
            <img src="./src/img/icon/expand-btn.svg" alt="expand-btn" />
            <span>扩图</span>
          </div>
          <div data-tab="erase">
            <img src="./src/img/icon/erase-btn.svg" alt="erase-btn" />
            <span>擦除</span>
          </div>
          <div data-tab="remove-bg">
            <img src="./src/img/icon/remove-bg-btn.svg" alt="remove-bg-btn" />
            <span>移除背景</span>
          </div>
          <div data-tab="hd">
            <img src="./src/img/icon/hd-btn.svg" alt="hd-btn" />
            <span>提升解析度</span>
          </div>
          <!-- <div data-tab="compress">
            <img src="./src/img/icon/compress-btn.svg" alt="compress-btn" />
            <span>压缩容量</span>
          </div> -->
        </menu>
        <figure class="logo">
          <img src="./src/img/icon/logo.svg" alt="logo" />
        </figure>
      </nav>

      <div id="controlsContainer" class="controls-container">
        <div class="control-header">
          <h3 id="controlTitle"></h3>
          <small id="controlDesc"></small>
        </div>
        <div class="control-content" id="controlContent">
        </div>
      </div>

      <div class="image-container">
        <header class="image-toolbar">
          <div class="toolbar-status">
            <span id="resolutionText"></span>
          </div>
          <div class="toolbar-box">
            <div class="reset-actions">
              <button data-tab="reset" class="toolbar-btn" id="resetBtn">恢复原图</button>
            </div>
            <div class="step-actions">
              <span>
                <button class="toolbar-btn" data-tab="rollback" id="rollbackBtn">
                  <img src="./src/img/icon/step.svg" alt="step" />
                </button>
              </span>
              <span>
                <button class="toolbar-btn flip" data-tab="forward" id="forwardBtn">
                  <img src="./src/img/icon/step.svg" alt="step" />
                </button>
              </span>
            </div>
            <div class="confirm-actions">
              <span>
                <button class="toolbar-btn primary-text" id="closeProgram">取消</button>
              </span>
              <span>
                <button class="toolbar-btn primary" id="confirmBtn">下载</button>
              </span>
            </div>
          </div>
        </header>
        <div class="image-content">
          <div class="image-box" id="imageBox">
            <ai-loading id="loadingIcon" class="image-loading" style="display: none"></ai-loading>
            <div class="container" id="photoStudioContainer"></div>
            <div id="progressBar" class="main-loading" style="display:none;">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
              <div class="progress-percentage" id="progressPercentage">0%</div>
            </div>
          </div>
          <div id="imageRotateBox" class="image-rotate-box" style="display: none">
          </div>
        </div>
      </div>
    </div>
    <div id="fullScreenBlocker" class="full-screen-blocker" style="display: none"></div>
  `;

    // 创建导出图片容器
    const exportImgBox = document.createElement("div");
    exportImgBox.id = "exportImgBox";
    exportImgBox.className = "export-img-box";
    exportImgBox.style.display = "none";
    exportImgBox.innerHTML = '<img id="exportedImage" src="" alt="" />';

    // 将元素添加到body
    document.body.appendChild(mainElement);
    document.body.appendChild(exportImgBox);

    const toolbarItems = document.querySelectorAll("button[data-tab]");
    toolbarItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tabName = item.getAttribute("data-tab");
        this.handleHeaderControl(tabName);
      });
    });
  }

  // 初始化DOM元素引用
  initDOMReferences() {
    this.photoStudioContainer = document.getElementById("photoStudioContainer");
    this.controlTitle = document.getElementById("controlTitle");
    this.controlDesc = document.getElementById("controlDesc");
    this.controlContent = document.getElementById("controlContent");
    this.controlMenu = document.getElementById("controlMenu");
    this.resolutionText = document.getElementById("resolutionText");
    this.loadingIcon = document.getElementById("loadingIcon");
    this.exportImgBox = document.getElementById("exportImgBox");
    this.exportedImage = document.getElementById("exportedImage");
    this.imageRotateBox = document.getElementById("imageRotateBox");
    this.fullScreenBlocker = document.getElementById("fullScreenBlocker");

    // 为菜单项添加点击事件监听
    const menuItems = this.controlMenu.querySelectorAll("div[data-tab]");
    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tabName = item.getAttribute("data-tab");
        this.switchTab(tabName);
      });
    });
  }

  // 初始化页面
  initPage() {
    // 初始隐藏操作栏
    const controlsContainer = document.getElementById("controlsContainer");
    controlsContainer.style.display = "none";

    // 禁用所有菜单项，对于裁剪选项仅应用禁用样式但保留点击功能
    const menuItems = document.querySelectorAll("#controlMenu > div");
    menuItems.forEach((item) => {
      const tab = item.getAttribute("data-tab");

      if (tab !== "crop") {
        // 非裁剪选项完全禁用
        item.classList.add("disabled");

        // 添加点击事件，防止点击禁用项
        item.addEventListener("click", (e) => {
          if (item.classList.contains("disabled")) {
            console.log("菜单项已禁用，阻止默认动作");
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        });
      } else {
        // 裁剪选项应用禁用样式，但不完全禁用功能
        item.classList.add("disabled-appearance");
      }
    });

    // 禁用工具栏按钮
    const resetBtn = document.getElementById("resetBtn");
    const rollbackBtn = document.getElementById("rollbackBtn");
    const forwardBtn = document.getElementById("forwardBtn");
    const confirmBtn = document.getElementById("confirmBtn");
    const closeProgram = document.getElementById("closeProgram");

    if (!this.showDownloadBtn) {
      confirmBtn.style.display = "none";
    }
    if (closeProgram) {
      closeProgram.addEventListener("click", () => {
        this.handleClose();
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this.handleExportImage());
    }

    if (resetBtn) {
      resetBtn.disabled = true;
      resetBtn.classList.add("disabled");
    }

    if (rollbackBtn) {
      rollbackBtn.disabled = true;
      rollbackBtn.classList.add("disabled");
    }

    if (forwardBtn) {
      forwardBtn.disabled = true;
      forwardBtn.classList.add("disabled");
    }

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.classList.add("disabled");
    }

    // 初始化图片编辑器
    this.initImageStudio("", cropControlData);

    // 默认选中裁剪选项卡
    this.switchTab("crop");

    // 为导出图片框添加点击事件，点击关闭
    this.exportImgBox.addEventListener("click", () => {
      this.exportImgBox.style.display = "none";
    });
  }

  /**
   * 初始化图片编辑器
   * @param {string} userToken - 用户token
   * @param {Object} userCropRatios - 裁剪比例配置
   */
  initImageStudio(userToken = "", userCropRatios = null) {
    this.token = userToken;
    this.cropRatios = userCropRatios;
    if (this.imageStudio) {
      this.imageStudio.resetAll();
      this.imageStudio = null;
    }

    this.imageStudio = new PhotoStudio(this.photoStudioContainer, {
      token: this.token,
      merchantId: "",
      isDev: false,
      host: this.host,
      routes: this.routes,
      eraserSize: this.eraserSize,
      action: {
        extend: "ImageExpansion",
        erase: "LocalizedImageRemoval",
        removeBg: "BackgroundRemoval",
        hd: "EnhanceImageResolution",
      },
      realTimeChange: (step) => {
        console.log(step, "step");

        /** 实时计算宽高 */
        const { currentWidth, currentHeight } = this.getWH(step);

        this.width = currentWidth;
        this.height = currentHeight;
        this.realTimeStep = step;
        this.disabledForm = step.disabledForm ?? false;
        this.imgCurrentWidth = step.currentDomWidth / (step.cdProportions ?? 1);
        this.imgCurrentHeight = step.currentDomHeight / (step.cdProportions ?? 1);

        // 更新分辨率显示
        this.updateResolutionText();

        // 更新尺寸输入字段
        this.updateSizeInputs();

        // 更新界面元素状态
        this.updateUIState();

        // 更新扩图和擦除按钮状态
        if (this.activeTab === "expand") {
          this.updateExpandImageBtnStatus();
        } else if (this.activeTab === "erase") {
          this.updateEraseImageBtnStatus();
        }
      },
      onStepChange: ({ stepList, currentStepIndex }) => {
        const step = stepList[currentStepIndex];
        this.realTimeStep = step;
        this.nowStepList = stepList;
        this.nowStepIndex = currentStepIndex;
        console.log(currentStepIndex, "currentStepIndex");

        this.nowStep = step;
        this.direction = step.direction ?? "vertical";

        // 设置当前颜色
        this.currentColor = this?.nowStepList?.[this?.nowStepIndex]?.bgColor || "transparent";

        const { currentWidth, currentHeight } = this.getWH(step);
        this.width = currentWidth;
        this.height = currentHeight;
        this.imgCurrentWidth = step.currentDomWidth / (step.cdProportions ?? 1);
        this.imgCurrentHeight = step.currentDomHeight / (step.cdProportions ?? 1);

        // 更新分辨率显示
        this.updateResolutionText();

        // 更新尺寸输入字段
        this.updateSizeInputs();

        // 更新界面元素状态
        this.updateUIState();

        // 更新扩图和擦除按钮状态
        if (this.activeTab === "expand") {
          this.updateExpandImageBtnStatus();
        } else if (this.activeTab === "erase") {
          this.updateEraseImageBtnStatus();
        }

        setTimeout(() => {
          this.aiLoading = false;
          this.nowLoading.value = false;
          this.disabledForm = step.disabledForm ?? false;
          if (this.aiLoading) {
            this.hideLoading();
          }
        }, 0);
      },
      onExportImage: (image) => {
        this.exportedImage.src = image;
        this.exportImgBox.style.display = "flex";
        this.handleClose();
      },
      onFinish: () => {
        // 延迟执行，确保进度条有时间显示完成状态
        this.aiLoading = false;
        this.nowLoading.value = false;

        if (!this.isInit) {
          this.isInit = true;

          // 启用所有菜单项
          const menuItems = document.querySelectorAll("#controlMenu > div");
          menuItems.forEach((item) => {
            item.classList.remove("disabled");
            item.classList.remove("disabled-appearance");
          });

          // 启用裁剪比例按钮
          const cropRatioBtns = document.querySelectorAll(".crop-ratios .icon-btn");
          cropRatioBtns.forEach((btn) => {
            btn.classList.remove("disabled");
          });

          // 启用翻转按钮
          const flipBtns = document.querySelectorAll(".flip-btn button");
          flipBtns.forEach((btn) => {
            btn.disabled = false;
          });

          // 启用确认按钮
          const confirmBtn = document.getElementById("confirmBtn");
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove("disabled");
          }

          this.triggerCropRatio();
        }
      },
      onUpload: () => {
        this.nowLoading.value = true;
        this.isOperate = true;
        // 显示操作栏
        const controlsContainer = document.getElementById("controlsContainer");
        controlsContainer.style.display = "flex";
        // 显示角度调整组件
        if (this.activeTab === "crop") {
          this.renderAngleAdjustment();
          this.imageRotateBox.style.display = "block";
        }
        this.aiLoading = true;
      },
      onEraserSizeChange: (size) => {
        this.eraserSize.default = size;
        this.defaultEraserSize = size;
      },
    });
  }

  /**
   * 获取实时的宽高
   */
  getWH(step) {
    const wMultiplied = step.currentDomWidth / step.cropBoxWidth;
    const hMultiplied = step.currentDomHeight / step.cropBoxHeight;
    return {
      currentWidth: Math.round(step.rawImgWidth / (wMultiplied ?? 1)),
      currentHeight: Math.round(step.rawImgHeight / (hMultiplied ?? 1)),
    };
  }

  /**
   * 更新分辨率文本显示
   */
  updateResolutionText() {
    if (this.resolutionText) {
      this.resolutionText.textContent = "目标图片分辨率：" + `${this.width} x ${this.height}`;
    }
  }

  /**
   * 更新尺寸输入字段显示
   */
  updateSizeInputs() {
    const widthInput = document.getElementById("widthInput");
    const heightInput = document.getElementById("heightInput");

    if (widthInput && heightInput) {
      widthInput.value = Math.round(this.width);
      heightInput.value = Math.round(this.height);
    }
  }

  /**
   * 更新UI状态
   */
  updateUIState() {
    // 更新前进后退按钮状态
    const rollbackBtn = document.getElementById("rollbackBtn");
    const forwardBtn = document.getElementById("forwardBtn");

    if (rollbackBtn) {
      console.log(this.nowStepIndex, "this.nowStepIndex");

      rollbackBtn.disabled = this.nowStepIndex < 1;
      rollbackBtn.classList.toggle("disabled", this.nowStepIndex < 1);
    }

    if (forwardBtn) {
      forwardBtn.disabled = this.nowStepIndex >= this.nowStepList.length - 1;
      forwardBtn.classList.toggle("disabled", this.nowStepIndex >= this.nowStepList.length - 1);
    }

    // 更新确认按钮状态
    const confirmBtn = document.getElementById("confirmBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (confirmBtn) {
      confirmBtn.disabled = this.disabledForm;
      confirmBtn.classList.toggle("disabled", this.disabledForm);
    }

    if (resetBtn) {
      resetBtn.disabled = this.nowStepIndex < 1;
      resetBtn.classList.toggle("disabled", this.nowStepIndex < 1);
    }

    // 更新扩图和擦除按钮状态
    if (this.activeTab === "expand") {
      this.updateExpandImageBtnStatus();
    } else if (this.activeTab === "erase") {
      this.updateEraseImageBtnStatus();
    }
  }

  /**
   * 显示加载中
   */
  showLoading() {
    // 计算loading图标的位置和大小
    const imageBox = document.getElementById("imageBox");
    const imageBoxWidth = imageBox?.offsetWidth ?? 0;
    const imageBoxHeight = imageBox?.offsetHeight ?? 0;
    const cropBoxWidth = this.realTimeStep?.cropBoxWidth ?? 0;
    const cropBoxHeight = this.realTimeStep?.cropBoxHeight ?? 0;

    // 设置loading图标的样式
    this.loadingIcon.style.width = `${cropBoxWidth}px`;
    this.loadingIcon.style.height = `${cropBoxHeight}px`;
    this.loadingIcon.style.left = `${(imageBoxWidth - cropBoxWidth) / 2}px`;
    this.loadingIcon.style.top = `${(imageBoxHeight - cropBoxHeight) / 2}px`;

    // 使用新方法更新内部图片尺寸
    this.loadingIcon.updateSize(cropBoxWidth, cropBoxHeight);

    // 添加fade-enter-from类
    this.loadingIcon.classList.add("fade-enter-from");
    this.loadingIcon.style.display = "flex";

    // 强制回流后添加fade-enter-active类
    requestAnimationFrame(() => {
      this.loadingIcon.classList.remove("fade-enter-from");
      this.loadingIcon.classList.add("fade-enter-active");
    });

    this.fullScreenBlocker.style.display = "block";
  }

  /**
   * 隐藏加载中
   */
  hideLoading() {
    // 添加fade-leave-to类
    this.loadingIcon.classList.add("fade-leave-to");
    this.loadingIcon.classList.add("fade-leave-active");

    // 等待动画结束后隐藏元素
    setTimeout(() => {
      this.loadingIcon.style.display = "none";
      this.loadingIcon.classList.remove("fade-leave-to", "fade-leave-active", "fade-enter-active");
      this.fullScreenBlocker.style.display = "none";
    }, 300);
  }

  /**
   * 切换标签页
   */
  /**
   * 计算菜单背景色块的位置
   */
  updateMenuBgStyle() {
    const menuItems = Object.keys(controlTextData);
    const activeIndex = menuItems.indexOf(this.activeTab);

    let top = 0;
    if (activeIndex !== -1) {
      /** 菜单项高度 */
      /** 菜单项高度 (12px * 2 + 20px) */
      const itemHeight = 44;
      /** 菜单项间距 */
      const itemMargin = 5;
      top = activeIndex * (itemHeight + itemMargin);
    }

    const menuBg = document.querySelector("#controlMenu .menu-bg");
    if (menuBg) {
      menuBg.style.transform = `translateY(${top}px)`;
    }
  }

  ratioBgStyle() {
    const ratioBg = document.querySelector(".crop-ratios .ratio-bg");
    if (!ratioBg) return;

    // 检查nowStepList和nowStepIndex是否存在且有效
    if (!this.nowStepList || this.nowStepIndex === -1 || !this.nowStepList[this.nowStepIndex]) {
      ratioBg.style.display = "none";
      return;
    }

    const currentStep = this.nowStepList[this.nowStepIndex];

    if (!currentStep.cropRationLabel || currentStep.cropRationLabel === "none") {
      ratioBg.style.display = "none";
      return;
    }

    ratioBg.style.display = "block";
    const ratioItems = document.querySelectorAll(".crop-ratios .icon-btn");
    const activeRatioIndex = Array.from(ratioItems).findIndex((item) => item.classList.contains("active"));

    let top = 0;
    if (activeRatioIndex !== -1) {
      /** 比例项高度 */
      const itemHeight = 36;
      /** 比例项间距 */
      const itemMargin = 5;
      top = activeRatioIndex * (itemHeight + itemMargin);
    }

    ratioBg.style.transform = `translateY(${top}px)`;
  }

  switchTab(tabName) {
    // 获取菜单项元素
    const menuItem = document.querySelector(`#controlMenu > div[data-tab="${tabName}"]`);

    // 检查是否为禁用的菜单项
    if (menuItem && menuItem.classList.contains("disabled")) {
      console.log("菜单项已禁用，无法切换");
      return;
    }

    // 在没有上传图片时不允许切换标签页
    if (!this.isInit && tabName !== "crop") {
      console.log("未上传图片，无法切换到非裁剪标签");
      return;
    }

    if (this.activeTab === tabName) return;

    // 清理旧的角度调整组件
    if (this.imageRotateBox) {
      // 更新菜单背景色块位置

      this.imageRotateBox.innerHTML = "";
      this.imageRotateBox.style.display = "none";
    }

    // 更新活动标签
    const oldTab = this.activeTab;
    this.activeTab = tabName;
    // 更新菜单背景色块位置
    this.updateMenuBgStyle();

    // 更新菜单项的激活状态
    const menuItems = this.controlMenu.querySelectorAll("div");
    menuItems.forEach((item) => {
      const tab = item.getAttribute("data-tab");
      if (tab === tabName) {
        item.classList.add("active");
        // 只有在已上传图片时(isInit为true)，才移除裁剪选项的禁用外观
        if (tab === "crop" && item.classList.contains("disabled-appearance") && this.isInit) {
          item.classList.remove("disabled-appearance");
        }
      } else {
        item.classList.remove("active");
      }
    });

    // 更新控制面板标题和描述
    if (controlTextData[tabName]) {
      this.controlTitle.textContent = controlTextData[tabName].title;
      this.controlDesc.textContent = controlTextData[tabName].desc;
    }

    // 根据标签类型渲染不同的控制内容
    this.renderControlContent(tabName);

    // 切换模式
    if (this.imageStudio && this.nowStep) {
      const oldMode = oldTab || "view";
      if (oldMode !== tabName) {
        this.switchMode({ oldMode, newMode: tabName });

        // 参考Vue版本，在切换到擦除模块时，添加延时设置擦除大小，避免卡住
        if (tabName === "erase") {
          // 延迟500ms设置擦除大小，确保UI完全渲染
          setTimeout(() => {
            const eraserSizeInput = document.getElementById("eraserSizeInput");
            if (eraserSizeInput) {
              const size = parseInt(eraserSizeInput.value, 10);
              this.setEraserSize(size);
            }
          }, 500);
        }
      }
    }

    // 当切换到扩展或擦除标签时，更新对应按钮状态
    if (tabName === "expand") {
      setTimeout(() => this.updateExpandImageBtnStatus(), 0);
    } else if (tabName === "erase") {
      setTimeout(() => this.updateEraseImageBtnStatus(), 0);
    }

    // 显示或隐藏角度调整组件
    if (tabName === "crop" && this.isOperate) {
      setTimeout(() => {
        this.renderAngleAdjustment();
        this.imageRotateBox.style.display = "block";
      }, 100);
    }
  }

  /**
   * 渲染控制内容
   */
  renderControlContent(tabName) {
    controlContent.innerHTML = "";

    switch (tabName) {
      case "crop":
        this.renderCropControls();
        break;
      case "expand":
        this.renderExpandControls();
        break;
      case "erase":
        this.renderEraseControls();
        break;
      case "remove-bg":
        this.renderRemoveBgControls();
        break;
      case "hd":
        this.renderHdControls();
        break;
      // case "compress":
      //   this.renderCompressControls();
      //   break;
    }
  }

  /**
   * 渲染裁剪控制
   */
  renderCropControls() {
    const cropControlsHtml = `
    <div class="crop">
      <div class="section" id="cropRatiosSection">
        
        <div class="crop-ratios">
        <div class="ratio-bg"></div>
          ${Object.entries(cropControlData)
            .map(
              ([label, ratio], index) => `
            <div class="icon-btn ${!this.isInit ? "disabled" : ""} ${this.cropRatios && this.cropRatios.label === label ? "active" : ""}" 
                  data-ratio="${ratio}" data-label="${label}">
              ${
                label === "original"
                  ? `
                <figure><img src="./src/img/icon/original.svg" alt="原比例"></figure>
                <span>原比例</span>
              `
                  : `
                <figure><i style="${this.getRatioStyle(ratio)}"></i></figure>
                <span>${label}</span>
              `
              }
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      <div class="section">
        <div class="size-inputs">
          <div class="input-group">
            <label>宽度 (像素)</label>
            <input type="number" id="widthInput" value="${this.width}" disabled>
          </div>
          <div class="input-group">
            <label>高度 (像素)</label>
            <input type="number" id="heightInput" value="${this.height}" disabled>
          </div>
        </div>
      </div>
      <div class="section flip-btn">
        <button title="左翻转" data-direction="left" ${!this.isInit ? "disabled" : ""}><img src="./src/img/icon/flip-l.svg" alt="左翻转"></button>
        <button title="右翻转" data-direction="right" ${!this.isInit ? "disabled" : ""}><img src="./src/img/icon/flip-r.svg" alt="右翻转"></button>
        <button title="上下翻转" data-direction="y" ${!this.isInit ? "disabled" : ""}><img src="./src/img/icon/flip-x.svg" alt="上下翻转"></button>
        <button title="左右翻转" data-direction="x" ${!this.isInit ? "disabled" : ""}><img src="./src/img/icon/flip-y.svg" alt="左右翻转"></button>
      </div>
    </div>
  `;

    this.controlContent.innerHTML = cropControlsHtml;

    // 添加裁剪比例按钮事件监听
    const cropRatioBtns = this.controlContent.querySelectorAll(".icon-btn");
    cropRatioBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // 如果按钮被禁用，则不执行任何操作
        if (!this.isInit || btn.classList.contains("disabled")) {
          return;
        }

        const ratio = parseFloat(btn.getAttribute("data-ratio"));
        const label = btn.getAttribute("data-label");
        this.handleCropRatio({ ratio: isNaN(ratio) ? null : ratio, label });

        // 更新按钮状态
        cropRatioBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        // 更新菜单背景色块位置
        this.ratioBgStyle();
      });
    });

    // 添加翻转按钮事件监听
    const flipBtns = this.controlContent.querySelectorAll(".flip-btn button");
    flipBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // 如果按钮被禁用，则不执行任何操作
        if (!this.isInit || btn.disabled) {
          return;
        }

        const direction = btn.getAttribute("data-direction");
        if (direction === "left" || direction === "right") {
          this.turn(direction);
        } else {
          this.flip(direction);
        }
      });
    });

    // 如果没有选中任何比例，默认选中第一个
    // if (!this.cropRatios) {
    //   const firstBtn = cropRatioBtns[0];
    //   if (firstBtn) {
    //     const ratio = parseFloat(firstBtn.getAttribute("data-ratio"));
    //     const label = firstBtn.getAttribute("data-label");
    //     this.handleCropRatio({ ratio: isNaN(ratio) ? null : ratio, label });
    //     firstBtn.classList.add("active");
    //   }
    // }

    // 更新菜单背景色块位置
    this.ratioBgStyle();
  }

  /**
   * 获取比例图标样式
   */
  getRatioStyle(ratio) {
    const MAX_SIZE = 17; // 最大尺寸
    const BORDER_WIDTH = 2; // 边框宽度
    const BORDER_RADIUS = 3; // 圆角大小

    let width, height;

    if (ratio >= 1) {
      // 宽大于等于高
      width = MAX_SIZE;
      height = MAX_SIZE / ratio;
    } else {
      // 高大于宽
      height = MAX_SIZE;
      width = MAX_SIZE * ratio;
    }

    return `display: inline-block; width: ${width}px; height: ${height}px; border: ${BORDER_WIDTH}px solid; border-radius: ${BORDER_RADIUS}px; box-sizing: border-box;`;
  }

  /**
   * 渲染扩图控制
   */
  renderExpandControls() {
    const expandControlsHtml = `
      <div class="crop">
        <div class="section">
        <div class="crop-ratios">
          <div class="ratio-bg"></div>
          ${Object.entries(cropControlData)
            .map(
              ([label, ratio], index) => `
            <div class="icon-btn ${!this.isInit ? "disabled" : ""} ${this.cropRatios && this.cropRatios.label === label ? "active" : ""}" 
                  data-ratio="${ratio}" data-label="${label}">
              ${
                label === "original"
                  ? `
                <figure><img src="./src/img/icon/original.svg" alt="原比例"></figure>
                <span>原比例</span>
              `
                  : `
                <figure><i style="${this.getRatioStyle(ratio)}"></i></figure>
                <span>${label}</span>
              `
              }
            </div>
          `
            )
            .join("")}
        </div>
          <div class="size-inputs">
            <div class="input-group">
              <label>宽度 (像素)</label>
              <input type="number" id="widthInput" value="${this.width}" disabled>
            </div>
            <div class="input-group">
              <label>高度 (像素)</label>
              <input type="number" id="heightInput" value="${this.height}" disabled>
            </div>
          </div>
        </div>
        
        <div class="section">
          <colored-btn id="expandImageBtn" text="扩展图片"></colored-btn>
          <small id="expandWarning" style="display: none">原图图片分辨率需大于 300 x 300 且小于 3000 x 3000 才能扩图。</small>
        </div>
      </div>
    `;

    this.controlContent.innerHTML = expandControlsHtml;

    // 添加扩图比例点击事件和背景滑块动画
    const ratioItems = document.querySelectorAll(".crop-ratios .icon-btn");
    ratioItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.classList.contains("disabled")) return;

        // 更新选中状态
        ratioItems.forEach((btn) => btn.classList.remove("active"));
        item.classList.add("active");

        // 更新裁切比例
        const ratio = item.getAttribute("data-ratio");
        const label = item.getAttribute("data-label");
        this.handleCropRatio({ ratio, label });

        // 更新背景滑块位置
        this.ratioBgStyle();
      });
    });

    // 添加尺寸输入事件监听
    const widthInput = document.getElementById("widthInput");
    const heightInput = document.getElementById("heightInput");

    widthInput.addEventListener("change", () => {
      this.width = parseInt(widthInput.value, 10);
      this.handleSizeChange("width");
    });

    heightInput.addEventListener("change", () => {
      this.height = parseInt(heightInput.value, 10);
      this.handleSizeChange("height");
    });

    // 添加扩图按钮事件监听
    const expandImageBtn = document.getElementById("expandImageBtn");

    expandImageBtn.addEventListener("click", () => {
      // 检查是否可以扩图（判断是否有选择裁剪区域）
      const expandDisabled = !this.realTimeStep || (parseFloat(this.realTimeStep.cropBoxHeight.toFixed(4)) === parseFloat(this.realTimeStep.fenceMinHeight.toFixed(4)) && parseFloat(this.realTimeStep.cropBoxWidth.toFixed(4)) === parseFloat(this.realTimeStep.fenceMinWidth.toFixed(4)) && this.realTimeStep.xDomOffset === 0 && this.realTimeStep.yDomOffset === 0);

      if (expandDisabled) {
        // 未选择裁剪区域，无法扩图
        console.log("未选择裁剪区域，无法扩图");
        return;
      }
      this.handleExpandImage();
    });

    // 更新扩图按钮状态
    this.updateExpandImageBtnStatus();

    // 初始化背景滑块位置
    this.ratioBgStyle();
  }

  /**
   * 更新扩图按钮状态
   */
  updateExpandImageBtnStatus() {
    const expandImageBtn = document.getElementById("expandImageBtn");
    if (!expandImageBtn) return;

    // 检查是否可以扩图 - 参考Vue版本的实现方式
    const expandDisabled = !this.realTimeStep || (parseFloat(this.realTimeStep.cropBoxHeight.toFixed(4)) === parseFloat(this.realTimeStep.fenceMinHeight.toFixed(4)) && parseFloat(this.realTimeStep.cropBoxWidth.toFixed(4)) === parseFloat(this.realTimeStep.fenceMinWidth.toFixed(4)) && this.realTimeStep.xDomOffset === 0 && this.realTimeStep.yDomOffset === 0);

    if (expandDisabled) {
      expandImageBtn.classList.add("disabled");
    } else {
      expandImageBtn.classList.remove("disabled");
    }
  }

  /**
   * 渲染擦除控制
   */

  renderEraseControls() {
    const eraseControlsHtml = `
      <div class="erase">
        <div class="section">
          <eraser-size-slider id="eraserSizeSlider" size="20" min="20" max="100"></eraser-size-slider>
          <colored-btn id="eraseImageBtn" text="清除物件"></colored-btn>
          <small id="eraseWarning" style="display: none">图片分辨率需大于 300 x 300 且小于 3000 x 3000 才能擦除。</small>
        </div>
      </div>
    `;

    this.controlContent.innerHTML = eraseControlsHtml;

    // 添加擦除大小滑块事件监听
    const eraserSizeSlider = document.getElementById("eraserSizeSlider");
    if (eraserSizeSlider) {
      eraserSizeSlider.setAttribute("min", this.eraserSize?.min);
      eraserSizeSlider.setAttribute("max", this.eraserSize?.max);
      eraserSizeSlider.setAttribute("size", this.defaultEraserSize);
      eraserSizeSlider.addEventListener("size-change", (event) => {
        this.setEraserSize(event.detail);
      });
    }

    // 添加擦除按钮事件监听
    const eraseImageBtn = document.getElementById("eraseImageBtn");
    if (eraseImageBtn) {
      eraseImageBtn.addEventListener("click", () => {
        // 检查是否可以擦除（判断是否有选择区域）
        const eraseDisabled = !this.realTimeStep?.erasePoints?.length;

        if (eraseDisabled) {
          // 未选择区域，无法擦除
          console.log("未选择擦除区域，无法擦除");
          return;
        }
        this.eraseImage();
      });
    }

    // 更新擦除按钮状态
    this.updateEraseImageBtnStatus();
  }

  /**
   * 更新擦除按钮状态
   */
  updateEraseImageBtnStatus() {
    const eraseImageBtn = document.getElementById("eraseImageBtn");
    if (!eraseImageBtn) return;

    // 检查是否可以擦除 - 参考Vue版本，正确的判断应该是有擦除点才能触发
    const eraseDisabled = !this.realTimeStep?.erasePoints?.length;

    if (eraseDisabled) {
      eraseImageBtn.classList.add("disabled");
    } else {
      eraseImageBtn.classList.remove("disabled");
    }
  }

  /**
   * 渲染移除背景控制
   */
  // 改变背景颜色
  handleColorChange = (color) => {
    this.setHandleColorChange(color);
  };
  setHandleColorChange = (color) => {
    if (this.imageStudio) {
      this.imageStudio.setRemoveBgColor(color);
    }
    this.useColorsData.currentColor = color;
    // 添加删除按钮事件监听
    const closeIcons = this.controlContent.querySelectorAll(".close-icon");
    closeIcons.forEach((icon) => {
      const color = icon.getAttribute("data-color");
      if (this.useColorsData.localColorList.includes(color) && color !== this.useColorsData.currentColor) {
        icon.style.display = "block";
      } else {
        icon.style.display = "none";
      }
    });
  };

  renderRemoveBgControls = () => {
    const removeBgControlsHtml = `
    <div class="remove-bg">
      <div class="section">
        <colored-btn id="removeBgBtn" text="一键移除"></colored-btn>
        <small id="removeBgWarning" style="display: none">宽低于 300px 或高低于 300px，无法一键移除背景。</small>
        <span class="line"></span>
        <div class="color-list">
          <small>背景颜色</small>
          <div class="color-box">
            ${this.useColorsData.allColorsList
              .map(
                (color) => `
              <div class="color-item ${color === "transparent" ? "transparent" : ""} ${color === this.useColorsData.currentColor ? "active" : ""}" 
                   data-color="${color}">
                <span style="background-color: ${color};"></span>
                <div class="close-icon" data-color="${color}">
                  <img src="./src/img/icon/close.svg" alt="crop-btn" />
                </div>
                
              </div>
            `
              )
              .join("")}
              <div class="add-color-item add-btn">
    <span id="addIcons">
     <img src="./src/img/icon/add.svg" alt="crop-btn" />
    </span>
    <div class="color-select" style="display:none">
      <p>点击色块选择颜色</p>
      <input type="color" id="inputRef">
      <footer>
        <button id="colorConfirmBtn" class="toolbar-btn primary">确认</button>
        <button id="cancelBtn"  class="toolbar-btn">取消</button>
      </footer>
    </div>
  </div>
          </div>
        </div>
      </div>
    </div>
  `;

    this.controlContent.innerHTML = removeBgControlsHtml;
    // 添加按钮
    const addIcons = document.getElementById("addIcons");
    // 颜色选择框
    const colorSelect = document.querySelector(".color-select");
    // 颜色输入框
    const inputRef = document.getElementById("inputRef");
    // 确认按钮
    const colorConfirmBtn = document.getElementById("colorConfirmBtn");
    // 取消按钮
    const cancelBtn = document.getElementById("cancelBtn");

    // 打开颜色选择框
    addIcons.addEventListener("click", () => {
      colorSelect.style.display = "block";
    });
    // 确认事件
    colorConfirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const color = inputRef.value;
      this.useColorsData.handleAddNewColor(color);
      colorSelect.style.display = "none";
      inputRef.value = "";
      // 重新渲染颜色列表
      this.renderRemoveBgControls();
    });
    // 取消事件
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      colorSelect.style.display = "none";
    });
    // 点击document的时候关闭颜色选择框
    document.addEventListener("click", (e) => {
      // 如果点击的是 #addIcons 或其子元素，则退出
      if (addIcons.contains(e.target) || colorSelect.contains(e.target)) {
        return;
      }
      colorSelect.style.display = "none";
    });
    // 添加颜色按钮事件监听
    const colorItems = this.controlContent.querySelectorAll(".color-item");
    colorItems.forEach((item) => {
      item.addEventListener("click", () => {
        const color = item.getAttribute("data-color");

        this.handleColorChange(color);

        // 更新按钮状态
        colorItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
      });
    });
    // 添加删除按钮事件监听
    const closeIcons = this.controlContent.querySelectorAll(".close-icon");
    closeIcons.forEach((icon) => {
      const color = icon.getAttribute("data-color");

      if (this.useColorsData.localColorList.includes(color) && color !== this.useColorsData.currentColor) {
        icon.style.display = "block";
      } else {
        icon.style.display = "none";
      }
      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        this.useColorsData.removeLocalColorStorage(color);
        // 重新渲染颜色列表
        this.renderRemoveBgControls();
      });
    });
    // 添加移除背景按钮事件监听
    const removeBgBtn = document.getElementById("removeBgBtn");
    removeBgBtn.addEventListener("click", () => {
      this.handleRemoveBg();
    });
  };

  /**
   * 渲染提升解析度控制
   */
  renderHdControls() {
    const hdControlsHtml = `
    <div class="hd">
      <div class="section">
        <colored-btn id="hdBtn" text="一键提升"></colored-btn>
        <small id="hdWarning" style="display: none">图片分辨率需大于 300 x 300 且小于 3000 x 3000 才能提升解析度。</small>
      </div>
    </div>
  `;

    this.controlContent.innerHTML = hdControlsHtml;

    // 添加提升解析度按钮事件监听
    const hdBtn = document.getElementById("hdBtn");
    hdBtn.addEventListener("click", () => {
      this.handleHd();
    });
  }

  /**
   * 渲染压缩容量控制
   */
  renderCompressControls() {
    const compressControlsHtml = `
    <div class="compress">
      <div class="section">
        <colored-btn id="compressBtn" text="一键压缩"></colored-btn>
      </div>
    </div>
  `;

    this.controlContent.innerHTML = compressControlsHtml;

    // 添加压缩容量按钮事件监听
    const compressBtn = document.getElementById("compressBtn");
    compressBtn.addEventListener("click", () => {
      // 实现压缩功能
    });
  }

  /**
   * 触发裁剪比例
   */
  triggerCropRatio() {
    // 判断是否需要自动触发裁剪比例
    if (this.cropRatios && Object.keys(this.cropRatios).length > 0) {
      // 若cropRatios中只有一个比例，直接使用
      if (Object.keys(this.cropRatios).length === 1) {
        const label = Object.keys(this.cropRatios)[0];
        const ratio = this.cropRatios[label];
        console.log("触发比例裁剪", ratio, label);
        // this.handleCropRatio({ ratio, label, isTrigger: false });
      } else {
        // 如果有多个比例，默认使用第一个
        const label = Object.keys(this.cropRatios)[0];
        const ratio = this.cropRatios[label];
        // this.handleCropRatio({ ratio, label, isTrigger: false });
      }

      // 更新UI显示
      setTimeout(() => {
        const cropRatioSection = document.getElementById("cropRatiosSection");
        if (cropRatioSection) {
          const buttons = cropRatioSection.querySelectorAll(".icon-btn");
          // 移除所有active类
          buttons.forEach((btn) => btn.classList.remove("active"));

          // 默认选中第一个按钮
          if (buttons.length > 0) {
            buttons[0].classList.add("active");
            this.ratioBgStyle();
          }
        }
      }, 100);
    } else if (cropControlData && Object.keys(cropControlData).length > 0) {
      // 使用默认的裁剪比例
      const label = Object.keys(cropControlData)[0];
      const ratio = cropControlData[label];
      this.handleCropRatio({ ratio, label, isTrigger: false });

      // 更新UI显示
      setTimeout(() => {
        const cropRatioSection = document.getElementById("cropRatiosSection");
        if (cropRatioSection) {
          const buttons = cropRatioSection.querySelectorAll(".icon-btn");
          // 移除所有active类
          buttons.forEach((btn) => btn.classList.remove("active"));

          // 默认选中第一个按钮
          if (buttons.length > 0) {
            buttons[0].classList.add("active");
            this.ratioBgStyle();
          }
        }
      }, 100);
    }
  }

  // 处理图片尺寸变化
  handleSizeChange(direction) {
    if (this.imageStudio) {
      this.imageStudio.setWidthAndHeight(this.width, this.height, direction);
    }
  }
  /**
   * 处理关闭操作
   */

  handleClose() {
    // 实现关闭处理逻辑
    if (this.imageStudio) {
      this.imageStudio.resetAll();
      this.imageStudio = null;
    }
    // 重置UI状态;
    // this.activeTab = null;
    // 隐藏导出图片框;
    this.exportImgBox.style.display = "none";

    console.log("111111");
    const mainElement = document.getElementById("editorMain");
    document.body.removeChild(mainElement);
    this.close(false);
  }

  // 导出图片
  handleExportImage() {
    if (this.imageStudio) {
      // exportImage()
      this.imageStudio.downloadImage();
    }
  }

  handleRotate(angle) {
    if (this.imageStudio) {
      this.imageStudio.rotate(Number(angle));
    }
  }

  rollback() {
    if (this.imageStudio) {
      this.imageStudio.rollback();
    }
  }

  forward() {
    if (this.imageStudio) {
      this.imageStudio.forward();
    }
  }

  reset() {
    if (this.imageStudio) {
      this.imageStudio.reset();
    }
  }

  flip(direction) {
    if (this.imageStudio) {
      this.imageStudio.flip(direction);
    }
  }

  handleCropRatio(ratioData) {
    if (this.imageStudio) {
      this.cropRatios = ratioData;
      this.imageStudio.cropRatio(ratioData);
    }
  }

  turn(direction) {
    if (this.imageStudio) {
      this.imageStudio.turn(direction);
    }
  }

  async handleExpandImage() {
    console.log("扩图");

    if (this.imageStudio) {
      this.aiLoading = true;
      this.showLoading();
      this.imageStudio.expandImageBtn();
    }
  }

  eraseImage() {
    if (this.imageStudio) {
      this.aiLoading = true;
      this.showLoading();
      this.imageStudio.eraseImage();
    }
  }

  setEraserSize(size) {
    if (this.imageStudio) {
      this.imageStudio.setEraserSize(size);
    }
  }

  handleRemoveBg() {
    if (this.imageStudio) {
      this.aiLoading = true;
      this.showLoading();
      this.imageStudio.removeBg();
    }
  }

  handleHd() {
    if (this.imageStudio) {
      this.aiLoading = true;
      this.showLoading();
      this.imageStudio.hd();
    }
  }

  switchMode({ oldMode, newMode }) {
    if (oldMode === newMode) return;
    console.log("切换模式", oldMode, newMode);
    if (this.imageStudio) {
      this.imageStudio.switchMode(oldMode, newMode);
      this.aiLoading = true;
      this.nowLoading.value = true;
    }
  }

  handleHeaderControl(action) {
    switch (action) {
      case "reset":
        this.reset();
        break;
      case "rollback":
        this.rollback();
        break;
      case "forward":
        this.forward();
        break;
    }
  }

  renderAngleAdjustment() {
    const angleAdjustment = document.createElement("angle-adjustment");
    angleAdjustment.setAttribute("angle", this.realTimeStep?.rotate || 0);
    angleAdjustment.setAttribute("max-angle", 180);

    // 监听角度变化事件
    angleAdjustment.addEventListener("change", (e) => {
      this.handleRotate(e.detail.angle);
    });

    // 监听提醒图片显示/隐藏事件
    angleAdjustment.addEventListener("handle-remind-image", (e) => {
      this.imageStudio?.toogleRemindImage(e.detail.visible);
    });

    // 清空并添加新的角度调整组件
    this.imageRotateBox.innerHTML = "";
    this.imageRotateBox.appendChild(angleAdjustment);
  }
}

// 挂载到全局
window.PhotoEditor = PhotoEditor;
export default PhotoEditor;
