'use strict';

/**
 * html2Json 改造来自: https://github.com/Jxck/html2json
 * 
 * 
 * author: Di (微信小程序开发工程师)
 * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
 *               垂直微信小程序开发交流社区
 * 
 * github地址: https://github.com/icindy/wxParse
 * 
 * for: 微信小程序富文本解析
 * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
 */

var __placeImgeUrlHttps = "https";
var __emojisReg = '';
var __emojisBaseSrc = '';
var __emojis = {};
var wxDiscode = require('./wxDiscode.js');
var HTMLParser = require('./htmlparser.js');
// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");
// Block Elements - HTML 5
var block = makeMap("br,a,code,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("wxxxcode-style,script,style,view,scroll-view,block");
function makeMap(str) {
    var obj = {},
        items = str.split(",");
    for (var i = 0; i < items.length; i++) {
        obj[items[i]] = true;
    }return obj;
}

function q(v) {
    return '"' + v + '"';
}

function removeDOCTYPE(html) {
    return html.replace(/<\?xml.*\?>\n/, '').replace(/<.*!doctype.*\>\n/, '').replace(/<.*!DOCTYPE.*\>\n/, '');
}

function trimHtml(html) {
    return html.replace(/\n+/g, '').replace(/<!--.*?-->/ig, '').replace(/\/\*.*?\*\//ig, '').replace(/[ ]+</ig, '<');
}

function html2json(html, bindName) {
    //处理字符串
    html = removeDOCTYPE(html);
    html = trimHtml(html);
    html = wxDiscode.strDiscode(html);
    //生成node节点
    var bufArray = [];
    var results = {
        node: bindName,
        nodes: [],
        images: [],
        imageUrls: []
    };
    var index = 0;
    HTMLParser(html, {
        start: function start(tag, attrs, unary) {
            //debug(tag, attrs, unary);
            // node for this element
            var node = {
                node: 'element',
                tag: tag
            };

            if (bufArray.length === 0) {
                node.index = index.toString();
                index += 1;
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length;
            }

            if (block[tag]) {
                node.tagType = "block";
            } else if (inline[tag]) {
                node.tagType = "inline";
            } else if (closeSelf[tag]) {
                node.tagType = "closeSelf";
            }

            if (attrs.length !== 0) {
                node.attr = attrs.reduce(function (pre, attr) {
                    var name = attr.name;
                    var value = attr.value;
                    if (name == 'class') {
                        // console.dir(value);
                        //  value = value.join("")
                        node.classStr = value;
                    }
                    // has multi attibutes
                    // make it array of attribute
                    if (name == 'style') {
                        // console.dir(value);
                        //  value = value.join("")
                        node.styleStr = value;
                    }
                    if (value.match(/ /)) {
                        value = value.split(' ');
                    }

                    // if attr already exists
                    // merge it
                    if (pre[name]) {
                        if (Array.isArray(pre[name])) {
                            // already array, push to last
                            pre[name].push(value);
                        } else {
                            // single value, make it array
                            pre[name] = [pre[name], value];
                        }
                    } else {
                        // not exist, put it
                        pre[name] = value;
                    }

                    return pre;
                }, {});
            }

            //对img添加额外数据
            if (node.tag === 'img') {
                node.imgIndex = results.images.length;
                var imgUrl = node.attr.src;
                if (imgUrl[0] == '') {
                    imgUrl.splice(0, 1);
                }
                imgUrl = wxDiscode.urlToHttpUrl(imgUrl, __placeImgeUrlHttps);
                node.attr.src = imgUrl;
                node.from = bindName;
                results.images.push(node);
                results.imageUrls.push(imgUrl);
            }

            // 处理font标签样式属性
            if (node.tag === 'font') {
                var fontSize = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '-webkit-xxx-large'];
                var styleAttrs = {
                    'color': 'color',
                    'face': 'font-family',
                    'size': 'font-size'
                };
                if (!node.attr.style) node.attr.style = [];
                if (!node.styleStr) node.styleStr = '';
                for (var key in styleAttrs) {
                    if (node.attr[key]) {
                        var value = key === 'size' ? fontSize[node.attr[key] - 1] : node.attr[key];
                        node.attr.style.push(styleAttrs[key]);
                        node.attr.style.push(value);
                        node.styleStr += styleAttrs[key] + ': ' + value + ';';
                    }
                }
            }

            //临时记录source资源
            if (node.tag === 'source') {
                results.source = node.attr.src;
            }

            if (unary) {
                // if this tag dosen't have end tag
                // like <img src="hoge.png"/>
                // add to parents
                var parent = bufArray[0] || results;
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            } else {
                bufArray.unshift(node);
            }
        },
        end: function end(tag) {
            //debug(tag);
            // merge into parent tag
            var node = bufArray.shift();
            if (node.tag !== tag) console.error('invalid state: mismatch end tag');

            //当有缓存source资源时于于video补上src资源
            if (node.tag === 'video' && results.source) {
                node.attr.src = results.source;
                delete result.source;
            }

            if (bufArray.length === 0) {
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            }
        },
        chars: function chars(text) {
            //debug(text);
            var node = {
                node: 'text',
                text: text,
                textArray: transEmojiStr(text)
            };

            if (bufArray.length === 0) {
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length;
                parent.nodes.push(node);
            }
        },
        comment: function comment(text) {
            //debug(text);
            // var node = {
            //     node: 'comment',
            //     text: text,
            // };
            // var parent = bufArray[0];
            // if (parent.nodes === undefined) {
            //     parent.nodes = [];
            // }
            // parent.nodes.push(node);
        }
    });
    return results;
};

function transEmojiStr(str) {
    // var eReg = new RegExp("["+__reg+' '+"]");
    //   str = str.replace(/\[([^\[\]]+)\]/g,':$1:')

    var emojiObjs = [];
    //如果正则表达式为空
    if (__emojisReg.length == 0 || !__emojis) {
        var emojiObj = {};
        emojiObj.node = "text";
        emojiObj.text = str;
        array = [emojiObj];
        return array;
    }
    //这个地方需要调整
    str = str.replace(/\[([^\[\]]+)\]/g, ':$1:');
    var eReg = new RegExp("[:]");
    var array = str.split(eReg);
    for (var i = 0; i < array.length; i++) {
        var ele = array[i];
        var emojiObj = {};
        if (__emojis[ele]) {
            emojiObj.node = "element";
            emojiObj.tag = "emoji";
            emojiObj.text = __emojis[ele];
            emojiObj.baseSrc = __emojisBaseSrc;
        } else {
            emojiObj.node = "text";
            emojiObj.text = ele;
        }
        emojiObjs.push(emojiObj);
    }

    return emojiObjs;
}

function emojisInit() {
    var reg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var baseSrc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/wxParse/emojis/";
    var emojis = arguments[2];

    __emojisReg = reg;
    __emojisBaseSrc = baseSrc;
    __emojis = emojis;
}

module.exports = {
    html2json: html2json,
    emojisInit: emojisInit
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWwyanNvbi5qcyJdLCJuYW1lcyI6WyJfX3BsYWNlSW1nZVVybEh0dHBzIiwiX19lbW9qaXNSZWciLCJfX2Vtb2ppc0Jhc2VTcmMiLCJfX2Vtb2ppcyIsInd4RGlzY29kZSIsInJlcXVpcmUiLCJIVE1MUGFyc2VyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwic3RyIiwib2JqIiwiaXRlbXMiLCJzcGxpdCIsImkiLCJsZW5ndGgiLCJxIiwidiIsInJlbW92ZURPQ1RZUEUiLCJodG1sIiwicmVwbGFjZSIsInRyaW1IdG1sIiwiaHRtbDJqc29uIiwiYmluZE5hbWUiLCJzdHJEaXNjb2RlIiwiYnVmQXJyYXkiLCJyZXN1bHRzIiwibm9kZSIsIm5vZGVzIiwiaW1hZ2VzIiwiaW1hZ2VVcmxzIiwiaW5kZXgiLCJzdGFydCIsInRhZyIsImF0dHJzIiwidW5hcnkiLCJ0b1N0cmluZyIsInBhcmVudCIsInVuZGVmaW5lZCIsInRhZ1R5cGUiLCJhdHRyIiwicmVkdWNlIiwicHJlIiwibmFtZSIsInZhbHVlIiwiY29uc29sZSIsImRpciIsImNsYXNzU3RyIiwic3R5bGVTdHIiLCJtYXRjaCIsIkFycmF5IiwiaXNBcnJheSIsInB1c2giLCJpbWdJbmRleCIsImltZ1VybCIsInNyYyIsInNwbGljZSIsInVybFRvSHR0cFVybCIsImZyb20iLCJmb250U2l6ZSIsInN0eWxlQXR0cnMiLCJzdHlsZSIsImtleSIsInNvdXJjZSIsInVuc2hpZnQiLCJlbmQiLCJzaGlmdCIsImVycm9yIiwicmVzdWx0IiwiY2hhcnMiLCJ0ZXh0IiwidGV4dEFycmF5IiwidHJhbnNFbW9qaVN0ciIsImNvbW1lbnQiLCJlbW9qaU9ianMiLCJlbW9qaU9iaiIsImFycmF5IiwiZVJlZyIsIlJlZ0V4cCIsImVsZSIsImJhc2VTcmMiLCJlbW9qaXNJbml0IiwicmVnIiwiZW1vamlzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFjQSxJQUFJQSxzQkFBc0IsT0FBMUI7QUFDQSxJQUFJQyxjQUFjLEVBQWxCO0FBQ0EsSUFBSUMsa0JBQWtCLEVBQXRCO0FBQ0EsSUFBSUMsV0FBVyxFQUFmO0FBQ0EsSUFBSUMsWUFBWUMsUUFBUSxnQkFBUixDQUFoQjtBQUNBLElBQUlDLGFBQWFELFFBQVEsaUJBQVIsQ0FBakI7QUFDQTtBQUNBLElBQUlFLFFBQVFDLFFBQVEsb0dBQVIsQ0FBWjtBQUNBO0FBQ0EsSUFBSUMsUUFBUUQsUUFBUSx1VEFBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUUsU0FBU0YsUUFBUSwwTEFBUixDQUFiOztBQUVBO0FBQ0E7QUFDQSxJQUFJRyxZQUFZSCxRQUFRLGtEQUFSLENBQWhCOztBQUVBO0FBQ0EsSUFBSUksWUFBWUosUUFBUSx3R0FBUixDQUFoQjs7QUFFQTtBQUNBLElBQUlLLFVBQVVMLFFBQVEsb0RBQVIsQ0FBZDtBQUNBLFNBQVNBLE9BQVQsQ0FBaUJNLEdBQWpCLEVBQXNCO0FBQ2xCLFFBQUlDLE1BQU0sRUFBVjtBQUFBLFFBQWNDLFFBQVFGLElBQUlHLEtBQUosQ0FBVSxHQUFWLENBQXRCO0FBQ0EsU0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlGLE1BQU1HLE1BQTFCLEVBQWtDRCxHQUFsQztBQUNJSCxZQUFJQyxNQUFNRSxDQUFOLENBQUosSUFBZ0IsSUFBaEI7QUFESixLQUVBLE9BQU9ILEdBQVA7QUFDSDs7QUFFRCxTQUFTSyxDQUFULENBQVdDLENBQVgsRUFBYztBQUNWLFdBQU8sTUFBTUEsQ0FBTixHQUFVLEdBQWpCO0FBQ0g7O0FBRUQsU0FBU0MsYUFBVCxDQUF1QkMsSUFBdkIsRUFBNkI7QUFDekIsV0FBT0EsS0FDRkMsT0FERSxDQUNNLGVBRE4sRUFDdUIsRUFEdkIsRUFFRkEsT0FGRSxDQUVNLG1CQUZOLEVBRTJCLEVBRjNCLEVBR0ZBLE9BSEUsQ0FHTSxtQkFITixFQUcyQixFQUgzQixDQUFQO0FBSUg7O0FBRUQsU0FBU0MsUUFBVCxDQUFrQkYsSUFBbEIsRUFBd0I7QUFDdEIsV0FBT0EsS0FDQUMsT0FEQSxDQUNRLE1BRFIsRUFDZ0IsRUFEaEIsRUFFQUEsT0FGQSxDQUVRLGNBRlIsRUFFd0IsRUFGeEIsRUFHQUEsT0FIQSxDQUdRLGVBSFIsRUFHeUIsRUFIekIsRUFJQUEsT0FKQSxDQUlRLFNBSlIsRUFJbUIsR0FKbkIsQ0FBUDtBQUtEOztBQUdELFNBQVNFLFNBQVQsQ0FBbUJILElBQW5CLEVBQXlCSSxRQUF6QixFQUFtQztBQUMvQjtBQUNBSixXQUFPRCxjQUFjQyxJQUFkLENBQVA7QUFDQUEsV0FBT0UsU0FBU0YsSUFBVCxDQUFQO0FBQ0FBLFdBQU9uQixVQUFVd0IsVUFBVixDQUFxQkwsSUFBckIsQ0FBUDtBQUNBO0FBQ0EsUUFBSU0sV0FBVyxFQUFmO0FBQ0EsUUFBSUMsVUFBVTtBQUNWQyxjQUFNSixRQURJO0FBRVZLLGVBQU8sRUFGRztBQUdWQyxnQkFBTyxFQUhHO0FBSVZDLG1CQUFVO0FBSkEsS0FBZDtBQU1BLFFBQUlDLFFBQVEsQ0FBWjtBQUNBN0IsZUFBV2lCLElBQVgsRUFBaUI7QUFDYmEsZUFBTyxlQUFVQyxHQUFWLEVBQWVDLEtBQWYsRUFBc0JDLEtBQXRCLEVBQTZCO0FBQ2hDO0FBQ0E7QUFDQSxnQkFBSVIsT0FBTztBQUNQQSxzQkFBTSxTQURDO0FBRVBNLHFCQUFLQTtBQUZFLGFBQVg7O0FBS0EsZ0JBQUlSLFNBQVNWLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkI7QUFDdkJZLHFCQUFLSSxLQUFMLEdBQWFBLE1BQU1LLFFBQU4sRUFBYjtBQUNBTCx5QkFBUyxDQUFUO0FBQ0gsYUFIRCxNQUdPO0FBQ0gsb0JBQUlNLFNBQVNaLFNBQVMsQ0FBVCxDQUFiO0FBQ0Esb0JBQUlZLE9BQU9ULEtBQVAsS0FBaUJVLFNBQXJCLEVBQWdDO0FBQzVCRCwyQkFBT1QsS0FBUCxHQUFlLEVBQWY7QUFDSDtBQUNERCxxQkFBS0ksS0FBTCxHQUFhTSxPQUFPTixLQUFQLEdBQWUsR0FBZixHQUFxQk0sT0FBT1QsS0FBUCxDQUFhYixNQUEvQztBQUNIOztBQUVELGdCQUFJVixNQUFNNEIsR0FBTixDQUFKLEVBQWdCO0FBQ1pOLHFCQUFLWSxPQUFMLEdBQWUsT0FBZjtBQUNILGFBRkQsTUFFTyxJQUFJakMsT0FBTzJCLEdBQVAsQ0FBSixFQUFpQjtBQUNwQk4scUJBQUtZLE9BQUwsR0FBZSxRQUFmO0FBQ0gsYUFGTSxNQUVBLElBQUloQyxVQUFVMEIsR0FBVixDQUFKLEVBQW9CO0FBQ3ZCTixxQkFBS1ksT0FBTCxHQUFlLFdBQWY7QUFDSDs7QUFFRCxnQkFBSUwsTUFBTW5CLE1BQU4sS0FBaUIsQ0FBckIsRUFBd0I7QUFDcEJZLHFCQUFLYSxJQUFMLEdBQVlOLE1BQU1PLE1BQU4sQ0FBYSxVQUFVQyxHQUFWLEVBQWVGLElBQWYsRUFBcUI7QUFDMUMsd0JBQUlHLE9BQU9ILEtBQUtHLElBQWhCO0FBQ0Esd0JBQUlDLFFBQVFKLEtBQUtJLEtBQWpCO0FBQ0Esd0JBQUlELFFBQVEsT0FBWixFQUFxQjtBQUNqQkUsZ0NBQVFDLEdBQVIsQ0FBWUYsS0FBWjtBQUNBO0FBQ0FqQiw2QkFBS29CLFFBQUwsR0FBZ0JILEtBQWhCO0FBQ0g7QUFDRDtBQUNBO0FBQ0Esd0JBQUlELFFBQVEsT0FBWixFQUFxQjtBQUNqQkUsZ0NBQVFDLEdBQVIsQ0FBWUYsS0FBWjtBQUNBO0FBQ0FqQiw2QkFBS3FCLFFBQUwsR0FBZ0JKLEtBQWhCO0FBQ0g7QUFDRCx3QkFBSUEsTUFBTUssS0FBTixDQUFZLEdBQVosQ0FBSixFQUFzQjtBQUNsQkwsZ0NBQVFBLE1BQU0vQixLQUFOLENBQVksR0FBWixDQUFSO0FBQ0g7O0FBR0Q7QUFDQTtBQUNBLHdCQUFJNkIsSUFBSUMsSUFBSixDQUFKLEVBQWU7QUFDWCw0QkFBSU8sTUFBTUMsT0FBTixDQUFjVCxJQUFJQyxJQUFKLENBQWQsQ0FBSixFQUE4QjtBQUMxQjtBQUNBRCxnQ0FBSUMsSUFBSixFQUFVUyxJQUFWLENBQWVSLEtBQWY7QUFDSCx5QkFIRCxNQUdPO0FBQ0g7QUFDQUYsZ0NBQUlDLElBQUosSUFBWSxDQUFDRCxJQUFJQyxJQUFKLENBQUQsRUFBWUMsS0FBWixDQUFaO0FBQ0g7QUFDSixxQkFSRCxNQVFPO0FBQ0g7QUFDQUYsNEJBQUlDLElBQUosSUFBWUMsS0FBWjtBQUNIOztBQUVELDJCQUFPRixHQUFQO0FBQ0gsaUJBcENXLEVBb0NULEVBcENTLENBQVo7QUFxQ0g7O0FBRUQ7QUFDQSxnQkFBSWYsS0FBS00sR0FBTCxLQUFhLEtBQWpCLEVBQXdCO0FBQ3BCTixxQkFBSzBCLFFBQUwsR0FBZ0IzQixRQUFRRyxNQUFSLENBQWVkLE1BQS9CO0FBQ0Esb0JBQUl1QyxTQUFTM0IsS0FBS2EsSUFBTCxDQUFVZSxHQUF2QjtBQUNBLG9CQUFJRCxPQUFPLENBQVAsS0FBYSxFQUFqQixFQUFxQjtBQUNqQkEsMkJBQU9FLE1BQVAsQ0FBYyxDQUFkLEVBQWlCLENBQWpCO0FBQ0g7QUFDREYseUJBQVN0RCxVQUFVeUQsWUFBVixDQUF1QkgsTUFBdkIsRUFBK0IxRCxtQkFBL0IsQ0FBVDtBQUNBK0IscUJBQUthLElBQUwsQ0FBVWUsR0FBVixHQUFnQkQsTUFBaEI7QUFDQTNCLHFCQUFLK0IsSUFBTCxHQUFZbkMsUUFBWjtBQUNBRyx3QkFBUUcsTUFBUixDQUFldUIsSUFBZixDQUFvQnpCLElBQXBCO0FBQ0FELHdCQUFRSSxTQUFSLENBQWtCc0IsSUFBbEIsQ0FBdUJFLE1BQXZCO0FBQ0g7O0FBRUQ7QUFDQSxnQkFBSTNCLEtBQUtNLEdBQUwsS0FBYSxNQUFqQixFQUF5QjtBQUNyQixvQkFBSTBCLFdBQVcsQ0FBQyxTQUFELEVBQVksT0FBWixFQUFxQixRQUFyQixFQUErQixPQUEvQixFQUF3QyxTQUF4QyxFQUFtRCxVQUFuRCxFQUErRCxtQkFBL0QsQ0FBZjtBQUNBLG9CQUFJQyxhQUFhO0FBQ2IsNkJBQVMsT0FESTtBQUViLDRCQUFRLGFBRks7QUFHYiw0QkFBUTtBQUhLLGlCQUFqQjtBQUtBLG9CQUFJLENBQUNqQyxLQUFLYSxJQUFMLENBQVVxQixLQUFmLEVBQXNCbEMsS0FBS2EsSUFBTCxDQUFVcUIsS0FBVixHQUFrQixFQUFsQjtBQUN0QixvQkFBSSxDQUFDbEMsS0FBS3FCLFFBQVYsRUFBb0JyQixLQUFLcUIsUUFBTCxHQUFnQixFQUFoQjtBQUNwQixxQkFBSyxJQUFJYyxHQUFULElBQWdCRixVQUFoQixFQUE0QjtBQUN4Qix3QkFBSWpDLEtBQUthLElBQUwsQ0FBVXNCLEdBQVYsQ0FBSixFQUFvQjtBQUNoQiw0QkFBSWxCLFFBQVFrQixRQUFRLE1BQVIsR0FBaUJILFNBQVNoQyxLQUFLYSxJQUFMLENBQVVzQixHQUFWLElBQWUsQ0FBeEIsQ0FBakIsR0FBOENuQyxLQUFLYSxJQUFMLENBQVVzQixHQUFWLENBQTFEO0FBQ0FuQyw2QkFBS2EsSUFBTCxDQUFVcUIsS0FBVixDQUFnQlQsSUFBaEIsQ0FBcUJRLFdBQVdFLEdBQVgsQ0FBckI7QUFDQW5DLDZCQUFLYSxJQUFMLENBQVVxQixLQUFWLENBQWdCVCxJQUFoQixDQUFxQlIsS0FBckI7QUFDQWpCLDZCQUFLcUIsUUFBTCxJQUFpQlksV0FBV0UsR0FBWCxJQUFrQixJQUFsQixHQUF5QmxCLEtBQXpCLEdBQWlDLEdBQWxEO0FBQ0g7QUFDSjtBQUNKOztBQUVEO0FBQ0EsZ0JBQUdqQixLQUFLTSxHQUFMLEtBQWEsUUFBaEIsRUFBeUI7QUFDckJQLHdCQUFRcUMsTUFBUixHQUFpQnBDLEtBQUthLElBQUwsQ0FBVWUsR0FBM0I7QUFDSDs7QUFFRCxnQkFBSXBCLEtBQUosRUFBVztBQUNQO0FBQ0E7QUFDQTtBQUNBLG9CQUFJRSxTQUFTWixTQUFTLENBQVQsS0FBZUMsT0FBNUI7QUFDQSxvQkFBSVcsT0FBT1QsS0FBUCxLQUFpQlUsU0FBckIsRUFBZ0M7QUFDNUJELDJCQUFPVCxLQUFQLEdBQWUsRUFBZjtBQUNIO0FBQ0RTLHVCQUFPVCxLQUFQLENBQWF3QixJQUFiLENBQWtCekIsSUFBbEI7QUFDSCxhQVRELE1BU087QUFDSEYseUJBQVN1QyxPQUFULENBQWlCckMsSUFBakI7QUFDSDtBQUNKLFNBdkhZO0FBd0hic0MsYUFBSyxhQUFVaEMsR0FBVixFQUFlO0FBQ2hCO0FBQ0E7QUFDQSxnQkFBSU4sT0FBT0YsU0FBU3lDLEtBQVQsRUFBWDtBQUNBLGdCQUFJdkMsS0FBS00sR0FBTCxLQUFhQSxHQUFqQixFQUFzQlksUUFBUXNCLEtBQVIsQ0FBYyxpQ0FBZDs7QUFFdEI7QUFDQSxnQkFBR3hDLEtBQUtNLEdBQUwsS0FBYSxPQUFiLElBQXdCUCxRQUFRcUMsTUFBbkMsRUFBMEM7QUFDdENwQyxxQkFBS2EsSUFBTCxDQUFVZSxHQUFWLEdBQWdCN0IsUUFBUXFDLE1BQXhCO0FBQ0EsdUJBQU9LLE9BQU9MLE1BQWQ7QUFDSDs7QUFFRCxnQkFBSXRDLFNBQVNWLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkI7QUFDdkJXLHdCQUFRRSxLQUFSLENBQWN3QixJQUFkLENBQW1CekIsSUFBbkI7QUFDSCxhQUZELE1BRU87QUFDSCxvQkFBSVUsU0FBU1osU0FBUyxDQUFULENBQWI7QUFDQSxvQkFBSVksT0FBT1QsS0FBUCxLQUFpQlUsU0FBckIsRUFBZ0M7QUFDNUJELDJCQUFPVCxLQUFQLEdBQWUsRUFBZjtBQUNIO0FBQ0RTLHVCQUFPVCxLQUFQLENBQWF3QixJQUFiLENBQWtCekIsSUFBbEI7QUFDSDtBQUNKLFNBN0lZO0FBOEliMEMsZUFBTyxlQUFVQyxJQUFWLEVBQWdCO0FBQ25CO0FBQ0EsZ0JBQUkzQyxPQUFPO0FBQ1BBLHNCQUFNLE1BREM7QUFFUDJDLHNCQUFNQSxJQUZDO0FBR1BDLDJCQUFVQyxjQUFjRixJQUFkO0FBSEgsYUFBWDs7QUFNQSxnQkFBSTdDLFNBQVNWLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkI7QUFDdkJXLHdCQUFRRSxLQUFSLENBQWN3QixJQUFkLENBQW1CekIsSUFBbkI7QUFDSCxhQUZELE1BRU87QUFDSCxvQkFBSVUsU0FBU1osU0FBUyxDQUFULENBQWI7QUFDQSxvQkFBSVksT0FBT1QsS0FBUCxLQUFpQlUsU0FBckIsRUFBZ0M7QUFDNUJELDJCQUFPVCxLQUFQLEdBQWUsRUFBZjtBQUNIO0FBQ0RELHFCQUFLSSxLQUFMLEdBQWFNLE9BQU9OLEtBQVAsR0FBZSxHQUFmLEdBQXFCTSxPQUFPVCxLQUFQLENBQWFiLE1BQS9DO0FBQ0FzQix1QkFBT1QsS0FBUCxDQUFhd0IsSUFBYixDQUFrQnpCLElBQWxCO0FBQ0g7QUFDSixTQWhLWTtBQWlLYjhDLGlCQUFTLGlCQUFVSCxJQUFWLEVBQWdCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0g7QUE1S1ksS0FBakI7QUE4S0EsV0FBTzVDLE9BQVA7QUFDSDs7QUFFRCxTQUFTOEMsYUFBVCxDQUF1QjlELEdBQXZCLEVBQTJCO0FBQ3pCO0FBQ0Y7O0FBRUUsUUFBSWdFLFlBQVksRUFBaEI7QUFDQTtBQUNBLFFBQUc3RSxZQUFZa0IsTUFBWixJQUFzQixDQUF0QixJQUEyQixDQUFDaEIsUUFBL0IsRUFBd0M7QUFDcEMsWUFBSTRFLFdBQVcsRUFBZjtBQUNBQSxpQkFBU2hELElBQVQsR0FBZ0IsTUFBaEI7QUFDQWdELGlCQUFTTCxJQUFULEdBQWdCNUQsR0FBaEI7QUFDQWtFLGdCQUFRLENBQUNELFFBQUQsQ0FBUjtBQUNBLGVBQU9DLEtBQVA7QUFDSDtBQUNEO0FBQ0FsRSxVQUFNQSxJQUFJVSxPQUFKLENBQVksaUJBQVosRUFBOEIsTUFBOUIsQ0FBTjtBQUNBLFFBQUl5RCxPQUFPLElBQUlDLE1BQUosQ0FBVyxLQUFYLENBQVg7QUFDQSxRQUFJRixRQUFRbEUsSUFBSUcsS0FBSixDQUFVZ0UsSUFBVixDQUFaO0FBQ0EsU0FBSSxJQUFJL0QsSUFBSSxDQUFaLEVBQWVBLElBQUk4RCxNQUFNN0QsTUFBekIsRUFBaUNELEdBQWpDLEVBQXFDO0FBQ25DLFlBQUlpRSxNQUFNSCxNQUFNOUQsQ0FBTixDQUFWO0FBQ0EsWUFBSTZELFdBQVcsRUFBZjtBQUNBLFlBQUc1RSxTQUFTZ0YsR0FBVCxDQUFILEVBQWlCO0FBQ2ZKLHFCQUFTaEQsSUFBVCxHQUFnQixTQUFoQjtBQUNBZ0QscUJBQVMxQyxHQUFULEdBQWUsT0FBZjtBQUNBMEMscUJBQVNMLElBQVQsR0FBZ0J2RSxTQUFTZ0YsR0FBVCxDQUFoQjtBQUNBSixxQkFBU0ssT0FBVCxHQUFrQmxGLGVBQWxCO0FBQ0QsU0FMRCxNQUtLO0FBQ0g2RSxxQkFBU2hELElBQVQsR0FBZ0IsTUFBaEI7QUFDQWdELHFCQUFTTCxJQUFULEdBQWdCUyxHQUFoQjtBQUNEO0FBQ0RMLGtCQUFVdEIsSUFBVixDQUFldUIsUUFBZjtBQUNEOztBQUVELFdBQU9ELFNBQVA7QUFDRDs7QUFFRCxTQUFTTyxVQUFULEdBQTZEO0FBQUEsUUFBekNDLEdBQXlDLHVFQUFyQyxFQUFxQztBQUFBLFFBQWxDRixPQUFrQyx1RUFBMUIsa0JBQTBCO0FBQUEsUUFBUEcsTUFBTzs7QUFDekR0RixrQkFBY3FGLEdBQWQ7QUFDQXBGLHNCQUFnQmtGLE9BQWhCO0FBQ0FqRixlQUFTb0YsTUFBVDtBQUNIOztBQUVEQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2IvRCxlQUFXQSxTQURFO0FBRWIyRCxnQkFBV0E7QUFGRSxDQUFqQiIsImZpbGUiOiJodG1sMmpzb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGh0bWwySnNvbiDmlLnpgKDmnaXoh6o6IGh0dHBzOi8vZ2l0aHViLmNvbS9KeGNrL2h0bWwyanNvblxuICogXG4gKiBcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcbiAqIG9yZ2FuaXphdGlvbjogV2VBcHBEZXYo5b6u5L+h5bCP56iL5bqP5byA5Y+R6K665Z2bKShodHRwOi8vd2VhcHBkZXYuY29tKVxuICogICAgICAgICAgICAgICDlnoLnm7Tlvq7kv6HlsI/nqIvluo/lvIDlj5HkuqTmtYHnpL7ljLpcbiAqIFxuICogZ2l0aHVi5Zyw5Z2AOiBodHRwczovL2dpdGh1Yi5jb20vaWNpbmR5L3d4UGFyc2VcbiAqIFxuICogZm9yOiDlvq7kv6HlsI/nqIvluo/lr4zmlofmnKzop6PmnpBcbiAqIGRldGFpbCA6IGh0dHA6Ly93ZWFwcGRldi5jb20vdC93eHBhcnNlLWFscGhhMC0xLWh0bWwtbWFya2Rvd24vMTg0XG4gKi9cblxudmFyIF9fcGxhY2VJbWdlVXJsSHR0cHMgPSBcImh0dHBzXCI7XG52YXIgX19lbW9qaXNSZWcgPSAnJztcbnZhciBfX2Vtb2ppc0Jhc2VTcmMgPSAnJztcbnZhciBfX2Vtb2ppcyA9IHt9O1xudmFyIHd4RGlzY29kZSA9IHJlcXVpcmUoJy4vd3hEaXNjb2RlLmpzJyk7XG52YXIgSFRNTFBhcnNlciA9IHJlcXVpcmUoJy4vaHRtbHBhcnNlci5qcycpO1xuLy8gRW1wdHkgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBlbXB0eSA9IG1ha2VNYXAoXCJhcmVhLGJhc2UsYmFzZWZvbnQsYnIsY29sLGZyYW1lLGhyLGltZyxpbnB1dCxsaW5rLG1ldGEscGFyYW0sZW1iZWQsY29tbWFuZCxrZXlnZW4sc291cmNlLHRyYWNrLHdiclwiKTtcbi8vIEJsb2NrIEVsZW1lbnRzIC0gSFRNTCA1XG52YXIgYmxvY2sgPSBtYWtlTWFwKFwiYnIsYSxjb2RlLGFkZHJlc3MsYXJ0aWNsZSxhcHBsZXQsYXNpZGUsYXVkaW8sYmxvY2txdW90ZSxidXR0b24sY2FudmFzLGNlbnRlcixkZCxkZWwsZGlyLGRpdixkbCxkdCxmaWVsZHNldCxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsZm9ybSxmcmFtZXNldCxoMSxoMixoMyxoNCxoNSxoNixoZWFkZXIsaGdyb3VwLGhyLGlmcmFtZSxpbnMsaXNpbmRleCxsaSxtYXAsbWVudSxub2ZyYW1lcyxub3NjcmlwdCxvYmplY3Qsb2wsb3V0cHV0LHAscHJlLHNlY3Rpb24sc2NyaXB0LHRhYmxlLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyLHVsLHZpZGVvXCIpO1xuXG4vLyBJbmxpbmUgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBpbmxpbmUgPSBtYWtlTWFwKFwiYWJicixhY3JvbnltLGFwcGxldCxiLGJhc2Vmb250LGJkbyxiaWcsYnV0dG9uLGNpdGUsZGVsLGRmbixlbSxmb250LGksaWZyYW1lLGltZyxpbnB1dCxpbnMsa2JkLGxhYmVsLG1hcCxvYmplY3QscSxzLHNhbXAsc2NyaXB0LHNlbGVjdCxzbWFsbCxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0ZXh0YXJlYSx0dCx1LHZhclwiKTtcblxuLy8gRWxlbWVudHMgdGhhdCB5b3UgY2FuLCBpbnRlbnRpb25hbGx5LCBsZWF2ZSBvcGVuXG4vLyAoYW5kIHdoaWNoIGNsb3NlIHRoZW1zZWx2ZXMpXG52YXIgY2xvc2VTZWxmID0gbWFrZU1hcChcImNvbGdyb3VwLGRkLGR0LGxpLG9wdGlvbnMscCx0ZCx0Zm9vdCx0aCx0aGVhZCx0clwiKTtcblxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgdGhlaXIgdmFsdWVzIGZpbGxlZCBpbiBkaXNhYmxlZD1cImRpc2FibGVkXCJcbnZhciBmaWxsQXR0cnMgPSBtYWtlTWFwKFwiY2hlY2tlZCxjb21wYWN0LGRlY2xhcmUsZGVmZXIsZGlzYWJsZWQsaXNtYXAsbXVsdGlwbGUsbm9ocmVmLG5vcmVzaXplLG5vc2hhZGUsbm93cmFwLHJlYWRvbmx5LHNlbGVjdGVkXCIpO1xuXG4vLyBTcGVjaWFsIEVsZW1lbnRzIChjYW4gY29udGFpbiBhbnl0aGluZylcbnZhciBzcGVjaWFsID0gbWFrZU1hcChcInd4eHhjb2RlLXN0eWxlLHNjcmlwdCxzdHlsZSx2aWV3LHNjcm9sbC12aWV3LGJsb2NrXCIpO1xuZnVuY3Rpb24gbWFrZU1hcChzdHIpIHtcbiAgICB2YXIgb2JqID0ge30sIGl0ZW1zID0gc3RyLnNwbGl0KFwiLFwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxuICAgICAgICBvYmpbaXRlbXNbaV1dID0gdHJ1ZTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBxKHYpIHtcbiAgICByZXR1cm4gJ1wiJyArIHYgKyAnXCInO1xufVxuXG5mdW5jdGlvbiByZW1vdmVET0NUWVBFKGh0bWwpIHtcbiAgICByZXR1cm4gaHRtbFxuICAgICAgICAucmVwbGFjZSgvPFxcP3htbC4qXFw/Plxcbi8sICcnKVxuICAgICAgICAucmVwbGFjZSgvPC4qIWRvY3R5cGUuKlxcPlxcbi8sICcnKVxuICAgICAgICAucmVwbGFjZSgvPC4qIURPQ1RZUEUuKlxcPlxcbi8sICcnKTtcbn1cblxuZnVuY3Rpb24gdHJpbUh0bWwoaHRtbCkge1xuICByZXR1cm4gaHRtbFxuICAgICAgICAucmVwbGFjZSgvXFxuKy9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoLzwhLS0uKj8tLT4vaWcsICcnKVxuICAgICAgICAucmVwbGFjZSgvXFwvXFwqLio/XFwqXFwvL2lnLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1sgXSs8L2lnLCAnPCcpXG59XG5cblxuZnVuY3Rpb24gaHRtbDJqc29uKGh0bWwsIGJpbmROYW1lKSB7XG4gICAgLy/lpITnkIblrZfnrKbkuLJcbiAgICBodG1sID0gcmVtb3ZlRE9DVFlQRShodG1sKTtcbiAgICBodG1sID0gdHJpbUh0bWwoaHRtbCk7XG4gICAgaHRtbCA9IHd4RGlzY29kZS5zdHJEaXNjb2RlKGh0bWwpO1xuICAgIC8v55Sf5oiQbm9kZeiKgueCuVxuICAgIHZhciBidWZBcnJheSA9IFtdO1xuICAgIHZhciByZXN1bHRzID0ge1xuICAgICAgICBub2RlOiBiaW5kTmFtZSxcbiAgICAgICAgbm9kZXM6IFtdLFxuICAgICAgICBpbWFnZXM6W10sXG4gICAgICAgIGltYWdlVXJsczpbXVxuICAgIH07XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBIVE1MUGFyc2VyKGh0bWwsIHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICh0YWcsIGF0dHJzLCB1bmFyeSkge1xuICAgICAgICAgICAgLy9kZWJ1Zyh0YWcsIGF0dHJzLCB1bmFyeSk7XG4gICAgICAgICAgICAvLyBub2RlIGZvciB0aGlzIGVsZW1lbnRcbiAgICAgICAgICAgIHZhciBub2RlID0ge1xuICAgICAgICAgICAgICAgIG5vZGU6ICdlbGVtZW50JyxcbiAgICAgICAgICAgICAgICB0YWc6IHRhZyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChidWZBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBub2RlLmluZGV4ID0gaW5kZXgudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgIGluZGV4ICs9IDFcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQubm9kZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IHBhcmVudC5pbmRleCArICcuJyArIHBhcmVudC5ub2Rlcy5sZW5ndGhcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJsb2NrW3RhZ10pIHtcbiAgICAgICAgICAgICAgICBub2RlLnRhZ1R5cGUgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlubGluZVt0YWddKSB7XG4gICAgICAgICAgICAgICAgbm9kZS50YWdUeXBlID0gXCJpbmxpbmVcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xvc2VTZWxmW3RhZ10pIHtcbiAgICAgICAgICAgICAgICBub2RlLnRhZ1R5cGUgPSBcImNsb3NlU2VsZlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYXR0cnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hdHRyID0gYXR0cnMucmVkdWNlKGZ1bmN0aW9uIChwcmUsIGF0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGF0dHIudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lID09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICB2YWx1ZSA9IHZhbHVlLmpvaW4oXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2xhc3NTdHIgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBoYXMgbXVsdGkgYXR0aWJ1dGVzXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2UgaXQgYXJyYXkgb2YgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lID09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICB2YWx1ZSA9IHZhbHVlLmpvaW4oXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGVTdHIgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUubWF0Y2goLyAvKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGF0dHIgYWxyZWFkeSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgLy8gbWVyZ2UgaXRcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZVtuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJlW25hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgYXJyYXksIHB1c2ggdG8gbGFzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZVtuYW1lXS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIHZhbHVlLCBtYWtlIGl0IGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlW25hbWVdID0gW3ByZVtuYW1lXSwgdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90IGV4aXN0LCBwdXQgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZVtuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZTtcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8v5a+5aW1n5re75Yqg6aKd5aSW5pWw5o2uXG4gICAgICAgICAgICBpZiAobm9kZS50YWcgPT09ICdpbWcnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pbWdJbmRleCA9IHJlc3VsdHMuaW1hZ2VzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgaW1nVXJsID0gbm9kZS5hdHRyLnNyYztcbiAgICAgICAgICAgICAgICBpZiAoaW1nVXJsWzBdID09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGltZ1VybC5zcGxpY2UoMCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGltZ1VybCA9IHd4RGlzY29kZS51cmxUb0h0dHBVcmwoaW1nVXJsLCBfX3BsYWNlSW1nZVVybEh0dHBzKTtcbiAgICAgICAgICAgICAgICBub2RlLmF0dHIuc3JjID0gaW1nVXJsO1xuICAgICAgICAgICAgICAgIG5vZGUuZnJvbSA9IGJpbmROYW1lO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMuaW1hZ2VzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5pbWFnZVVybHMucHVzaChpbWdVcmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlpITnkIZmb2505qCH562+5qC35byP5bGe5oCnXG4gICAgICAgICAgICBpZiAobm9kZS50YWcgPT09ICdmb250Jykge1xuICAgICAgICAgICAgICAgIHZhciBmb250U2l6ZSA9IFsneC1zbWFsbCcsICdzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnLCAneC1sYXJnZScsICd4eC1sYXJnZScsICctd2Via2l0LXh4eC1sYXJnZSddO1xuICAgICAgICAgICAgICAgIHZhciBzdHlsZUF0dHJzID0ge1xuICAgICAgICAgICAgICAgICAgICAnY29sb3InOiAnY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAnZmFjZSc6ICdmb250LWZhbWlseScsXG4gICAgICAgICAgICAgICAgICAgICdzaXplJzogJ2ZvbnQtc2l6ZSdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICghbm9kZS5hdHRyLnN0eWxlKSBub2RlLmF0dHIuc3R5bGUgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuc3R5bGVTdHIpIG5vZGUuc3R5bGVTdHIgPSAnJztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3R5bGVBdHRycykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5hdHRyW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGtleSA9PT0gJ3NpemUnID8gZm9udFNpemVbbm9kZS5hdHRyW2tleV0tMV0gOiBub2RlLmF0dHJba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zdHlsZS5wdXNoKHN0eWxlQXR0cnNba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmF0dHIuc3R5bGUucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlU3RyICs9IHN0eWxlQXR0cnNba2V5XSArICc6ICcgKyB2YWx1ZSArICc7JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy/kuLTml7borrDlvZVzb3VyY2XotYTmupBcbiAgICAgICAgICAgIGlmKG5vZGUudGFnID09PSAnc291cmNlJyl7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5zb3VyY2UgPSBub2RlLmF0dHIuc3JjO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodW5hcnkpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIHRhZyBkb3Nlbid0IGhhdmUgZW5kIHRhZ1xuICAgICAgICAgICAgICAgIC8vIGxpa2UgPGltZyBzcmM9XCJob2dlLnBuZ1wiLz5cbiAgICAgICAgICAgICAgICAvLyBhZGQgdG8gcGFyZW50c1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBidWZBcnJheVswXSB8fCByZXN1bHRzO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQubm9kZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50Lm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJ1ZkFycmF5LnVuc2hpZnQobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVuZDogZnVuY3Rpb24gKHRhZykge1xuICAgICAgICAgICAgLy9kZWJ1Zyh0YWcpO1xuICAgICAgICAgICAgLy8gbWVyZ2UgaW50byBwYXJlbnQgdGFnXG4gICAgICAgICAgICB2YXIgbm9kZSA9IGJ1ZkFycmF5LnNoaWZ0KCk7XG4gICAgICAgICAgICBpZiAobm9kZS50YWcgIT09IHRhZykgY29uc29sZS5lcnJvcignaW52YWxpZCBzdGF0ZTogbWlzbWF0Y2ggZW5kIHRhZycpO1xuXG4gICAgICAgICAgICAvL+W9k+aciee8k+WtmHNvdXJjZei1hOa6kOaXtuS6juS6jnZpZGVv6KGl5LiKc3Jj6LWE5rqQXG4gICAgICAgICAgICBpZihub2RlLnRhZyA9PT0gJ3ZpZGVvJyAmJiByZXN1bHRzLnNvdXJjZSl7XG4gICAgICAgICAgICAgICAgbm9kZS5hdHRyLnNyYyA9IHJlc3VsdHMuc291cmNlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSByZXN1bHQuc291cmNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoYnVmQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5ub2RlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5ub2RlcyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnM6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICAvL2RlYnVnKHRleHQpO1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB7XG4gICAgICAgICAgICAgICAgbm9kZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgICAgICAgdGV4dEFycmF5OnRyYW5zRW1vamlTdHIodGV4dClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChidWZBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBidWZBcnJheVswXTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5vZGVzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBwYXJlbnQuaW5kZXggKyAnLicgKyBwYXJlbnQubm9kZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcGFyZW50Lm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbW1lbnQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICAvL2RlYnVnKHRleHQpO1xuICAgICAgICAgICAgLy8gdmFyIG5vZGUgPSB7XG4gICAgICAgICAgICAvLyAgICAgbm9kZTogJ2NvbW1lbnQnLFxuICAgICAgICAgICAgLy8gICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgICAvLyB9O1xuICAgICAgICAgICAgLy8gdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdO1xuICAgICAgICAgICAgLy8gaWYgKHBhcmVudC5ub2RlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyAgICAgcGFyZW50Lm5vZGVzID0gW107XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cbmZ1bmN0aW9uIHRyYW5zRW1vamlTdHIoc3RyKXtcbiAgLy8gdmFyIGVSZWcgPSBuZXcgUmVnRXhwKFwiW1wiK19fcmVnKycgJytcIl1cIik7XG4vLyAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXFsoW15cXFtcXF1dKylcXF0vZywnOiQxOicpXG4gIFxuICB2YXIgZW1vamlPYmpzID0gW107XG4gIC8v5aaC5p6c5q2j5YiZ6KGo6L6+5byP5Li656m6XG4gIGlmKF9fZW1vamlzUmVnLmxlbmd0aCA9PSAwIHx8ICFfX2Vtb2ppcyl7XG4gICAgICB2YXIgZW1vamlPYmogPSB7fVxuICAgICAgZW1vamlPYmoubm9kZSA9IFwidGV4dFwiO1xuICAgICAgZW1vamlPYmoudGV4dCA9IHN0cjtcbiAgICAgIGFycmF5ID0gW2Vtb2ppT2JqXTtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgfVxuICAvL+i/meS4quWcsOaWuemcgOimgeiwg+aVtFxuICBzdHIgPSBzdHIucmVwbGFjZSgvXFxbKFteXFxbXFxdXSspXFxdL2csJzokMTonKVxuICB2YXIgZVJlZyA9IG5ldyBSZWdFeHAoXCJbOl1cIik7XG4gIHZhciBhcnJheSA9IHN0ci5zcGxpdChlUmVnKTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICB2YXIgZWxlID0gYXJyYXlbaV07XG4gICAgdmFyIGVtb2ppT2JqID0ge307XG4gICAgaWYoX19lbW9qaXNbZWxlXSl7XG4gICAgICBlbW9qaU9iai5ub2RlID0gXCJlbGVtZW50XCI7XG4gICAgICBlbW9qaU9iai50YWcgPSBcImVtb2ppXCI7XG4gICAgICBlbW9qaU9iai50ZXh0ID0gX19lbW9qaXNbZWxlXTtcbiAgICAgIGVtb2ppT2JqLmJhc2VTcmM9IF9fZW1vamlzQmFzZVNyYztcbiAgICB9ZWxzZXtcbiAgICAgIGVtb2ppT2JqLm5vZGUgPSBcInRleHRcIjtcbiAgICAgIGVtb2ppT2JqLnRleHQgPSBlbGU7XG4gICAgfVxuICAgIGVtb2ppT2Jqcy5wdXNoKGVtb2ppT2JqKTtcbiAgfVxuICBcbiAgcmV0dXJuIGVtb2ppT2Jqcztcbn1cblxuZnVuY3Rpb24gZW1vamlzSW5pdChyZWc9JycsYmFzZVNyYz1cIi93eFBhcnNlL2Vtb2ppcy9cIixlbW9qaXMpe1xuICAgIF9fZW1vamlzUmVnID0gcmVnO1xuICAgIF9fZW1vamlzQmFzZVNyYz1iYXNlU3JjO1xuICAgIF9fZW1vamlzPWVtb2ppcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaHRtbDJqc29uOiBodG1sMmpzb24sXG4gICAgZW1vamlzSW5pdDplbW9qaXNJbml0XG59O1xuXG4iXX0=