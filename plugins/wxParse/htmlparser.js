"use strict";

/**
 * 
 * htmlParser改造自: https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
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
// Regular Expressions for parsing tags and attributes
var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
    attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");

// Block Elements - HTML 5
var block = makeMap("a,address,code,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("wxxxcode-style,script,style,view,scroll-view,block");

function HTMLParser(html, handler) {
	var index,
	    chars,
	    match,
	    stack = [],
	    last = html;
	stack.last = function () {
		return this[this.length - 1];
	};

	while (html) {
		chars = true;

		// Make sure we're not in a script or style element
		if (!stack.last() || !special[stack.last()]) {

			// Comment
			if (html.indexOf("<!--") == 0) {
				index = html.indexOf("-->");

				if (index >= 0) {
					if (handler.comment) handler.comment(html.substring(4, index));
					html = html.substring(index + 3);
					chars = false;
				}

				// end tag
			} else if (html.indexOf("</") == 0) {
				match = html.match(endTag);

				if (match) {
					html = html.substring(match[0].length);
					match[0].replace(endTag, parseEndTag);
					chars = false;
				}

				// start tag
			} else if (html.indexOf("<") == 0) {
				match = html.match(startTag);

				if (match) {
					html = html.substring(match[0].length);
					match[0].replace(startTag, parseStartTag);
					chars = false;
				}
			}

			if (chars) {
				index = html.indexOf("<");
				var text = '';
				while (index === 0) {
					text += "<";
					html = html.substring(1);
					index = html.indexOf("<");
				}
				text += index < 0 ? html : html.substring(0, index);
				html = index < 0 ? "" : html.substring(index);

				if (handler.chars) handler.chars(text);
			}
		} else {

			html = html.replace(new RegExp("([\\s\\S]*?)<\/" + stack.last() + "[^>]*>"), function (all, text) {
				text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, "$1$2");
				if (handler.chars) handler.chars(text);

				return "";
			});

			parseEndTag("", stack.last());
		}

		if (html == last) throw "Parse Error: " + html;
		last = html;
	}

	// Clean up any remaining tags
	parseEndTag();

	function parseStartTag(tag, tagName, rest, unary) {
		tagName = tagName.toLowerCase();

		if (block[tagName]) {
			while (stack.last() && inline[stack.last()]) {
				parseEndTag("", stack.last());
			}
		}

		if (closeSelf[tagName] && stack.last() == tagName) {
			parseEndTag("", tagName);
		}

		unary = empty[tagName] || !!unary;

		if (!unary) stack.push(tagName);

		if (handler.start) {
			var attrs = [];

			rest.replace(attr, function (match, name) {
				var value = arguments[2] ? arguments[2] : arguments[3] ? arguments[3] : arguments[4] ? arguments[4] : fillAttrs[name] ? name : "";

				attrs.push({
					name: name,
					value: value,
					escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
				});
			});

			if (handler.start) {
				handler.start(tagName, attrs, unary);
			}
		}
	}

	function parseEndTag(tag, tagName) {
		// If no tag name is provided, clean shop
		if (!tagName) var pos = 0;

		// Find the closest opened tag of the same type
		else {
				tagName = tagName.toLowerCase();
				for (var pos = stack.length - 1; pos >= 0; pos--) {
					if (stack[pos] == tagName) break;
				}
			}
		if (pos >= 0) {
			// Close all the open elements, up the stack
			for (var i = stack.length - 1; i >= pos; i--) {
				if (handler.end) handler.end(stack[i]);
			} // Remove the open elements from the stack
			stack.length = pos;
		}
	}
};

function makeMap(str) {
	var obj = {},
	    items = str.split(",");
	for (var i = 0; i < items.length; i++) {
		obj[items[i]] = true;
	}return obj;
}

module.exports = HTMLParser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWxwYXJzZXIuanMiXSwibmFtZXMiOlsic3RhcnRUYWciLCJlbmRUYWciLCJhdHRyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwiSFRNTFBhcnNlciIsImh0bWwiLCJoYW5kbGVyIiwiaW5kZXgiLCJjaGFycyIsIm1hdGNoIiwic3RhY2siLCJsYXN0IiwibGVuZ3RoIiwiaW5kZXhPZiIsImNvbW1lbnQiLCJzdWJzdHJpbmciLCJyZXBsYWNlIiwicGFyc2VFbmRUYWciLCJwYXJzZVN0YXJ0VGFnIiwidGV4dCIsIlJlZ0V4cCIsImFsbCIsInRhZyIsInRhZ05hbWUiLCJyZXN0IiwidW5hcnkiLCJ0b0xvd2VyQ2FzZSIsInB1c2giLCJzdGFydCIsImF0dHJzIiwibmFtZSIsInZhbHVlIiwiYXJndW1lbnRzIiwiZXNjYXBlZCIsInBvcyIsImkiLCJlbmQiLCJzdHIiLCJvYmoiLCJpdGVtcyIsInNwbGl0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7Ozs7OztBQWFBO0FBQ0EsSUFBSUEsV0FBVyxnSEFBZjtBQUFBLElBQ0NDLFNBQVMsNEJBRFY7QUFBQSxJQUVDQyxPQUFPLG9HQUZSOztBQUlBO0FBQ0EsSUFBSUMsUUFBUUMsUUFBUSxvR0FBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUMsUUFBUUQsUUFBUSxvVEFBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUUsU0FBU0YsUUFBUSw2TEFBUixDQUFiOztBQUVBO0FBQ0E7QUFDQSxJQUFJRyxZQUFZSCxRQUFRLGtEQUFSLENBQWhCOztBQUVBO0FBQ0EsSUFBSUksWUFBWUosUUFBUSx3R0FBUixDQUFoQjs7QUFFQTtBQUNBLElBQUlLLFVBQVVMLFFBQVEsb0RBQVIsQ0FBZDs7QUFFQSxTQUFTTSxVQUFULENBQW9CQyxJQUFwQixFQUEwQkMsT0FBMUIsRUFBbUM7QUFDbEMsS0FBSUMsS0FBSjtBQUFB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QUNBOztBQUVERyxPQUFPQyxPQUFQLEdBQWlCdEMsVUFBakIiLCJmaWxlIjoiaHRtbHBhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogXG4gKiBodG1sUGFyc2Vy5pS56YCg6IeqOiBodHRwczovL2dpdGh1Yi5jb20vYmxvd3NpZS9QdXJlLUphdmFTY3JpcHQtSFRNTDUtUGFyc2VyXG4gKiBcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcbiAqIG9yZ2FuaXphdGlvbjogV2VBcHBEZXYo5b6u5L+h5bCP56iL5bqP5byA5Y+R6K665Z2bKShodHRwOi8vd2VhcHBkZXYuY29tKVxuICogICAgICAgICAgICAgICDlnoLnm7Tlvq7kv6HlsI/nqIvluo/lvIDlj5HkuqTmtYHnpL7ljLpcbiAqIFxuICogZ2l0aHVi5Zyw5Z2AOiBodHRwczovL2dpdGh1Yi5jb20vaWNpbmR5L3d4UGFyc2VcbiAqIFxuICogZm9yOiDlvq7kv6HlsI/nqIvluo/lr4zmlofmnKzop6PmnpBcbiAqIGRldGFpbCA6IGh0dHA6Ly93ZWFwcGRldi5jb20vdC93eHBhcnNlLWFscGhhMC0xLWh0bWwtbWFya2Rvd24vMTg0XG4gKi9cbi8vIFJlZ3VsYXIgRXhwcmVzc2lvbnMgZm9yIHBhcnNpbmcgdGFncyBhbmQgYXR0cmlidXRlc1xudmFyIHN0YXJ0VGFnID0gL148KFstQS1aYS16MC05X10rKSgoPzpcXHMrW2EtekEtWl86XVstYS16QS1aMC05XzouXSooPzpcXHMqPVxccyooPzooPzpcIlteXCJdKlwiKXwoPzonW14nXSonKXxbXj5cXHNdKykpPykqKVxccyooXFwvPyk+Lyxcblx0ZW5kVGFnID0gL148XFwvKFstQS1aYS16MC05X10rKVtePl0qPi8sXG5cdGF0dHIgPSAvKFthLXpBLVpfOl1bLWEtekEtWjAtOV86Ll0qKSg/Olxccyo9XFxzKig/Oig/OlwiKCg/OlxcXFwufFteXCJdKSopXCIpfCg/OicoKD86XFxcXC58W14nXSkqKScpfChbXj5cXHNdKykpKT8vZztcblxuLy8gRW1wdHkgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBlbXB0eSA9IG1ha2VNYXAoXCJhcmVhLGJhc2UsYmFzZWZvbnQsYnIsY29sLGZyYW1lLGhyLGltZyxpbnB1dCxsaW5rLG1ldGEscGFyYW0sZW1iZWQsY29tbWFuZCxrZXlnZW4sc291cmNlLHRyYWNrLHdiclwiKTtcblxuLy8gQmxvY2sgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBibG9jayA9IG1ha2VNYXAoXCJhLGFkZHJlc3MsY29kZSxhcnRpY2xlLGFwcGxldCxhc2lkZSxhdWRpbyxibG9ja3F1b3RlLGJ1dHRvbixjYW52YXMsY2VudGVyLGRkLGRlbCxkaXIsZGl2LGRsLGR0LGZpZWxkc2V0LGZpZ2NhcHRpb24sZmlndXJlLGZvb3Rlcixmb3JtLGZyYW1lc2V0LGgxLGgyLGgzLGg0LGg1LGg2LGhlYWRlcixoZ3JvdXAsaHIsaWZyYW1lLGlucyxpc2luZGV4LGxpLG1hcCxtZW51LG5vZnJhbWVzLG5vc2NyaXB0LG9iamVjdCxvbCxvdXRwdXQscCxwcmUsc2VjdGlvbixzY3JpcHQsdGFibGUsdGJvZHksdGQsdGZvb3QsdGgsdGhlYWQsdHIsdWwsdmlkZW9cIik7XG5cbi8vIElubGluZSBFbGVtZW50cyAtIEhUTUwgNVxudmFyIGlubGluZSA9IG1ha2VNYXAoXCJhYmJyLGFjcm9ueW0sYXBwbGV0LGIsYmFzZWZvbnQsYmRvLGJpZyxicixidXR0b24sY2l0ZSxkZWwsZGZuLGVtLGZvbnQsaSxpZnJhbWUsaW1nLGlucHV0LGlucyxrYmQsbGFiZWwsbWFwLG9iamVjdCxxLHMsc2FtcCxzY3JpcHQsc2VsZWN0LHNtYWxsLHNwYW4sc3RyaWtlLHN0cm9uZyxzdWIsc3VwLHRleHRhcmVhLHR0LHUsdmFyXCIpO1xuXG4vLyBFbGVtZW50cyB0aGF0IHlvdSBjYW4sIGludGVudGlvbmFsbHksIGxlYXZlIG9wZW5cbi8vIChhbmQgd2hpY2ggY2xvc2UgdGhlbXNlbHZlcylcbnZhciBjbG9zZVNlbGYgPSBtYWtlTWFwKFwiY29sZ3JvdXAsZGQsZHQsbGksb3B0aW9ucyxwLHRkLHRmb290LHRoLHRoZWFkLHRyXCIpO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSB0aGVpciB2YWx1ZXMgZmlsbGVkIGluIGRpc2FibGVkPVwiZGlzYWJsZWRcIlxudmFyIGZpbGxBdHRycyA9IG1ha2VNYXAoXCJjaGVja2VkLGNvbXBhY3QsZGVjbGFyZSxkZWZlcixkaXNhYmxlZCxpc21hcCxtdWx0aXBsZSxub2hyZWYsbm9yZXNpemUsbm9zaGFkZSxub3dyYXAscmVhZG9ubHksc2VsZWN0ZWRcIik7XG5cbi8vIFNwZWNpYWwgRWxlbWVudHMgKGNhbiBjb250YWluIGFueXRoaW5nKVxudmFyIHNwZWNpYWwgPSBtYWtlTWFwKFwid3h4eGNvZGUtc3R5bGUsc2NyaXB0LHN0eWxlLHZpZXcsc2Nyb2xsLXZpZXcsYmxvY2tcIik7XG5cbmZ1bmN0aW9uIEhUTUxQYXJzZXIoaHRtbCwgaGFuZGxlcikge1xuXHR2YXIgaW5kZXgsIGNoYXJzLCBtYXRjaCwgc3RhY2sgPSBbXSwgbGFzdCA9IGh0bWw7XG5cdHN0YWNrLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcblx0fTtcblxuXHR3aGlsZSAoaHRtbCkge1xuXHRcdGNoYXJzID0gdHJ1ZTtcblxuXHRcdC8vIE1ha2Ugc3VyZSB3ZSdyZSBub3QgaW4gYSBzY3JpcHQgb3Igc3R5bGUgZWxlbWVudFxuXHRcdGlmICghc3RhY2subGFzdCgpIHx8ICFzcGVjaWFsW3N0YWNrLmxhc3QoKV0pIHtcblxuXHRcdFx0Ly8gQ29tbWVudFxuXHRcdFx0aWYgKGh0bWwuaW5kZXhPZihcIjwhLS1cIikgPT0gMCkge1xuXHRcdFx0XHRpbmRleCA9IGh0bWwuaW5kZXhPZihcIi0tPlwiKTtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdGlmIChoYW5kbGVyLmNvbW1lbnQpXG5cdFx0XHRcdFx0XHRoYW5kbGVyLmNvbW1lbnQoaHRtbC5zdWJzdHJpbmcoNCwgaW5kZXgpKTtcblx0XHRcdFx0XHRodG1sID0gaHRtbC5zdWJzdHJpbmcoaW5kZXggKyAzKTtcblx0XHRcdFx0XHRjaGFycyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gZW5kIHRhZ1xuXHRcdFx0fSBlbHNlIGlmIChodG1sLmluZGV4T2YoXCI8L1wiKSA9PSAwKSB7XG5cdFx0XHRcdG1hdGNoID0gaHRtbC5tYXRjaChlbmRUYWcpO1xuXG5cdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpO1xuXHRcdFx0XHRcdG1hdGNoWzBdLnJlcGxhY2UoZW5kVGFnLCBwYXJzZUVuZFRhZyk7XG5cdFx0XHRcdFx0Y2hhcnMgPSBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHN0YXJ0IHRhZ1xuXHRcdFx0fSBlbHNlIGlmIChodG1sLmluZGV4T2YoXCI8XCIpID09IDApIHtcblx0XHRcdFx0bWF0Y2ggPSBodG1sLm1hdGNoKHN0YXJ0VGFnKTtcblxuXHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRodG1sID0gaHRtbC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKTtcblx0XHRcdFx0XHRtYXRjaFswXS5yZXBsYWNlKHN0YXJ0VGFnLCBwYXJzZVN0YXJ0VGFnKTtcblx0XHRcdFx0XHRjaGFycyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjaGFycykge1xuXHRcdFx0XHRpbmRleCA9IGh0bWwuaW5kZXhPZihcIjxcIik7XG5cdFx0XHRcdHZhciB0ZXh0ID0gJydcblx0XHRcdFx0d2hpbGUgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCArPSBcIjxcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gaHRtbC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBodG1sLmluZGV4T2YoXCI8XCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRleHQgKz0gaW5kZXggPCAwID8gaHRtbCA6IGh0bWwuc3Vic3RyaW5nKDAsIGluZGV4KTtcblx0XHRcdFx0aHRtbCA9IGluZGV4IDwgMCA/IFwiXCIgOiBodG1sLnN1YnN0cmluZyhpbmRleCk7XG5cblx0XHRcdFx0aWYgKGhhbmRsZXIuY2hhcnMpXG5cdFx0XHRcdFx0aGFuZGxlci5jaGFycyh0ZXh0KTtcblx0XHRcdH1cblxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdGh0bWwgPSBodG1sLnJlcGxhY2UobmV3IFJlZ0V4cChcIihbXFxcXHNcXFxcU10qPyk8XFwvXCIgKyBzdGFjay5sYXN0KCkgKyBcIltePl0qPlwiKSwgZnVuY3Rpb24gKGFsbCwgdGV4dCkge1xuXHRcdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC88IS0tKFtcXHNcXFNdKj8pLS0+fDwhXFxbQ0RBVEFcXFsoW1xcc1xcU10qPyldXT4vZywgXCIkMSQyXCIpO1xuXHRcdFx0XHRpZiAoaGFuZGxlci5jaGFycylcblx0XHRcdFx0XHRoYW5kbGVyLmNoYXJzKHRleHQpO1xuXG5cdFx0XHRcdHJldHVybiBcIlwiO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0cGFyc2VFbmRUYWcoXCJcIiwgc3RhY2subGFzdCgpKTtcblx0XHR9XG5cblx0XHRpZiAoaHRtbCA9PSBsYXN0KVxuXHRcdFx0dGhyb3cgXCJQYXJzZSBFcnJvcjogXCIgKyBodG1sO1xuXHRcdGxhc3QgPSBodG1sO1xuXHR9XG5cblx0Ly8gQ2xlYW4gdXAgYW55IHJlbWFpbmluZyB0YWdzXG5cdHBhcnNlRW5kVGFnKCk7XG5cblx0ZnVuY3Rpb24gcGFyc2VTdGFydFRhZyh0YWcsIHRhZ05hbWUsIHJlc3QsIHVuYXJ5KSB7XG5cdFx0dGFnTmFtZSA9IHRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblxuXHRcdGlmIChibG9ja1t0YWdOYW1lXSkge1xuXHRcdFx0d2hpbGUgKHN0YWNrLmxhc3QoKSAmJiBpbmxpbmVbc3RhY2subGFzdCgpXSkge1xuXHRcdFx0XHRwYXJzZUVuZFRhZyhcIlwiLCBzdGFjay5sYXN0KCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChjbG9zZVNlbGZbdGFnTmFtZV0gJiYgc3RhY2subGFzdCgpID09IHRhZ05hbWUpIHtcblx0XHRcdHBhcnNlRW5kVGFnKFwiXCIsIHRhZ05hbWUpO1xuXHRcdH1cblxuXHRcdHVuYXJ5ID0gZW1wdHlbdGFnTmFtZV0gfHwgISF1bmFyeTtcblxuXHRcdGlmICghdW5hcnkpXG5cdFx0XHRzdGFjay5wdXNoKHRhZ05hbWUpO1xuXG5cdFx0aWYgKGhhbmRsZXIuc3RhcnQpIHtcblx0XHRcdHZhciBhdHRycyA9IFtdO1xuXG5cdFx0XHRyZXN0LnJlcGxhY2UoYXR0ciwgZnVuY3Rpb24gKG1hdGNoLCBuYW1lKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IGFyZ3VtZW50c1syXSA/IGFyZ3VtZW50c1syXSA6XG5cdFx0XHRcdFx0YXJndW1lbnRzWzNdID8gYXJndW1lbnRzWzNdIDpcblx0XHRcdFx0XHRcdGFyZ3VtZW50c1s0XSA/IGFyZ3VtZW50c1s0XSA6XG5cdFx0XHRcdFx0XHRcdGZpbGxBdHRyc1tuYW1lXSA/IG5hbWUgOiBcIlwiO1xuXG5cdFx0XHRcdGF0dHJzLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG5hbWUsXG5cdFx0XHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0XHRcdGVzY2FwZWQ6IHZhbHVlLnJlcGxhY2UoLyhefFteXFxcXF0pXCIvZywgJyQxXFxcXFxcXCInKSAvL1wiXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChoYW5kbGVyLnN0YXJ0KSB7XG5cdFx0XHRcdGhhbmRsZXIuc3RhcnQodGFnTmFtZSwgYXR0cnMsIHVuYXJ5KTtcblx0XHRcdH1cblxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlRW5kVGFnKHRhZywgdGFnTmFtZSkge1xuXHRcdC8vIElmIG5vIHRhZyBuYW1lIGlzIHByb3ZpZGVkLCBjbGVhbiBzaG9wXG5cdFx0aWYgKCF0YWdOYW1lKVxuXHRcdFx0dmFyIHBvcyA9IDA7XG5cblx0XHQvLyBGaW5kIHRoZSBjbG9zZXN0IG9wZW5lZCB0YWcgb2YgdGhlIHNhbWUgdHlwZVxuXHRcdGVsc2Uge1xuXHRcdFx0dGFnTmFtZSA9IHRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdGZvciAodmFyIHBvcyA9IHN0YWNrLmxlbmd0aCAtIDE7IHBvcyA+PSAwOyBwb3MtLSlcblx0XHRcdFx0aWYgKHN0YWNrW3Bvc10gPT0gdGFnTmFtZSlcblx0XHRcdFx0XHRicmVhaztcblx0XHR9XG5cdFx0aWYgKHBvcyA+PSAwKSB7XG5cdFx0XHQvLyBDbG9zZSBhbGwgdGhlIG9wZW4gZWxlbWVudHMsIHVwIHRoZSBzdGFja1xuXHRcdFx0Zm9yICh2YXIgaSA9IHN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gcG9zOyBpLS0pXG5cdFx0XHRcdGlmIChoYW5kbGVyLmVuZClcblx0XHRcdFx0XHRoYW5kbGVyLmVuZChzdGFja1tpXSk7XG5cblx0XHRcdC8vIFJlbW92ZSB0aGUgb3BlbiBlbGVtZW50cyBmcm9tIHRoZSBzdGFja1xuXHRcdFx0c3RhY2subGVuZ3RoID0gcG9zO1xuXHRcdH1cblx0fVxufTtcblxuXG5mdW5jdGlvbiBtYWtlTWFwKHN0cikge1xuXHR2YXIgb2JqID0ge30sIGl0ZW1zID0gc3RyLnNwbGl0KFwiLFwiKTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKylcblx0XHRvYmpbaXRlbXNbaV1dID0gdHJ1ZTtcblx0cmV0dXJuIG9iajtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIVE1MUGFyc2VyO1xuIl19