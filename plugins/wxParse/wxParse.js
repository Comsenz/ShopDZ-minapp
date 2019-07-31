'use strict';

var _showdown = require('./showdown.js');

var _showdown2 = _interopRequireDefault(_showdown);

var _html2json = require('./html2json.js');

var _html2json2 = _interopRequireDefault(_html2json);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * author: Di (微信小程序开发工程师)
                                                                                                                                                                                                                   * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
                                                                                                                                                                                                                   *               垂直微信小程序开发交流社区
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * github地址: https://github.com/icindy/wxParse
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * for: 微信小程序富文本解析
                                                                                                                                                                                                                   * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
                                                                                                                                                                                                                   */

/**
 * utils函数引入
 **/


/**
 * 配置及公有属性
 **/
var realWindowWidth = 0;
var realWindowHeight = 0;
wx.getSystemInfo({
  success: function success(res) {
    realWindowWidth = res.windowWidth;
    realWindowHeight = res.windowHeight;
  }
});
/**
 * 主函数入口区
 **/
function wxParse() {
  var bindName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'wxParseData';
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'html';
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '<div class="color:red;">数据不能为空</div>';
  var target = arguments[3];
  var imagePadding = arguments[4];

  var that = target;
  var transData = {}; //存放转化后的数据
  if (type == 'html') {
    transData = _html2json2.default.html2json(data, bindName);
    // console.log(JSON.stringify(transData, ' ', ' '));
  } else if (type == 'md' || type == 'markdown') {
    var converter = new _showdown2.default.Converter();
    var html = converter.makeHtml(data);
    transData = _html2json2.default.html2json(html, bindName);
    // console.log(JSON.stringify(transData, ' ', ' '));
  }
  transData.view = {};
  transData.view.imagePadding = 0;
  if (typeof imagePadding != 'undefined') {
    transData.view.imagePadding = imagePadding;
  }
  var bindData = {};
  bindData[bindName] = transData;
  that.setData(bindData);
  that.bindData = bindData; // 增加这一行代码
  that.wxParseImgLoad = wxParseImgLoad;
  that.wxParseImgTap = wxParseImgTap;
}
// 图片点击事件
function wxParseImgTap(e) {
  var that = this;
  var nowImgUrl = e.target.dataset.src;
  var tagFrom = e.target.dataset.from;
  if (typeof tagFrom != 'undefined' && tagFrom.length > 0) {
    wx.previewImage({
      current: nowImgUrl, // 当前显示图片的http链接
      urls: that.data[tagFrom].imageUrls // 需要预览的图片http链接列表
    });
  }
}

/**
 * 图片视觉宽高计算函数区
 **/
function wxParseImgLoad(e) {
  var that = this;
  var tagFrom = e.target.dataset.from;
  var idx = e.target.dataset.idx;
  if (typeof tagFrom != 'undefined' && tagFrom.length > 0) {
    calMoreImageInfo(e, idx, that, tagFrom);
  }
}
// 假循环获取计算图片视觉最佳宽高
function calMoreImageInfo(e, idx, that, bindName) {
  var _that$setData;

  var temData = that.data[bindName];
  if (!temData || temData.images.length == 0) {
    return;
  }
  var temImages = temData.images;
  //因为无法获取view宽度 需要自定义padding进行计算，稍后处理
  var recal = wxAutoImageCal(e.detail.width, e.detail.height, that, bindName);
  // temImages[idx].width = recal.imageWidth;
  // temImages[idx].height = recal.imageheight;
  // temData.images = temImages;
  // var bindData = {};
  // bindData[bindName] = temData;
  // that.setData(bindData);
  var index = temImages[idx].index;
  var key = '' + bindName;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = index.split('.')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var i = _step.value;
      key += '.nodes[' + i + ']';
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var keyW = key + '.width';
  var keyH = key + '.height';
  that.setData((_that$setData = {}, _defineProperty(_that$setData, keyW, recal.imageWidth), _defineProperty(_that$setData, keyH, recal.imageheight), _that$setData));
}

// 计算视觉优先的图片宽高
function wxAutoImageCal(originalWidth, originalHeight, that, bindName) {
  //获取图片的原始长宽
  var windowWidth = 0,
      windowHeight = 0;
  var autoWidth = 0,
      autoHeight = 0;
  var results = {};
  var padding = that.data[bindName].view.imagePadding;
  windowWidth = realWindowWidth - 2 * padding;
  windowHeight = realWindowHeight;
  //判断按照那种方式进行缩放
  // console.log("windowWidth" + windowWidth);
  if (originalWidth > windowWidth) {
    //在图片width大于手机屏幕width时候
    autoWidth = windowWidth;
    // console.log("autoWidth" + autoWidth);
    autoHeight = autoWidth * originalHeight / originalWidth;
    // console.log("autoHeight" + autoHeight);
    results.imageWidth = autoWidth;
    results.imageheight = autoHeight;
  } else {
    //否则展示原来的数据
    results.imageWidth = originalWidth;
    results.imageheight = originalHeight;
  }
  return results;
}

function wxParseTemArray(temArrayName, bindNameReg, total, that) {
  var array = [];
  var temData = that.data;
  var obj = null;
  for (var i = 0; i < total; i++) {
    var simArr = temData[bindNameReg + i].nodes;
    array.push(simArr);
  }

  temArrayName = temArrayName || 'wxParseTemArray';
  obj = JSON.parse('{"' + temArrayName + '":""}');
  obj[temArrayName] = array;
  that.setData(obj);
}

/**
 * 配置emojis
 *
 */

function emojisInit() {
  var reg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var baseSrc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/wxParse/emojis/";
  var emojis = arguments[2];

  _html2json2.default.emojisInit(reg, baseSrc, emojis);
}

module.exports = {
  wxParse: wxParse,
  wxParseTemArray: wxParseTemArray,
  emojisInit: emojisInit
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInd4UGFyc2UuanMiXSwibmFtZXMiOlsicmVhbFdpbmRvd1dpZHRoIiwicmVhbFdpbmRvd0hlaWdodCIsInd4IiwiZ2V0U3lzdGVtSW5mbyIsInN1Y2Nlc3MiLCJyZXMiLCJ3aW5kb3dXaWR0aCIsIndpbmRvd0hlaWdodCIsInd4UGFyc2UiLCJiaW5kTmFtZSIsInR5cGUiLCJkYXRhIiwidGFyZ2V0IiwiaW1hZ2VQYWRkaW5nIiwidGhhdCIsInRyYW5zRGF0YSIsIkh0bWxUb0pzb24iLCJodG1sMmpzb24iLCJjb25zb2xlIiwibG9nIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnZlcnRlciIsInNob3dkb3duIiwiQ29udmVydGVyIiwiaHRtbCIsIm1ha2VIdG1sIiwidmlldyIsImJpbmREYXRhIiwic2V0RGF0YSIsInd4UGFyc2VJbWdMb2FkIiwid3hQYXJzZUltZ1RhcCIsImUiLCJub3dJbWdVcmwiLCJkYXRhc2V0Iiwic3JjIiwidGFnRnJvbSIsImZyb20iLCJsZW5ndGgiLCJwcmV2aWV3SW1hZ2UiLCJjdXJyZW50IiwidXJscyIsImltYWdlVXJscyIsImlkeCIsImNhbE1vcmVJbWFnZUluZm8iLCJ0ZW1EYXRhIiwiaW1hZ2VzIiwidGVtSW1hZ2VzIiwicmVjYWwiLCJ3eEF1dG9JbWFnZUNhbCIsImRldGFpbCIsIndpZHRoIiwiaGVpZ2h0IiwiaW5kZXgiLCJrZXkiLCJzcGxpdCIsImkiLCJrZXlXIiwia2V5SCIsImltYWdlV2lkdGgiLCJpbWFnZWhlaWdodCIsIm9yaWdpbmFsV2lkdGgiLCJvcmlnaW5hbEhlaWdodCIsImF1dG9XaWR0aCIsImF1dG9IZWlnaHQiLCJyZXN1bHRzIiwicGFkZGluZyIsInd4UGFyc2VUZW1BcnJheSIsInRlbUFycmF5TmFtZSIsImJpbmROYW1lUmVnIiwidG90YWwiLCJhcnJheSIsIm9iaiIsInNpbUFyciIsIm5vZGVzIiwicHVzaCIsInBhcnNlIiwiZW1vamlzSW5pdCIsInJlZyIsImJhc2VTcmMiLCJlbW9qaXMiLCJtb2R1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QUFDRDs7QUFFREwsaUJBQWVBLGdCQUFnQixpQkFBL0I7QUFDQUksUUFBTXBELEtBQUt3RCxLQUFMLENBQVcsT0FBTVIsWUFBTixHQUFvQixPQUEvQixDQUFOO0FBQ0FJLE1BQUlKLFlBQUosSUFBb0JHLEtBQXBCO0FBQ0F6RCxPQUFLZSxPQUFMLENBQWEyQyxHQUFiO0FBQ0Q7O0FBRUQ7Ozs7O0FBS0EsU0FBU0ssVUFBVCxHQUE2RDtBQUFBLE1BQXpDQyxHQUF5Qyx1RUFBckMsRUFBcUM7QUFBQSxNQUFsQ0MsT0FBa0MsdUVBQTFCLGtCQUEwQjtBQUFBLE1BQVBDLE1BQU87O0FBQzFEaEUsc0JBQVc2RCxVQUFYLENBQXNCQyxHQUF0QixFQUEwQkMsT0FBMUIsRUFBa0NDLE1BQWxDO0FBQ0Y7O0FBRURDLE9BQU9DLE9BQVAsR0FBaUI7QUFDZjFFLFdBQVNBLE9BRE07QUFFZjJELG1CQUFnQkEsZUFGRDtBQUdmVSxjQUFXQTtBQUhJLENBQWpCIiwiZmlsZSI6Ind4UGFyc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcbiAqIG9yZ2FuaXphdGlvbjogV2VBcHBEZXYo5b6u5L+h5bCP56iL5bqP5byA5Y+R6K665Z2bKShodHRwOi8vd2VhcHBkZXYuY29tKVxuICogICAgICAgICAgICAgICDlnoLnm7Tlvq7kv6HlsI/nqIvluo/lvIDlj5HkuqTmtYHnpL7ljLpcbiAqXG4gKiBnaXRodWLlnLDlnYA6IGh0dHBzOi8vZ2l0aHViLmNvbS9pY2luZHkvd3hQYXJzZVxuICpcbiAqIGZvcjog5b6u5L+h5bCP56iL5bqP5a+M5paH5pys6Kej5p6QXG4gKiBkZXRhaWwgOiBodHRwOi8vd2VhcHBkZXYuY29tL3Qvd3hwYXJzZS1hbHBoYTAtMS1odG1sLW1hcmtkb3duLzE4NFxuICovXG5cbi8qKlxuICogdXRpbHPlh73mlbDlvJXlhaVcbiAqKi9cbmltcG9ydCBzaG93ZG93biBmcm9tICcuL3Nob3dkb3duLmpzJztcbmltcG9ydCBIdG1sVG9Kc29uIGZyb20gJy4vaHRtbDJqc29uLmpzJztcbi8qKlxuICog6YWN572u5Y+K5YWs5pyJ5bGe5oCnXG4gKiovXG52YXIgcmVhbFdpbmRvd1dpZHRoID0gMDtcbnZhciByZWFsV2luZG93SGVpZ2h0ID0gMDtcbnd4LmdldFN5c3RlbUluZm8oe1xuICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzKSB7XG4gICAgcmVhbFdpbmRvd1dpZHRoID0gcmVzLndpbmRvd1dpZHRoXG4gICAgcmVhbFdpbmRvd0hlaWdodCA9IHJlcy53aW5kb3dIZWlnaHRcbiAgfVxufSlcbi8qKlxuICog5Li75Ye95pWw5YWl5Y+j5Yy6XG4gKiovXG5mdW5jdGlvbiB3eFBhcnNlKGJpbmROYW1lID0gJ3d4UGFyc2VEYXRhJywgdHlwZT0naHRtbCcsIGRhdGE9JzxkaXYgY2xhc3M9XCJjb2xvcjpyZWQ7XCI+5pWw5o2u5LiN6IO95Li656m6PC9kaXY+JywgdGFyZ2V0LGltYWdlUGFkZGluZykge1xuICB2YXIgdGhhdCA9IHRhcmdldDtcbiAgdmFyIHRyYW5zRGF0YSA9IHt9Oy8v5a2Y5pS+6L2s5YyW5ZCO55qE5pWw5o2uXG4gIGlmICh0eXBlID09ICdodG1sJykge1xuICAgIHRyYW5zRGF0YSA9IEh0bWxUb0pzb24uaHRtbDJqc29uKGRhdGEsIGJpbmROYW1lKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0cmFuc0RhdGEsICcgJywgJyAnKSk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PSAnbWQnIHx8IHR5cGUgPT0gJ21hcmtkb3duJykge1xuICAgIHZhciBjb252ZXJ0ZXIgPSBuZXcgc2hvd2Rvd24uQ29udmVydGVyKCk7XG4gICAgdmFyIGh0bWwgPSBjb252ZXJ0ZXIubWFrZUh0bWwoZGF0YSk7XG4gICAgdHJhbnNEYXRhID0gSHRtbFRvSnNvbi5odG1sMmpzb24oaHRtbCwgYmluZE5hbWUpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRyYW5zRGF0YSwgJyAnLCAnICcpKTtcbiAgfVxuICB0cmFuc0RhdGEudmlldyA9IHt9O1xuICB0cmFuc0RhdGEudmlldy5pbWFnZVBhZGRpbmcgPSAwO1xuICBpZih0eXBlb2YoaW1hZ2VQYWRkaW5nKSAhPSAndW5kZWZpbmVkJyl7XG4gICAgdHJhbnNEYXRhLnZpZXcuaW1hZ2VQYWRkaW5nID0gaW1hZ2VQYWRkaW5nXG4gIH1cbiAgdmFyIGJpbmREYXRhID0ge307XG4gIGJpbmREYXRhW2JpbmROYW1lXSA9IHRyYW5zRGF0YTtcbiAgdGhhdC5zZXREYXRhKGJpbmREYXRhKVxuICB0aGF0LmJpbmREYXRhID0gYmluZERhdGEgLy8g5aKe5Yqg6L+Z5LiA6KGM5Luj56CBXG4gIHRoYXQud3hQYXJzZUltZ0xvYWQgPSB3eFBhcnNlSW1nTG9hZDtcbiAgdGhhdC53eFBhcnNlSW1nVGFwID0gd3hQYXJzZUltZ1RhcDtcbn1cbi8vIOWbvueJh+eCueWHu+S6i+S7tlxuZnVuY3Rpb24gd3hQYXJzZUltZ1RhcChlKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgdmFyIG5vd0ltZ1VybCA9IGUudGFyZ2V0LmRhdGFzZXQuc3JjO1xuICB2YXIgdGFnRnJvbSA9IGUudGFyZ2V0LmRhdGFzZXQuZnJvbTtcbiAgaWYgKHR5cGVvZiAodGFnRnJvbSkgIT0gJ3VuZGVmaW5lZCcgJiYgdGFnRnJvbS5sZW5ndGggPiAwKSB7XG4gICAgd3gucHJldmlld0ltYWdlKHtcbiAgICAgIGN1cnJlbnQ6IG5vd0ltZ1VybCwgLy8g5b2T5YmN5pi+56S65Zu+54mH55qEaHR0cOmTvuaOpVxuICAgICAgdXJsczogdGhhdC5kYXRhW3RhZ0Zyb21dLmltYWdlVXJscyAvLyDpnIDopoHpooTop4jnmoTlm77niYdodHRw6ZO+5o6l5YiX6KGoXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIOWbvueJh+inhuinieWuvemrmOiuoeeul+WHveaVsOWMulxuICoqL1xuZnVuY3Rpb24gd3hQYXJzZUltZ0xvYWQoZSkge1xuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHZhciB0YWdGcm9tID0gZS50YXJnZXQuZGF0YXNldC5mcm9tO1xuICB2YXIgaWR4ID0gZS50YXJnZXQuZGF0YXNldC5pZHg7XG4gIGlmICh0eXBlb2YgKHRhZ0Zyb20pICE9ICd1bmRlZmluZWQnICYmIHRhZ0Zyb20ubGVuZ3RoID4gMCkge1xuICAgIGNhbE1vcmVJbWFnZUluZm8oZSwgaWR4LCB0aGF0LCB0YWdGcm9tKVxuICB9XG59XG4vLyDlgYflvqrnjq/ojrflj5borqHnrpflm77niYfop4bop4nmnIDkvbPlrr3pq5hcbmZ1bmN0aW9uIGNhbE1vcmVJbWFnZUluZm8oZSwgaWR4LCB0aGF0LCBiaW5kTmFtZSkge1xuICB2YXIgdGVtRGF0YSA9IHRoYXQuZGF0YVtiaW5kTmFtZV07XG4gIGlmICghdGVtRGF0YSB8fCB0ZW1EYXRhLmltYWdlcy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgdGVtSW1hZ2VzID0gdGVtRGF0YS5pbWFnZXM7XG4gIC8v5Zug5Li65peg5rOV6I635Y+Wdmlld+WuveW6piDpnIDopoHoh6rlrprkuYlwYWRkaW5n6L+b6KGM6K6h566X77yM56iN5ZCO5aSE55CGXG4gIHZhciByZWNhbCA9IHd4QXV0b0ltYWdlQ2FsKGUuZGV0YWlsLndpZHRoLCBlLmRldGFpbC5oZWlnaHQsdGhhdCxiaW5kTmFtZSk7XG4gIC8vIHRlbUltYWdlc1tpZHhdLndpZHRoID0gcmVjYWwuaW1hZ2VXaWR0aDtcbiAgLy8gdGVtSW1hZ2VzW2lkeF0uaGVpZ2h0ID0gcmVjYWwuaW1hZ2VoZWlnaHQ7XG4gIC8vIHRlbURhdGEuaW1hZ2VzID0gdGVtSW1hZ2VzO1xuICAvLyB2YXIgYmluZERhdGEgPSB7fTtcbiAgLy8gYmluZERhdGFbYmluZE5hbWVdID0gdGVtRGF0YTtcbiAgLy8gdGhhdC5zZXREYXRhKGJpbmREYXRhKTtcbiAgdmFyIGluZGV4ID0gdGVtSW1hZ2VzW2lkeF0uaW5kZXhcbiAgdmFyIGtleSA9IGAke2JpbmROYW1lfWBcbiAgZm9yICh2YXIgaSBvZiBpbmRleC5zcGxpdCgnLicpKSBrZXkrPWAubm9kZXNbJHtpfV1gXG4gIHZhciBrZXlXID0ga2V5ICsgJy53aWR0aCdcbiAgdmFyIGtleUggPSBrZXkgKyAnLmhlaWdodCdcbiAgdGhhdC5zZXREYXRhKHtcbiAgICBba2V5V106IHJlY2FsLmltYWdlV2lkdGgsXG4gICAgW2tleUhdOiByZWNhbC5pbWFnZWhlaWdodCxcbiAgfSlcbn1cblxuLy8g6K6h566X6KeG6KeJ5LyY5YWI55qE5Zu+54mH5a696auYXG5mdW5jdGlvbiB3eEF1dG9JbWFnZUNhbChvcmlnaW5hbFdpZHRoLCBvcmlnaW5hbEhlaWdodCx0aGF0LGJpbmROYW1lKSB7XG4gIC8v6I635Y+W5Zu+54mH55qE5Y6f5aeL6ZW/5a69XG4gIHZhciB3aW5kb3dXaWR0aCA9IDAsIHdpbmRvd0hlaWdodCA9IDA7XG4gIHZhciBhdXRvV2lkdGggPSAwLCBhdXRvSGVpZ2h0ID0gMDtcbiAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgdmFyIHBhZGRpbmcgPSB0aGF0LmRhdGFbYmluZE5hbWVdLnZpZXcuaW1hZ2VQYWRkaW5nO1xuICB3aW5kb3dXaWR0aCA9IHJlYWxXaW5kb3dXaWR0aC0yKnBhZGRpbmc7XG4gIHdpbmRvd0hlaWdodCA9IHJlYWxXaW5kb3dIZWlnaHQ7XG4gIC8v5Yik5pat5oyJ54Wn6YKj56eN5pa55byP6L+b6KGM57yp5pS+XG4gIC8vIGNvbnNvbGUubG9nKFwid2luZG93V2lkdGhcIiArIHdpbmRvd1dpZHRoKTtcbiAgaWYgKG9yaWdpbmFsV2lkdGggPiB3aW5kb3dXaWR0aCkgey8v5Zyo5Zu+54mHd2lkdGjlpKfkuo7miYvmnLrlsY/luZV3aWR0aOaXtuWAmVxuICAgIGF1dG9XaWR0aCA9IHdpbmRvd1dpZHRoO1xuICAgIC8vIGNvbnNvbGUubG9nKFwiYXV0b1dpZHRoXCIgKyBhdXRvV2lkdGgpO1xuICAgIGF1dG9IZWlnaHQgPSAoYXV0b1dpZHRoICogb3JpZ2luYWxIZWlnaHQpIC8gb3JpZ2luYWxXaWR0aDtcbiAgICAvLyBjb25zb2xlLmxvZyhcImF1dG9IZWlnaHRcIiArIGF1dG9IZWlnaHQpO1xuICAgIHJlc3VsdHMuaW1hZ2VXaWR0aCA9IGF1dG9XaWR0aDtcbiAgICByZXN1bHRzLmltYWdlaGVpZ2h0ID0gYXV0b0hlaWdodDtcbiAgfSBlbHNlIHsvL+WQpuWImeWxleekuuWOn+adpeeahOaVsOaNrlxuICAgIHJlc3VsdHMuaW1hZ2VXaWR0aCA9IG9yaWdpbmFsV2lkdGg7XG4gICAgcmVzdWx0cy5pbWFnZWhlaWdodCA9IG9yaWdpbmFsSGVpZ2h0O1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiB3eFBhcnNlVGVtQXJyYXkodGVtQXJyYXlOYW1lLGJpbmROYW1lUmVnLHRvdGFsLHRoYXQpe1xuICB2YXIgYXJyYXkgPSBbXTtcbiAgdmFyIHRlbURhdGEgPSB0aGF0LmRhdGE7XG4gIHZhciBvYmogPSBudWxsO1xuICBmb3IodmFyIGkgPSAwOyBpIDwgdG90YWw7IGkrKyl7XG4gICAgdmFyIHNpbUFyciA9IHRlbURhdGFbYmluZE5hbWVSZWcraV0ubm9kZXM7XG4gICAgYXJyYXkucHVzaChzaW1BcnIpO1xuICB9XG5cbiAgdGVtQXJyYXlOYW1lID0gdGVtQXJyYXlOYW1lIHx8ICd3eFBhcnNlVGVtQXJyYXknO1xuICBvYmogPSBKU09OLnBhcnNlKCd7XCInKyB0ZW1BcnJheU5hbWUgKydcIjpcIlwifScpO1xuICBvYmpbdGVtQXJyYXlOYW1lXSA9IGFycmF5O1xuICB0aGF0LnNldERhdGEob2JqKTtcbn1cblxuLyoqXG4gKiDphY3nva5lbW9qaXNcbiAqXG4gKi9cblxuZnVuY3Rpb24gZW1vamlzSW5pdChyZWc9JycsYmFzZVNyYz1cIi93eFBhcnNlL2Vtb2ppcy9cIixlbW9qaXMpe1xuICAgSHRtbFRvSnNvbi5lbW9qaXNJbml0KHJlZyxiYXNlU3JjLGVtb2ppcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB3eFBhcnNlOiB3eFBhcnNlLFxuICB3eFBhcnNlVGVtQXJyYXk6d3hQYXJzZVRlbUFycmF5LFxuICBlbW9qaXNJbml0OmVtb2ppc0luaXRcbn1cblxuXG4iXX0=