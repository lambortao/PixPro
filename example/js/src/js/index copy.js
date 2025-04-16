// 引入样式文件
import "../css/index.css";
import "../css/AngleAdjustment.css";
import "../css/ColoredBtn.css";
import "../css/EraserSizeSlider.css";
import "../css/SvgIcon.css";
import "../css/AddNewColor.css";

// 引入配置文件
import { controlTextData, cropControlData } from "./config.js";
import { useProgressBar } from "./useProgressBar.js";
import PhotoStudio from "../../../../src/index";
import "./components/ColoredBtn.js";
import "./components/AngleAdjustment.js";

import useColors from "./useColors.js";

// PhotoStudio类实例
let imageStudio = null;

// 初始化页面结构
function initPageStructure() {
  // 创建主容器
  const mainElement = document.createElement("main");
  mainElement.className = "editor-main";

  // 创建HTML结构
  mainElement.innerHTML = `
    <div class="pix-pro-container">
      <nav>
        <menu id="controlMenu">
          <div onclick="switchTab('crop')" data-tab="crop">
            <img src="./src/img/icon/crop-btn.svg" alt="crop-btn" />
            <span>裁切</span>
          </div>
          <div onclick="switchTab('expand')" data-tab="expand">
            <img src="./src/img/icon/expand-btn.svg" alt="expand-btn" />
            <span>扩图</span>
          </div>
          <div onclick="switchTab('erase')" data-tab="erase">
            <img src="./src/img/icon/erase-btn.svg" alt="erase-btn" />
            <span>擦除</span>
          </div>
          <div onclick="switchTab('remove-bg')" data-tab="remove-bg">
            <img src="./src/img/icon/remove-bg-btn.svg" alt="remove-bg-btn" />
            <span>移除背景</span>
          </div>
          <div onclick="switchTab('hd')" data-tab="hd">
            <img src="./src/img/icon/hd-btn.svg" alt="hd-btn" />
            <span>提升解析度</span>
          </div>
          <div onclick="switchTab('compress')" data-tab="compress">
            <img src="./src/img/icon/compress-btn.svg" alt="compress-btn" />
            <span>压缩容量</span>
          </div>
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
              <button onclick="handleHeaderControl('reset')" class="toolbar-btn" id="resetBtn">恢复原图</button>
            </div>
            <div class="step-actions">
              <span>
                <button class="toolbar-btn" onclick="handleHeaderControl('rollback')" id="rollbackBtn">
                  <img src="./src/img/icon/step.svg" alt="step" />
                </button>
              </span>
              <span>
                <button class="toolbar-btn flip" onclick="handleHeaderControl('forward')" id="forwardBtn">
                  <img src="./src/img/icon/step.svg" alt="step" />
                </button>
              </span>
            </div>
            <div class="confirm-actions">
              <span>
                <button class="toolbar-btn primary-text" onclick="handleClose()">取消</button>
              </span>
              <span>
                <button onclick="handleExportImage()" class="toolbar-btn primary" id="confirmBtn">下载</button>
              </span>
            </div>
          </div>
        </header>
        <div class="image-content">
          <div class="image-box" id="imageBox">
            <div id="loadingIcon" class="image-loading" style="display: none">
              <img src="./src/img/icon/loading.svg" alt="loading" />
            </div>
            <div class="container" id="photoStudioContainer"></div>
            <div id="progressBar" class="main-loading" style="display: none">
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
}

// 在页面加载完成后初始化结构
document.addEventListener("DOMContentLoaded", () => {
  initPageStructure();
  initDOMReferences();
  initImageStudio();
});

// 状态变量
let nowLoading = false;
let isOperate = false;
let nowStep = null;
let nowStepList = [];
let realTimeStep = null;
let nowStepIndex = -1;
let width = 0; // 实际图片像素宽度
let height = 0; // 实际图片像素高度
let imgCurrentWidth = 0; // 当前DOM元素宽度
let imgCurrentHeight = 0; // 当前DOM元素高度
let originalWidth = 0; // 原始图片宽度
let originalHeight = 0; // 原始图片高度
let direction = null;
let cropRatio = null;
let aiLoading = false;
let disabledForm = false;
let isInit = false;
let token = "";
let cropRatios = null;
let activeTab = null;

// DOM元素引用
let photoStudioContainer;
let controlTitle;
let controlDesc;
let controlContent;
let controlMenu;
let resolutionText;
let loadingIcon;
let progressBar;
let progressFill;
let progressPercentage;
let exportImgBox;
let exportedImage;
let imageRotateBox;
let fullScreenBlocker;

// 初始化DOM元素引用
function initDOMReferences() {
  photoStudioContainer = document.getElementById("photoStudioContainer");
  controlTitle = document.getElementById("controlTitle");
  controlDesc = document.getElementById("controlDesc");
  controlContent = document.getElementById("controlContent");
  controlMenu = document.getElementById("controlMenu");
  resolutionText = document.getElementById("resolutionText");
  loadingIcon = document.getElementById("loadingIcon");
  progressBar = document.getElementById("progressBar");
  progressFill = document.getElementById("progressFill");
  progressPercentage = document.getElementById("progressPercentage");
  exportImgBox = document.getElementById("exportImgBox");
  exportedImage = document.getElementById("exportedImage");
  imageRotateBox = document.getElementById("imageRotateBox");
  fullScreenBlocker = document.getElementById("fullScreenBlocker");
}

/**
 * 初始化图片编辑器
 * @param {string} userToken - 用户token
 * @param {Object} userCropRatios - 裁剪比例配置
 */
function initImageStudio(userToken = "", userCropRatios = null) {
  token = userToken;
  cropRatios = userCropRatios;

  if (imageStudio) {
    imageStudio.resetAll();
    imageStudio = null;
  }

  const progressBarController = useProgressBar(progressBar, progressFill, progressPercentage);

  imageStudio = new PhotoStudio(photoStudioContainer, {
    token: token,
    merchantId: "",
    isDev: false,
    host: "https://api.pixpro.cc/",
    routes: "/image/processing",
    action: {
      extend: "ImageExpansion",
      erase: "LocalizedImageRemoval",
      removeBg: "BackgroundRemoval",
      hd: "EnhanceImageResolution",
    },
    realTimeChange: (step) => {
      console.log(step, "step");

      /** 实时计算宽高 */
      const { currentWidth, currentHeight } = getWH(step);
      console.log(currentWidth, "realTimeChange");
      console.log(currentHeight, "currentHeight");

      width = currentWidth;
      height = currentHeight;
      realTimeStep = step;
      disabledForm = step.disabledForm ?? false;
      imgCurrentWidth = step.currentDomWidth / (step.cdProportions ?? 1);

      imgCurrentHeight = step.currentDomHeight / (step.cdProportions ?? 1);

      // 保存原始图片尺寸（第一次加载时）
      // if (originalWidth === 0 || originalHeight === 0) {
      //   originalWidth = step.rawImgWidth || width;
      //   originalHeight = step.rawImgHeight || height;
      // }

      // 更新分辨率显示
      updateResolutionText();

      // 更新尺寸输入字段
      updateSizeInputs();

      // 更新界面元素状态
      updateUIState();

      // 更新扩图和擦除按钮状态
      if (activeTab === "expand") {
        updateExpandImageBtnStatus();
      } else if (activeTab === "erase") {
        updateEraseImageBtnStatus();
      }
    },
    onStepChange: ({ stepList, currentStepIndex }) => {
      console.log(stepList, "-----------------------", currentStepIndex);

      const step = stepList[currentStepIndex];
      realTimeStep = step;
      nowStepList = stepList;
      nowStepIndex = currentStepIndex;
      nowStep = step;
      direction = step.direction ?? "vertical";

      const { currentWidth, currentHeight } = getWH(step);
      console.log(currentWidth, "realTimeChange-onStepChange");
      console.log(currentHeight, "currentHeight-onStepChange");
      width = currentWidth;
      height = currentHeight;
      imgCurrentWidth = step.currentDomWidth / (step.cdProportions ?? 1);

      imgCurrentHeight = step.currentDomHeight / (step.cdProportions ?? 1);

      // 更新分辨率显示
      updateResolutionText();

      // 更新尺寸输入字段
      updateSizeInputs();

      // 更新界面元素状态
      updateUIState();

      // 更新扩图和擦除按钮状态
      if (activeTab === "expand") {
        updateExpandImageBtnStatus();
      } else if (activeTab === "erase") {
        updateEraseImageBtnStatus();
      }

      setTimeout(() => {
        aiLoading = false;
        disabledForm = step.disabledForm ?? false;
        if (aiLoading) {
          hideLoading();
        }
      }, 0);
    },
    onExportImage: (image) => {
      exportedImage.src = image;
      exportImgBox.style.display = "flex";
      handleClose();
    },
    onUpload: () => {
      nowLoading = true;
      isOperate = true;
      // 显示操作栏
      const controlsContainer = document.getElementById("controlsContainer");
      controlsContainer.style.display = "flex";
      // 显示角度调整组件
      if (activeTab === "crop") {
        renderAngleAdjustment();
        imageRotateBox.style.display = "block";
      }
      aiLoading = true;
      showLoading();

      // 重置并启动进度条
      progressBarController.resetProgress();
      // 延迟启动进度条，避免闪烁
      progressBarController.startProgress();
    },
    onProgress: (progress) => {
      console.log("进度更新:", progress);
      // 进度更新不需要特别处理，进度条会自动模拟进度
    },
    onFinish: () => {
      // 完成时，让进度条完成
      progressBarController.finishProgress();

      // 延迟执行，确保进度条有时间显示完成状态
      setTimeout(() => {
        aiLoading = false;
        nowLoading = false;
        hideLoading();
      }, 600);

      if (!isInit) {
        isInit = true;

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

        triggerCropRatio();
      }
    },
  });
}

/**
 * 获取实时的宽高
 */
function getWH(step) {
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
function updateResolutionText() {
  if (resolutionText) {
    resolutionText.textContent = "目标图片分辨率：" + `${width} x ${height}`;
  }
}

/**
 * 更新尺寸输入字段显示
 */
function updateSizeInputs() {
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");

  if (widthInput && heightInput) {
    widthInput.value = Math.round(width);
    heightInput.value = Math.round(height);
  }
}

/**
 * 更新UI状态
 */
function updateUIState() {
  // 更新前进后退按钮状态
  const rollbackBtn = document.getElementById("rollbackBtn");
  const forwardBtn = document.getElementById("forwardBtn");

  if (rollbackBtn) {
    rollbackBtn.disabled = nowStepIndex <= 0;
    rollbackBtn.classList.toggle("disabled", nowStepIndex <= 0);
  }

  if (forwardBtn) {
    forwardBtn.disabled = nowStepIndex >= nowStepList.length - 1;
    forwardBtn.classList.toggle("disabled", nowStepIndex >= nowStepList.length - 1);
  }

  // 更新确认按钮状态
  const confirmBtn = document.getElementById("confirmBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (confirmBtn) {
    confirmBtn.disabled = disabledForm;
    confirmBtn.classList.toggle("disabled", disabledForm);
  }

  if (resetBtn) {
    resetBtn.disabled = nowStepIndex <= 0;
    resetBtn.classList.toggle("disabled", nowStepIndex <= 0);
  }

  // 更新扩图和擦除按钮状态
  if (activeTab === "expand") {
    updateExpandImageBtnStatus();
  } else if (activeTab === "erase") {
    updateEraseImageBtnStatus();
  }
}

/**
 * 显示加载中
 */
function showLoading() {
  loadingIcon.style.display = "flex";
  fullScreenBlocker.style.display = "block";
}

/**
 * 隐藏加载中
 */
function hideLoading() {
  loadingIcon.style.display = "none";
  fullScreenBlocker.style.display = "none";

  // 确保进度条隐藏（安全检查）
  if (!aiLoading && progressBar) {
    progressBar.style.display = "none";
  }
}

/**
 * 切换标签页
 */
function switchTab(tabName) {
  // 获取菜单项元素
  const menuItem = document.querySelector(`#controlMenu > div[data-tab="${tabName}"]`);

  // 检查是否为禁用的菜单项
  if (menuItem && menuItem.classList.contains("disabled")) {
    console.log("菜单项已禁用，无法切换");
    return;
  }

  // 在没有上传图片时不允许切换标签页
  if (!isInit && tabName !== "crop") {
    console.log("未上传图片，无法切换到非裁剪标签");
    return;
  }

  if (activeTab === tabName) return;

  // 清理旧的角度调整组件
  if (imageRotateBox) {
    imageRotateBox.innerHTML = "";
    imageRotateBox.style.display = "none";
  }

  // 更新活动标签
  const oldTab = activeTab;
  activeTab = tabName;

  // 更新菜单项的激活状态
  const menuItems = controlMenu.querySelectorAll("div");
  menuItems.forEach((item) => {
    const tab = item.getAttribute("data-tab");
    if (tab === tabName) {
      item.classList.add("active");
      // 只有在已上传图片时(isInit为true)，才移除裁剪选项的禁用外观
      if (tab === "crop" && item.classList.contains("disabled-appearance") && isInit) {
        item.classList.remove("disabled-appearance");
      }
    } else {
      item.classList.remove("active");
    }
  });

  // 更新控制面板标题和描述
  if (controlTextData[tabName]) {
    controlTitle.textContent = controlTextData[tabName].title;
    controlDesc.textContent = controlTextData[tabName].desc;
  }

  // 根据标签类型渲染不同的控制内容
  renderControlContent(tabName);

  // 切换模式
  if (imageStudio && nowStep) {
    const oldMode = oldTab || "view";
    if (oldMode !== tabName) {
      switchMode({ oldMode, newMode: tabName });

      // 参考Vue版本，在切换到擦除模块时，添加延时设置擦除大小，避免卡住
      if (tabName === "erase") {
        // 延迟500ms设置擦除大小，确保UI完全渲染
        setTimeout(() => {
          const eraserSizeInput = document.getElementById("eraserSizeInput");
          if (eraserSizeInput) {
            const size = parseInt(eraserSizeInput.value, 10);
            setEraserSize(size);
          }
        }, 500);
      }
    }
  }

  // 当切换到扩展或擦除标签时，更新对应按钮状态
  if (tabName === "expand") {
    setTimeout(() => updateExpandImageBtnStatus(), 0);
  } else if (tabName === "erase") {
    setTimeout(() => updateEraseImageBtnStatus(), 0);
  }

  // 显示或隐藏角度调整组件
  if (tabName === "crop" && isOperate) {
    setTimeout(() => {
      renderAngleAdjustment();
      imageRotateBox.style.display = "block";
    }, 100);
  }
}

/**
 * 渲染控制内容
 */
function renderControlContent(tabName) {
  controlContent.innerHTML = "";

  switch (tabName) {
    case "crop":
      renderCropControls();
      break;
    case "expand":
      renderExpandControls();
      break;
    case "erase":
      renderEraseControls();
      break;
    case "remove-bg":
      renderRemoveBgControls();
      break;
    case "hd":
      renderHdControls();
      break;
    case "compress":
      renderCompressControls();
      break;
  }
}

/**
 * 渲染裁剪控制
 */
function renderCropControls() {
  const cropControlsHtml = `
    <div class="crop">
      <div class="section" id="cropRatiosSection">
        <div class="crop-ratios">
          ${Object.entries(cropControlData)
            .map(
              ([label, ratio], index) => `
            <div class="icon-btn ${!isInit ? "disabled" : ""} ${index === 0 || (cropRatio && cropRatio.label === label) ? "active" : ""}" 
                  data-ratio="${ratio}" data-label="${label}">
              ${
                label === "original"
                  ? `
                <figure><img src="/src/img/icon/original.svg" alt="原比例"></figure>
                <span>原比例</span>
              `
                  : `
                <figure><i style="${getRatioStyle(ratio)}"></i></figure>
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
            <input type="number" id="widthInput" value="${width}" disabled>
          </div>
          <div class="input-group">
            <label>高度 (像素)</label>
            <input type="number" id="heightInput" value="${height}" disabled>
          </div>
        </div>
      </div>
      <div class="section flip-btn">
        <button title="左翻转" data-direction="left" ${!isInit ? "disabled" : ""}><img src="/src/img/icon/flip-l.svg" alt="左翻转"></button>
        <button title="右翻转" data-direction="right" ${!isInit ? "disabled" : ""}><img src="/src/img/icon/flip-r.svg" alt="右翻转"></button>
        <button title="上下翻转" data-direction="y" ${!isInit ? "disabled" : ""}><img src="/src/img/icon/flip-x.svg" alt="上下翻转"></button>
        <button title="左右翻转" data-direction="x" ${!isInit ? "disabled" : ""}><img src="/src/img/icon/flip-y.svg" alt="左右翻转"></button>
      </div>
    </div>
  `;

  controlContent.innerHTML = cropControlsHtml;

  // 添加裁剪比例按钮事件监听
  const cropRatioBtns = controlContent.querySelectorAll(".icon-btn");
  cropRatioBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 如果按钮被禁用，则不执行任何操作
      if (!isInit || btn.classList.contains("disabled")) {
        return;
      }

      const ratio = parseFloat(btn.getAttribute("data-ratio"));
      const label = btn.getAttribute("data-label");
      handleCropRatio({ ratio: isNaN(ratio) ? null : ratio, label });

      // 更新按钮状态
      cropRatioBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // 添加翻转按钮事件监听
  const flipBtns = controlContent.querySelectorAll(".flip-btn button");
  flipBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 如果按钮被禁用，则不执行任何操作
      if (!isInit || btn.disabled) {
        return;
      }

      const direction = btn.getAttribute("data-direction");
      if (direction === "left" || direction === "right") {
        turn(direction);
      } else {
        flip(direction);
      }
    });
  });

  // 如果没有选中任何比例，默认选中第一个
  if (!cropRatio) {
    const firstBtn = cropRatioBtns[0];
    if (firstBtn) {
      const ratio = parseFloat(firstBtn.getAttribute("data-ratio"));
      const label = firstBtn.getAttribute("data-label");
      handleCropRatio({ ratio: isNaN(ratio) ? null : ratio, label });
      firstBtn.classList.add("active");
    }
  }
}

/**
 * 获取比例图标样式
 */
function getRatioStyle(ratio) {
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
function renderExpandControls() {
  const expandControlsHtml = `
    <div class="crop">
      <div class="section">
        <div class="size-inputs">
          <div class="input-group">
            <label>宽度 (像素)</label>
            <input type="number" id="widthInput" value="${width}" disabled>
          </div>
          <div class="input-group">
            <label>高度 (像素)</label>
            <input type="number" id="heightInput" value="${height}" disabled>
          </div>
        </div>
      </div>
      <div class="section">
        <colored-btn id="expandImageBtn" text="扩展图片"></colored-btn>
        <small id="expandWarning" style="display: none">原图图片分辨率需大于 300 x 300 且小于 3000 x 3000 才能扩图。</small>
      </div>
    </div>
  `;
  console.log("expandControlsHtml----------------------");

  controlContent.innerHTML = expandControlsHtml;

  // 添加尺寸输入事件监听
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");

  widthInput.addEventListener("change", () => {
    width = parseInt(widthInput.value, 10);
    handleSizeChange("width");
  });

  heightInput.addEventListener("change", () => {
    height = parseInt(heightInput.value, 10);
    handleSizeChange("height");
  });

  // 添加扩图按钮事件监听
  const expandImageBtn = document.getElementById("expandImageBtn");
  expandImageBtn.addEventListener("click", () => {
    // 检查是否可以扩图（判断是否有选择裁剪区域）
    const expandDisabled = !realTimeStep || (parseFloat(realTimeStep.cropBoxHeight.toFixed(4)) === parseFloat(realTimeStep.fenceMinHeight.toFixed(4)) && parseFloat(realTimeStep.cropBoxWidth.toFixed(4)) === parseFloat(realTimeStep.fenceMinWidth.toFixed(4)) && realTimeStep.xDomOffset === 0 && realTimeStep.yDomOffset === 0);

    if (expandDisabled) {
      // 未选择裁剪区域，无法扩图
      console.log("未选择裁剪区域，无法扩图");
      return;
    }
    handleExpandImage();
  });

  // 更新扩图按钮状态
  updateExpandImageBtnStatus();
}

// 更新扩图按钮状态
function updateExpandImageBtnStatus() {
  const expandImageBtn = document.getElementById("expandImageBtn");
  if (!expandImageBtn) return;

  // 检查是否可以扩图 - 参考Vue版本的实现方式
  const expandDisabled = !realTimeStep || (parseFloat(realTimeStep.cropBoxHeight.toFixed(4)) === parseFloat(realTimeStep.fenceMinHeight.toFixed(4)) && parseFloat(realTimeStep.cropBoxWidth.toFixed(4)) === parseFloat(realTimeStep.fenceMinWidth.toFixed(4)) && realTimeStep.xDomOffset === 0 && realTimeStep.yDomOffset === 0);

  if (expandDisabled) {
    expandImageBtn.classList.add("disabled");
  } else {
    expandImageBtn.classList.remove("disabled");
  }
}

/**
 * 渲染擦除控制
 */
function renderEraseControls() {
  const eraseControlsHtml = `
    <div class="erase">
      <div class="section">
        <div id="eraserSizeSlider" class="eraser-size-slider">
          <small>橡皮擦大小</small>
          <input type="range" min="20" max="100" value="20" id="eraserSizeInput">
          <div class="eraser-size-preview-wrapper">
            <div class="eraser-size-preview" id="eraserSizePreview"></div>
          </div>
        </div>
        <colored-btn id="eraseImageBtn" text="清除物件"></colored-btn>
        <small id="eraseWarning" style="display: none">图片分辨率需大于 300 x 300 且小于 3000 x 3000 才能擦除。</small>
      </div>
    </div>
  `;

  controlContent.innerHTML = eraseControlsHtml;

  // 添加擦除大小滑块事件监听
  const eraserSizeInput = document.getElementById("eraserSizeInput");
  const eraserSizePreview = document.getElementById("eraserSizePreview");

  function updateEraserPreview() {
    const size = eraserSizeInput.value;
    // 调整预览尺寸，预览应该更小一些，显示效果更好
    const previewSize = Math.min(40, Math.max(20, size / 2.5));
    eraserSizePreview.style.width = `${previewSize}px`;
    eraserSizePreview.style.height = `${previewSize}px`;

    // 更新滑块背景色
    const percent = ((size - 20) / 80) * 100;
    eraserSizeInput.style.background = `linear-gradient(to right, #4878ef 0%, #4878ef ${percent}%, #e0e0e0 ${percent}%, #e0e0e0 100%)`;

    setEraserSize(parseInt(size, 10));
  }

  eraserSizeInput.addEventListener("input", updateEraserPreview);
  updateEraserPreview();

  // 添加擦除按钮事件监听
  const eraseImageBtn = document.getElementById("eraseImageBtn");
  eraseImageBtn.addEventListener("click", () => {
    // 检查是否可以擦除（判断是否有选择区域）
    const eraseDisabled = !realTimeStep?.erasePoints?.length;

    if (eraseDisabled) {
      // 未选择区域，无法擦除
      console.log("未选择擦除区域，无法擦除");
      return;
    }
    eraseImage();
  });

  // 更新擦除按钮状态
  updateEraseImageBtnStatus();
}

// 更新擦除按钮状态
function updateEraseImageBtnStatus() {
  const eraseImageBtn = document.getElementById("eraseImageBtn");
  if (!eraseImageBtn) return;

  // 检查是否可以擦除 - 参考Vue版本，正确的判断应该是有擦除点才能触发
  const eraseDisabled = !realTimeStep?.erasePoints?.length;

  if (eraseDisabled) {
    eraseImageBtn.classList.add("disabled");
  } else {
    eraseImageBtn.classList.remove("disabled");
  }
}

/**
 * 渲染移除背景控制
 */
// 当前选中颜色
let currentColor = nowStepList?.[nowStepIndex]?.bgColor || "transparent";

// 改变背景颜色
function handleColorChange(color) {
  console.log(color, "---------------");

  setHandleColorChange(color);
}
function setHandleColorChange(color) {
  if (imageStudio) {
    imageStudio.setRemoveBgColor(color);
  }
  useColorsData.currentColor = color;
  // 添加删除按钮事件监听
  const closeIcons = controlContent.querySelectorAll(".close-icon");
  closeIcons.forEach((icon) => {
    const color = icon.getAttribute("data-color");
    if (useColorsData.localColorList.includes(color) && color !== useColorsData.currentColor) {
      icon.style.display = "block";
    } else {
      icon.style.display = "none";
    }
  });
}
const useColorsData = new useColors(handleColorChange, currentColor);
function renderRemoveBgControls() {
  const removeBgControlsHtml = `
    <div class="remove-bg">
      <div class="section">
        <colored-btn id="removeBgBtn" text="一键移除"></colored-btn>
        <small id="removeBgWarning" style="display: none">宽低于 300px 或高低于 300px，无法一键移除背景。</small>
        <span class="line"></span>
        <div class="color-list">
          <small>背景颜色</small>
          <div class="color-box">
            ${useColorsData.allColorsList
              .map(
                (color) => `
              <div class="color-item ${color === "transparent" ? "transparent" : ""} ${color === useColorsData.currentColor ? "active" : ""}" 
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
        <button id="confirmBtn" class="toolbar-btn primary">确认</button>
        <button id="cancelBtn"  class="toolbar-btn">取消</button>
      </footer>
    </div>
  </div>
          </div>
        </div>
      </div>
    </div>
  `;

  controlContent.innerHTML = removeBgControlsHtml;
  // 添加按钮
  const addIcons = document.getElementById("addIcons");
  // 颜色选择框
  const colorSelect = document.querySelector(".color-select");
  // 颜色输入框
  const inputRef = document.getElementById("inputRef");
  // 确认按钮
  const confirmBtn = document.getElementById("confirmBtn");
  // 取消按钮
  const cancelBtn = document.getElementById("cancelBtn");

  // 打开颜色选择框
  addIcons.addEventListener("click", () => {
    colorSelect.style.display = "block";
  });
  // 确认事件
  confirmBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const color = inputRef.value;
    useColorsData.handleAddNewColor(color);
    colorSelect.style.display = "none";
    inputRef.value = "";
    // 重新渲染颜色列表
    renderRemoveBgControls();
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
  const colorItems = controlContent.querySelectorAll(".color-item");
  colorItems.forEach((item) => {
    item.addEventListener("click", () => {
      const color = item.getAttribute("data-color");
      console.log(123);

      handleColorChange(color);

      // 更新按钮状态
      colorItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });
  // 添加删除按钮事件监听
  const closeIcons = controlContent.querySelectorAll(".close-icon");
  closeIcons.forEach((icon) => {
    const color = icon.getAttribute("data-color");

    if (useColorsData.localColorList.includes(color) && color !== useColorsData.currentColor) {
      icon.style.display = "block";
    } else {
      icon.style.display = "none";
    }
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      useColorsData.removeLocalColorStorage(color);
      // 重新渲染颜色列表
      renderRemoveBgControls();
    });
  });

  // 添加移除背景按钮事件监听
  const removeBgBtn = document.getElementById("removeBgBtn");
  removeBgBtn.addEventListener("click", () => {
    handleRemoveBg();
  });
}

/**
 * 渲染提升解析度控制
 */
function renderHdControls() {
  const hdControlsHtml = `
    <div class="hd">
      <div class="section">
        <colored-btn id="hdBtn" text="一键提升"></colored-btn>
        <small id="hdWarning" style="display: none">图片分辨率需大于 300 x 300 且小于 3000 x 3000 才能提升解析度。</small>
      </div>
    </div>
  `;

  controlContent.innerHTML = hdControlsHtml;

  // 添加提升解析度按钮事件监听
  const hdBtn = document.getElementById("hdBtn");
  hdBtn.addEventListener("click", () => {
    handleHd();
  });
}

/**
 * 渲染压缩容量控制
 */
function renderCompressControls() {
  const compressControlsHtml = `
    <div class="compress">
      <div class="section">
        <colored-btn id="compressBtn" text="一键压缩"></colored-btn>
      </div>
    </div>
  `;

  controlContent.innerHTML = compressControlsHtml;

  // 添加压缩容量按钮事件监听
  const compressBtn = document.getElementById("compressBtn");
  compressBtn.addEventListener("click", () => {
    // 实现压缩功能
  });
}

/**
 * 触发比例裁剪
 */
function triggerCropRatio() {
  // 判断是否需要自动触发裁剪比例
  if (cropRatios && Object.keys(cropRatios).length > 0) {
    // 若cropRatios中只有一个比例，直接使用
    if (Object.keys(cropRatios).length === 1) {
      const label = Object.keys(cropRatios)[0];
      const ratio = cropRatios[label];
      console.log("触发比例裁剪", ratio, label);
      handleCropRatio({ ratio, label, isTrigger: false });
    } else {
      // 如果有多个比例，默认使用第一个
      const label = Object.keys(cropRatios)[0];
      const ratio = cropRatios[label];
      handleCropRatio({ ratio, label, isTrigger: false });
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
        }
      }
    }, 100);
  } else if (cropControlData && Object.keys(cropControlData).length > 0) {
    // 使用默认的裁剪比例
    const label = Object.keys(cropControlData)[0];
    const ratio = cropControlData[label];
    handleCropRatio({ ratio, label, isTrigger: false });

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
        }
      }
    }, 100);
  }
}

// 处理图片尺寸变化
function handleSizeChange(direction) {
  console.log(direction, "-----------------------------");
  if (imageStudio) {
    imageStudio.setWidthAndHeight(width, height, direction);
  }
}

// 关闭
function handleClose() {
  if (imageStudio) {
    imageStudio.resetAll();
    imageStudio = null;
  }
  // 重置UI状态
  controlContent.innerHTML = "";
  activeTab = null;
  // 隐藏导出图片框
  exportImgBox.style.display = "none";
}

// 导出图片
function handleExportImage() {
  if (imageStudio) {
    imageStudio.exportImage();
  }
}

// 旋转
function handleRotate(angle) {
  if (imageStudio) {
    imageStudio.rotate(Number(angle));
  }
}

// 回退
function rollback() {
  if (imageStudio) {
    imageStudio.rollback();
  }
}

// 前进
function forward() {
  if (imageStudio) {
    imageStudio.forward();
  }
}

// 重置
function reset() {
  if (imageStudio) {
    imageStudio.reset();
  }
}

// 翻转
function flip(direction) {
  if (imageStudio) {
    imageStudio.flip(direction);
  }
}

// 处理裁剪比例
function handleCropRatio(ratioData) {
  if (imageStudio) {
    cropRatio = ratioData;
    imageStudio.cropRatio(ratioData);
  }
}

// 旋转方向
function turn(direction) {
  if (imageStudio) {
    imageStudio.turn(direction);
  }
}

// 扩图
function handleExpandImage() {
  console.log("扩图");

  if (imageStudio) {
    aiLoading = true;
    showLoading();
    imageStudio.expandImageBtn();
  }
}

// 擦除
function eraseImage() {
  if (imageStudio) {
    aiLoading = true;
    showLoading();
    imageStudio.eraseImage();
  }
}

// 设置擦除大小
function setEraserSize(size) {
  if (imageStudio) {
    imageStudio.setEraserSize(size);
  }
}

// 移除背景
function handleRemoveBg() {
  if (imageStudio) {
    aiLoading = true;
    showLoading();
    imageStudio.removeBg();
  }
}

// 提升分辨率
function handleHd() {
  if (imageStudio) {
    aiLoading = true;
    showLoading();
    imageStudio.hd();
  }
}

// 切换模式
function switchMode({ oldMode, newMode }) {
  if (oldMode === newMode) return;
  console.log("切换模式", oldMode, newMode);
  if (imageStudio) {
    imageStudio.switchMode(oldMode, newMode);
    aiLoading = true;
    showLoading();
  }
}

// 处理头部控制操作
function handleHeaderControl(action) {
  switch (action) {
    case "reset":
      reset();
      break;
    case "rollback":
      rollback();
      break;
    case "forward":
      forward();
      break;
  }
}

/**
 * 渲染角度调整组件
 */
function renderAngleAdjustment() {
  imageRotateBox.innerHTML = "";

  // 创建角度调整组件
  const angleAdjustment = document.createElement("angle-adjustment");
  angleAdjustment.setAttribute("max-angle", "180");

  // 设置当前角度值 (如果有)
  if (realTimeStep && typeof realTimeStep.rotate === "number") {
    angleAdjustment.setAttribute("angle", realTimeStep.rotate);
  }

  // 监听角度变化事件
  angleAdjustment.addEventListener("change", (e) => {
    const angle = e.detail.angle;
    handleRotate(angle);
  });

  imageRotateBox.appendChild(angleAdjustment);
}

// 初始化页面
window.addEventListener("DOMContentLoaded", () => {
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
      console.log(item);

      // 裁剪选项应用禁用样式，但不完全禁用功能
      item.classList.add("disabled-appearance");
    }
  });

  // 禁用工具栏按钮
  const resetBtn = document.getElementById("resetBtn");
  const rollbackBtn = document.getElementById("rollbackBtn");
  const forwardBtn = document.getElementById("forwardBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.querySelector(".toolbar-btn.primary-text"); // 取消按钮

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

  // 取消按钮不应该禁用
  // if (cancelBtn) {
  //   cancelBtn.disabled = true;
  //   cancelBtn.classList.add('disabled');
  // }

  // 初始化图片编辑器
  initImageStudio("", cropControlData);

  // 默认选中裁剪选项卡
  switchTab("crop");

  // 为导出图片框添加点击事件，点击关闭
  exportImgBox.addEventListener("click", () => {
    exportImgBox.style.display = "none";
  });
});

// 导出公共方法
window.handleExportImage = handleExportImage;
window.switchTab = switchTab;
window.handleHeaderControl = handleHeaderControl;
