var ScreensyncParam = {
        origin: '*',
        source: window.parent,
        scaleMin: 1,
        webContents: null,
        webImageData: null,
        ignoreElements: [],
        canvasW: 0,
        canvasH: 0,
        debug: true,
    }
    // var screenSyncOrigin = '*';
    // var screenSyncSource = window.parent;
    // var scalex = 1;
    // var webContents = null;
    // var webImageData = null;
    // var ignoreElements = []

// var REGEX =
// {
//   // 判断邮箱的正则
//   IS_MAIL: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{1,4}){1,2})$/,
//   // 用户账号校验正则
//   USERNAME: /^[a-zA-Z0-9_-]{4,16}$/,
//   PASSWORD: /^[a-zA-Z0-9_-]{6,20}$/,
//   // token 脱敏
//   TOKEN_ENCODE: /^(\w{3})\w*(\w{4})$/,
//   // token 脱敏
//   USERNAME_ENCODE: /^(\w{2})\w*(\w{1})$/,
//   // 邮箱脱敏
//   MAIL_ENCODE: /(.{2}).+(.{2}@.+)/,
// }

function filterPrivacy(str, beginLen=3, endLen=3) {
  if (!str || str.length <= 0) return str;
  var len = str.length;
  if (len <= 8) {
    beginLen = 1
    endLen = 0
  }
  var firstStr = str.substr(0,beginLen);
  var lastStr = str.substr(len-endLen);
  var middleStr = str.substring(beginLen, len-Math.abs(endLen)).replace(/[\s\S]/ig, '*');
  var tempStr = firstStr + middleStr + lastStr;
  return tempStr;
}

// 截屏
function screenshot() {
        return new Promise((resolve) => {
            window.html2canvas(document.body, {
                    onclone: function (cloneContent) {
                            // 脱敏
                            var privates = cloneContent.getElementsByClassName('privacy')
                            for (var item of privates) {
                                if (item instanceof HTMLInputElement) {
                                    // console.log('privacy : ', item);
                                    item.value = filterPrivacy(item.value, 1, 0)
                                } else {
                                    console.log('privacy : ', item);
                                    item.innerHTML = filterPrivacy(item.innerHTML)
                                }
                            }
                            // 过滤固定位置的元素
                            var elems = cloneContent.body.getElementsByTagName("*");
                            var len = elems.length
                            for (var i = 0; i < len; i++) {
                                var style = window.getComputedStyle(elems[i], null);
                                if (style.getPropertyValue('position') == 'fixed') {
                                    // 拼接style
                                    var cssText = `<style type="text/css"> .${elems[i].className}{`;
                                    for (var j = 0; j < style.length; j++) {
                                        cssText += style[j] + ':' + style.getPropertyValue(style[j]) + ';';
                                    }
                                    cssText += '}'
                                        // 遍历子元素
                                    for (var k = 0; j < elems[i].children.length; k++) {
                                        cssText += `.${elems[i].children[k].className}{`
                                        style = window.getComputedStyle(elems[i].children[k], null);
                                        // 拼接style
                                        for (j = 0; j < style.length; j++) {
                                            cssText += style[j] + ':' + style.getPropertyValue(style[j]) + ';';
                                        }
                                        cssText += '}'
                                    }
                                    cssText += '</style>'
                                    ScreensyncParam.ignoreElements.push(cssText + " " + elems[i].outerHTML);
                                    // 隐藏该元素
                                    elems[i].style.display = "none";
                                }
                            }
                        }, // onclone: function(cloneContent)
                })
                .then(function (canvas) {
                    // 获取canvas的宽度和长度
                    ScreensyncParam.canvasW = canvas.getBoundingClientRect().width;
                    ScreensyncParam.canvasH = canvas.getBoundingClientRect().height;
                    // 获取image data from canvas
                    var ctx = canvas.getContext("2d");
                    ScreensyncParam.webImageData = {
                      data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
                      width: canvas.width,
                      height: canvas.height
                    };

                    // 下载屏幕截图用于测试
                    if (ScreensyncParam.debug) {
                        var a = document.createElement('a');
                        a.href = canvas.toDataURL('image/png');
                        a.download = "output.png";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                    resolve()
                }); // then(function(canvas)
        }); // new Promise((resolve)
    } // function screenshot()


window.onload = function () {
    // document.addEventListener('keydown', onKeydown, false);
    // document.addEventListener('keyup', onKeyup, false);
    // document.addEventListener('click', onClick, false);
    // document.addEventListener('contextmenu', onContextmenu, false);
    // document.addEventListener('mousedown', onMousedown, false);
    // document.addEventListener('mouseup', onMouseup, false);
    // document.addEventListener('wheel', onWheel, false);
    document.addEventListener('scroll', onLocalScroll, false);
    window.addEventListener("message", onMessage, false);

    // register();
};

window.addEventListener('DOMContentLoaded', () => {
  var message = {
      key: 'SCREENSYNC',
      type: 'iFrameContentLoaded',
  }
  ScreensyncParam.source.postMessage(message, ScreensyncParam.origin);
});

window.onunload = function () {
    // var body = document.querySelector('body');
    // document.removeEventListener('keydown', onKeydown, false);
    // document.removeEventListener('keyup', onKeyup, false);
    // document.removeEventListener('click', onClick, false);
    // document.removeEventListener('contextmenu', onContextmenu, false);
    // document.removeEventListener('mousedown', onMousedown, false);
    // document.removeEventListener('mouseup', onMouseup, false);
    // document.removeEventListener('wheel', onWheel, false);
    document.removeEventListener('scroll', onLocalScroll, false);
    window.removeEventListener("message", onMessage, false);
};

// 注册到父窗口
function register() {
    var message = {
        key: 'SCREENSYNC',
        type: 'REGISTER',
    }
    ScreensyncParam.source.postMessage(message, ScreensyncParam.origin);
}

// 发送窗口大小
function sendClientSize() {
    // var body = document.querySelector('body');
    // var rect = body.getBoundingClientRect();
    var message = {
        key: 'SCREENSYNC',
        type: 'SYNC',
        action: 'size',
        value: {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            scrollHeight: document.documentElement.scrollHeight
        }
    }
    console.log('[screensync.js] :size : ', message);
    ScreensyncParam.source.postMessage(message, ScreensyncParam.origin);
}

// 发送截屏
function sendScreenshot() {
    screenshot().then(() => {
        var message = {
            key: 'SCREENSYNC',
            type: 'SYNC',
            action: 'screenshot',
            imageData: ScreensyncParam.webImageData,
            ignoreElements: ScreensyncParam.ignoreElements.join(' ')
        }
        console.log('[screensync.js] :screenshot : ', message);
        ScreensyncParam.source.postMessage(message, ScreensyncParam.origin);
    })
}

// 相应远端滚动消息
function onRemoteScroll(value) {
    var top = Math.round(value * ScreensyncParam.scaleMin);
    document.documentElement.scrollTop = document.body.scrollTop = top;
    console.log('[screensync.js] onRemoteScroll  : ', top);
}

// 相应远端size消息
function onRemoteSize(rectRemote) {
    var body = document.querySelector('body');
    var rectLocal = body.getBoundingClientRect();
    var scaleX = rectLocal.width / rectRemote.width;
    var scaleY = rectLocal.height / rectRemote.height;
    ScreensyncParam.scaleMin = Math.min(scaleX, scaleY);
    body.style.width = `${rectRemote.width}px`;
    body.style.transform = `scale(${ScreensyncParam.scaleMin})`;
    body.style.transformOrigin = "left top";

    console.log('[screensync.js] onRemoteSize  : ', rectRemote);
}


// 接收到的消息处理
function onMessage(event) {
    if (!event.data || !event.data.key) return
    if (event.data.key !== 'SCREENSYNC') return
    if (event.data.type === 'REGISTER') {
        console.log('[screensync.js] :onMessage : ', event.data);
        ScreensyncParam.origin = event.origin || '*';
        ScreensyncParam.source = event.source || window.parent;
        // 同步窗口size
        setTimeout(function () {
            sendClientSize();
        }, 100);
        setTimeout(function () {
            sendScreenshot()
        }, 200);
    }
    if (ScreensyncParam.origin !== event.origin) return
    if (event.data.type === 'SYNC') {
        if (event.data.action === 'scroll') {
            onRemoteScroll(event.data.value);
        } else if (event.data.action === 'size') {
            onRemoteSize(event.data.value);
        } else {
          console.error('unhandled screensync.js message : ', event.data);
        }
    }
}

function onLocalScroll( /*event*/ ) {
    var scrOfY = getScrollY();
    var message = {
        key: 'SCREENSYNC',
        type: 'SYNC',
        action: 'scroll',
        value: scrOfY
    }
    ScreensyncParam.source.postMessage(message, ScreensyncParam.origin);
}


function getScrollY() {
    var scrOfY = 0;
    if (typeof (window.pageYOffset) == 'number') {
        //Netscape compliant
        scrOfY = window.pageYOffset;
    } else if (document.body && document.body.scrollTop) {
        //DOM compliant
        scrOfY = document.body.scrollTop;
    }
    return scrOfY;
}
