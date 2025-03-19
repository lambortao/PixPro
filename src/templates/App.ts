import { ACCEPT_UPLOAD_TYPE } from '../config/constants';

export default `
  <div class="photo-studio-container">
    <div id="mouse-zoom-tip" class="mouse-zoom-tip">请滚动鼠标滚轮以缩放图片</div>
    <div class="upload-container">
      <div class="upload-container-input">
        <input id="photo-studio-upload-input" type="file" name="file" id="file" accept="${ACCEPT_UPLOAD_TYPE}" />
        <div>
          <span><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M20.987 16a1 1 0 0 0-.039-.316l-2-6A1 1 0 0 0 18 9h-4v2h3.279l1.667 5H5.054l1.667-5H10V9H6a1 1 0 0 0-.948.684l-2 6a1 1 0 0 0-.039.316C3 16 3 21 3 21a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1s0-5-.013-5M16 7.904c.259 0 .518-.095.707-.283a1 1 0 0 0 0-1.414L12 1.5L7.293 6.207a1 1 0 0 0 0 1.414c.189.189.448.283.707.283s.518-.094.707-.283L11 5.328V12a1 1 0 0 0 2 0V5.328l2.293 2.293a1 1 0 0 0 .707.283"/></svg></span>
          <p>点击上传图片或者将图片拖入虚线框内</p>
        </div>
      </div>
    </div>
    <div class="preview-control-container hide">
      <div class="preview-container">
        <div id="preview-curtain-box">
          <span id="container-canvas"><canvas></canvas></span>
        </div>
        <figure id="remind-image" class="hide">
          <canvas></canvas>
        </figure>
      </div>
      <div class="control-container" data-draggable="body">
        <span class="tl" data-draggable="tl"></span>
        <span class="tc" data-draggable="t"></span>
        <span class="tr" data-draggable="tr"></span>
        <span class="ml" data-draggable="l"></span>
        <span class="mr" data-draggable="r"></span>
        <span class="bl" data-draggable="bl"></span>
        <span class="bc" data-draggable="b"></span>
        <span class="br" data-draggable="br"></span>
      </div>
      <div class="eraser-container hide">
        <canvas id="eraser-canvas"></canvas>
      </div>
    </div>
  </div>
`;

export const ConfirmExpandTemplate = `
  <div class="confirm-expand-container">
    <p>是否选用该版本？</p>
    <div class="confirm-expand-container-btn">
      <button class="confirm-expand-container-btn-confirm">确定</button>
      <button class="confirm-expand-container-btn-cancel">取消</button>
    </div>
  </div>
`;
