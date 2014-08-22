"use strict";

var htmlparser = require('htmlparser');
var UglifyJS = require('./uglify-js/tools/node.js');
var nodeCSS = require('css');


//----------------------------------------
// Main
//----------------------------------------

module.exports = function(code, options) {
	options = options || {};
	options.padding_html = (options.padding_html || ';').toString();
	switch (typeof options.shape) {
		case 'function':
		break;

		case 'string':
		var shapeLines = options.shape.split("\n");
		options.shape = function(n) {
			return shapeLines[n % shapeLines.length];
		};
		break;

		default:
		options.shape = defaultShape;
	}

	var list;
	switch (((options.syntax || '') + '').toLowerCase()) {
		case 'css':
		case 'stylesheet':
		list = parseCSS(code);
		break;

		case 'js':
		case 'javascript':
		list = parseJS(code);
		break;

		default:
		list = parseHTML(code);
	}

	return generateCode(list, options.shape);
};




//----------------------------------------
// Padding
//----------------------------------------

function paddingHTML(n) {
	if (n <= 4) {
		return ' pad'.substr(0, n);
	} else {
		var pad = '';
		for (var i = 0, ii = Math.floor(n / 4), spaces = (n - 3 * ii) / ii; i < ii; i++) {
			pad += repeat(' ', Math.floor(spaces * (i + 1)) - Math.floor(spaces * i)) + 'pad';
		}
		return pad;
	}
}

function paddingCSSJS(n) {
	return repeat(';', n);
}




//----------------------------------------
// Parser
//----------------------------------------

function parseHTML(html) {
	var temp = [];

	function push(code, type, padding) {
		code = code.replace(/\n/g, '');
		if (padding) {
			temp.push({code: code, type: type, padding: padding});
		} else {
			temp.push({code: code, type: type});
		}
	}

	function dig(nodes) {
		for (var i = 0; i < nodes.length; i ++) {
			var node = nodes[i];
			switch (node.type) {
				case 'comment':
				break;

				case 'text':
				var words = trim(node.raw).split(' ');
				for (var j = 0, jj = words.length; j < jj; j++) {
					push(words[j] + (j + 1 == jj ? '' : ' '), 'text');
				}
				break;

				case 'directive':
				push('<' + node.raw + '>', 'tag');
				break;

				default:
				var tag = node.name;
				var attribs = node.attribs || {};

				push('<' + tag, 'tag', paddingHTML);
				for (var key in attribs) {
					push(' ' + key + '="' + attribs[key] + '"', 'tag', paddingHTML);
				}
				push('>', 'tag');

				switch (tag) {
					case 'br':
					case 'input':
					case 'hr':
					case 'link':
					case 'meta':
					case 'img':
					case 'embed':
					case 'param':
					case 'area':
					case 'base':
					case 'col':
					case 'keygen':
					case 'source':
					continue;

					case 'script':
					if ((!attribs.type || attribs.type == 'text/javascript') && node.children && node.children[0]) {
						temp = temp.concat(parseJS(node.children[0].raw));
					}
					break;

					case 'style':
					if ((!attribs.type || attribs.type == 'text/css') && node.children && node.children[0]) {
						temp = temp.concat(parseCSS(node.children[0].raw));
					}
					break;

					default:
					if (node.children) dig(node.children);
				}

				push('</' + tag + '>', 'tag')
			}
		}
	}

	var handler = new htmlparser.DefaultHandler(function (error, dom) {});
	new htmlparser.Parser(handler).parseComplete(html);
	dig(handler.dom);

	var list = [];
	for (var i = 0, j = 0, ii = temp.length, lastType; i < ii; i++) {
		var tmp = temp[i];
		if (i && (lastType == tmp.type || !tmp.type)) {
			list[++j] = tmp;
		} else {
			if (!list[j]) {
				list[j] = tmp;
			} else {
				list[j].code += tmp.code;
				list[j].padding = tmp.padding;
			}
		}
		lastType = tmp.type;
	}
	return list;
}


function parseCSS(css) {
	var list = [];

	function push() {
		for (var i = 0, ii = arguments.length; i < ii; i++) {
			var code = arguments[i].replace(/\n/g, '');
			if (code == ';' || code == '') {
				list.push({code: code, padding: paddingCSSJS});
			} else {
				list.push({code: code});
			}
		}
	}

	function pushDeclarations(declarations) {
		for (var i = 0, ii = (declarations || []).length; i < ii; i++) {
			var declaration = declarations[i];
			if (declaration.type != 'declaration') continue;

			push(declaration.property, ':');
			if (~declaration.value.indexOf('"') || ~declaration.value.indexOf("'") || ~declaration.value.indexOf('url')) {
				pushSplit(declaration.value, ' ');
			} else {
				var entries = declaration.value.split(',');
				for (var j = 0, jj = entries.length; j < jj; j++) {
					pushSplit(entries[j], ' ');
					if (j + 1 != jj) push(',');
				}
			}
			if (i + 1 != ii) push(';');
			else push('');
		}
	}

	function pushSplit(value, delimiter) {
		var isSpace = (delimiter == ' ');
		var values = trim(value).split(delimiter);
		for (var i = 0, ii = values.length; i < ii; i++) {
			var tail = (i + 1 == ii);
			var value = values[i];
			if (isSpace) {
				push(value + (tail ? '' : ' '));
			} else {
				push(value);
				if (!tail) push(delimiter);
			}
		}
	}

	function pushRules(rules) {
		for (var i = 0, ii = rules.length; i < ii; i++) {
			var entry = rules[i];
			switch (entry.type) {
				case 'rule':
				for (var j = 0, jj = (entry.selectors || []).length; j < jj; j++) {
					pushSplit(entry.selectors[j], ' ');
					if (j + 1 != jj) push(',');
				}
				push('{');
				pushDeclarations(entry.declarations);
				push('}');
				break;

				case 'page':
				push('@page ');
				for (var j = 0, jj = entry.selectors.length; j < jj; j++) {
					push(trim(entry.selectors[j]));
					if (j + 1 != jj) push(',');
				}
				push('{');
				pushDeclarations(entry.declarations);
				push('}');
				break;

				case 'charset':
				case 'import':
				case 'namespace':
				push('@' + entry.type + ' ', entry[entry.type], ';');
				break;

				case 'custom-media':
				push('@custom-media ', entry.name, entry.media);
				break;

				case 'document':
				push('@document ');
				pushSplit(entry.document, ',');
				push('{');
				pushRules(entry.rules || []);
				push('}');
				break;

				case 'media':
				case 'supports':
				push('@' + entry.type + ' ', entry[entry.type], '{');
				pushRules(entry.rules || []);
				push('}');
				break;

				case 'font-face':
				push('@font-face', '{');
				pushDeclarations(entry.declarations);
				push('}');
				break;

				case 'keyframes':
				push('@' + (entry.vendor || '') + 'keyframes ', entry.name, '{');
				for (var j = 0, jj = entry.keyframes.length; j < jj; j++) {
					var keyframes = entry.keyframes[j];
					if (keyframes.type != 'keyframe') continue;
					for (var k = 0, kk = keyframes.values.length; k < kk; k++) {
						push(trim(keyframes.values[k]));
						if (k + 1 != kk) push(',');
					}
					push('{');
					pushDeclarations(keyframes.declarations);
					push('}');
				}
				push('}');
				break;
			}
		}
	}
	pushRules(nodeCSS.parse(css).stylesheet.rules)
	return list;
}


function parseJS(js) {
	var stream = UglifyJS.OutputStream({});
	var toplevel = UglifyJS.parse(js);
	toplevel.figure_out_scope();
	toplevel.transform(UglifyJS.Compressor()).print(stream);
	var gets = stream.gets();

	function next(pad) {
		if (pad) list[cursor].padding = paddingCSSJS;
		list[++cursor] = {code: ''};
	}

	function push() {
		for (var i = 0, ii = arguments.length; i < ii; i++) {
			list[cursor].code += arguments[i].replace(/\n/g, '');
		}
	}

	var list = [{code: ''}];
	var cursor = 0;
	var infor = 0;
	for (var i = 0, ii = gets.length; i < ii; i++) {
		var a = gets[i];
		var b = gets[i + 1];
		if (a == 'return') {
			push(a, b);
			i++;
		} else if (b == '++' || b == '--') {
			push(a, b);
			next();
			i++;
		} else {
			push(a);
			next(!infor && a == ';');

			if (a == 'for') {
				infor = 2;
			} else if (infor) {
				if (a == ';') {
					infor--;
				} else if (a == 'in') {
					infor = 0;
				}
			}
		}
	}

	return list;
}



//----------------------------------------
// Code Generator
//----------------------------------------

function parseMap(map) {
	var last;
	var result = [];
	for (var i = 0, ii = map.length; i < ii; i++) {
		var isFill = map[i] != ' ' && map[i] != '0';
		if (last != isFill) {
			last = isFill;
			result.push({fill: isFill, width: 1});
		} else {
			result[result.length - 1].width++;
		}
	}
	return result;
}


function generateBlock(list, width, startAt, eol, tailMustPadding) {
	var position = [];
	var length = 0;
	var lastPaddingIndex = -1;
	for (var p = startAt, pp = list.length; p < pp; p++) {
		var node = list[p];
		if (length + node.code.length >= width && !eol) break; 
		position.push({
			position: p,
			node: node
		});
		length += node.code.length;
		if (node.padding) lastPaddingIndex = p - startAt;
		if (length >= width && eol) break; 
	}

	if (tailMustPadding) {
		if (lastPaddingIndex == -1) {
			position = [];
			length = 0;
		} else {
			position = position.slice(0, lastPaddingIndex + 1);
			length = 0;
			for (var i = 0, ii = position.length; i < ii; i++) {
				length += position[i].node.code.length;
			}
			position[lastPaddingIndex].padding = Math.abs(width - length);
		}
	}

	var before = list[startAt - 1];
	if (position.length == 0) {
		if (before && before.padding) {
			return [{
				position: startAt - 1,
				padding: width,
				paddingonly: true,
				node: before
			}];
		}
	} else if (length == width || eol) {
		return position;
	} else if (before && before.padding) {
		position.unshift({
			position: startAt - 1,
			paddingonly: true,
			padding: width - length,
			node: before
		});
		return position;
	} else if (lastPaddingIndex != -1) {
		position[lastPaddingIndex].padding = width - length;
		return position;
	} else if (position.length > 1) {
		var position2 = [];
		var dummySpace = width - length;
		for (var i = 0, ii = position.length - 1, step = dummySpace / ii; i < ii; i++) {
			position2.push(position[i]);

			var space = Math.floor((i + 1) * step) - Math.floor(i * step);
			position2.push({
				space: space
			});
		}
		position2.push(position[position.length - 1]);
		return position2;
	}
	return null;
}


function generateLine(list, map, startAt) {
	var minScore = 1e6;
	var minScoreLine = null;

	for (var retry = 0, maxRetry = 5; retry <= maxRetry; retry++) {
		var lastTry = retry == maxRetry;
		var start = startAt;

		var line = [];
		if (lastTry) {
			for (var ii = list.length; !list[start].padding && start < ii; start++) {
				line.push({position: start, node: list[start]});
			}
		} else {
			for (var ii = start + retry; start < ii; start++) {
				line.push({position: start, node: list[start]});
			}
		}
		line.push({breakline: true});

		for (var i = 0, ii = map.length; i < ii; i++) {
			if (!map[i].fill) {
				line.push({space: map[i].width});
			} else {
				var blocks = generateBlock(list, map[i].width, start, i + 1 == ii, lastTry);
				if (!blocks) return minScoreLine;

				line = line.concat(blocks);
				start = blocks[blocks.length - 1].position + 1;
			}
		}

		var score = 0;
		for (var i = 0, ii = line.length; i < ii; i++) {
			var node = line[i];
			if (node.node) score += node.node.code.length;
			if (node.padding) score += node.padding * 4;
		}
		if (score < minScore) {
			minScore = score;
			minScoreLine = line;
		}
	}
	return minScoreLine;
}


function generateCode(list, shapeCallback) {
	var code = list[0] ? list[0].code : '';

	for (var i = 0, startAt = 1, kill = false; !kill; i++) {
		var line = generateLine(list, parseMap(shapeCallback(i)), startAt);

		if (line) {
			for (var j = line.length - 1; j >= 0; j--) {
				if (line[j].position) {
					startAt = line[j].position + 1;
					break;
				}
			}
		} else {
			line = [];
			for (var j = startAt, jj = list.length; j < jj; j++) {
				line.push({node: list[j], position: j});
			}
			kill = true;
		}

		for (var j = 0, jj = line.length; j < jj; j++) {
			var block = line[j];
			if (!block.paddingonly && block.node) {
				code += block.node.code;
			}
			if (block.padding) {
				code += block.node.padding(block.padding);
			}
			if (block.space) {
				for (var k = 0, kk = block.space; k < kk; k++) {
					code += ' ';
				}
			}
			if (block.breakline) {
				code += "\n";
			}
		}
	}

	return code;
}



//----------------------------------------
// Util
//----------------------------------------

function defaultShape(n) {
	var size = 50;
	var paddingX = 30;
	var paddingY = 8;
	var width = size + paddingX * 2;
	var height = size + paddingY * 2;
	n *= 1.75;
	n %= height;

	var hex;
	if (n < paddingY || n > size + paddingY) {
		hex = 0;
	} else {
		if (n > height / 2) n = height - n;
		hex = Math.min((n - paddingY) / (size / 4), 1) * size;
	}
	var map = '';
	var threshold = (width - hex) / 2;
	for (var i = 0; i < width; i++) {
		map += (i <= threshold || width - threshold <= i) ? '1' : '0';
	}
	return map;
}

function repeat(str, count) {
	var result = '';
	for (var i = 0; i < count; i++) {
		result += str;
	}
	return result;
}

function trim(str) {
	return str.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s+/g, ' ');
}
