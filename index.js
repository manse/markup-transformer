"use strict";

var htmlparser = require('htmlparser');
var UglifyJS = require('./lib/tools/node.js');
var nodeCSS = require('css');


//----------------------------------------
// Main
//----------------------------------------

module.exports = function(code, options) {
	options = options || {};
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

	var nodes;
	switch (((options.syntax || '') + '').toLowerCase()) {
		case 'css':
		case 'stylesheet':
		nodes = parseCSS(code);
		break;

		case 'js':
		case 'javascript':
		nodes = parseJS(code);
		break;

		default:
		nodes = parseHTML(code);
	}

	return generateCode(nodes, options.shape);
};




//----------------------------------------
// Padding
//----------------------------------------

function paddingHTML(n) {
	if (n <= 3) {
		return repeat(' ', n);
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

	var nodes = [];
	for (var i = 0, j = 0, ii = temp.length, lastType; i < ii; i++) {
		var tmp = temp[i];
		if (i && (lastType == tmp.type || !tmp.type)) {
			nodes[++j] = tmp;
		} else {
			if (!nodes[j]) {
				nodes[j] = tmp;
			} else {
				nodes[j].code += tmp.code;
				nodes[j].padding = tmp.padding;
			}
		}
		lastType = tmp.type;
	}
	return nodes;
}


function parseCSS(css) {
	var nodes = [];

	function push() {
		for (var i = 0, ii = arguments.length; i < ii; i++) {
			var code = arguments[i].replace(/\n/g, '');
			if (code == ';' || code == '') {
				nodes.push({code: code, padding: paddingCSSJS});
			} else {
				nodes.push({code: code});
			}
		}
	}

	function pushBraces(inner) {
		push('{');
		inner();
		push('}');
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
				pushBraces(function() {
					pushDeclarations(entry.declarations);
				});
				break;

				case 'page':
				push('@page ');
				for (var j = 0, jj = entry.selectors.length; j < jj; j++) {
					push(trim(entry.selectors[j]));
					if (j + 1 != jj) push(',');
				}
				pushBraces(function() {
					pushDeclarations(entry.declarations);
				});
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
				pushBraces(function() {
					pushRules(entry.rules || []);
				});
				break;

				case 'media':
				case 'supports':
				push('@' + entry.type + ' ', entry[entry.type]);
				pushBraces(function() {
					pushRules(entry.rules || []);
				});
				break;

				case 'font-face':
				pushBraces(function() {
					pushDeclarations(entry.declarations);
				});
				break;

				case 'keyframes':
				push('@' + (entry.vendor || '') + 'keyframes ', entry.name);
				pushBraces(function() {
					for (var j = 0, jj = entry.keyframes.length; j < jj; j++) {
						var keyframes = entry.keyframes[j];
						if (keyframes.type != 'keyframe') continue;
						for (var k = 0, kk = keyframes.values.length; k < kk; k++) {
							push(trim(keyframes.values[k]));
							if (k + 1 != kk) push(',');
						}
						pushBraces(function() {
							pushDeclarations(keyframes.declarations);
						});
					}
				});
				break;
			}
		}
	}
	pushRules(nodeCSS.parse(css).stylesheet.rules)
	return nodes;
}


function parseJS(js) {
	var stream = UglifyJS.OutputStream({});
	var toplevel = UglifyJS.parse(js);
	toplevel.figure_out_scope();
	toplevel.compute_char_frequency();
	toplevel.mangle_names();
	toplevel.transform(UglifyJS.Compressor({
		warnings: true
	})).print(stream);
	var gets = stream.gets();

	function next(pad) {
		if (pad) nodes[cursor].padding = paddingCSSJS;
		nodes[++cursor] = {code: ''};
	}

	function push() {
		for (var i = 0, ii = arguments.length; i < ii; i++) {
			nodes[cursor].code += arguments[i].replace(/\n/g, '');
		}
	}

	var nodes = [{code: ''}];
	var cursor = 0;
	var infor = 0;
	var sensor = {
		'if': 1,
		'else': 1,
		'for': 1,
		'while': 1,
		'do': 1,
	};
	for (var i = 0, ii = gets.length; i < ii; i++) {
		var a = gets[i];
		var b = gets[i + 1];
		if (a == 'return' || a == 'throw') {
			push(a, b);
			i++;
		} else if (b == '++' || b == '--') {
			push(a, b);
			next();
			i++;
		} else {
			push(a);
			next(!infor && a == ';' && !sensor[b]);

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

	return nodes;
}



//----------------------------------------
// Code Generator
//----------------------------------------

function parseMap(map) {
	var result = [];
	for (var i = 0, ii = map.length, cursor = -1, last; i < ii; i++) {
		var isFill = map[i] != ' ' && map[i] != '0';
		if (last != isFill) {
			last = isFill;
			cursor++;
			result.push({fill: isFill, width: 1});
		} else {
			result[cursor].width++;
		}
	}
	return result;
}


function generateBlock(nodes, width, startAt, eol, paddingEnd) {
	var parts = [];
	var length = 0;
	var lastPaddingLocalPosition = -1;
	var lastPaddingGlobalPosition = -1;
	for (var p = startAt, pp = nodes.length; p < pp; p++) {
		var node = nodes[p];
		if (length + node.code.length >= width && !eol) break;
		parts.push({
			position: p,
			code: node.code
		});
		length += node.code.length;
		if (node.padding) {
			lastPaddingLocalPosition = p - startAt;
			lastPaddingGlobalPosition = p;
		}
		if (length >= width && eol) break;
	}

	if (paddingEnd) {
		if (lastPaddingLocalPosition == -1) {
			parts = [];
			length = 0;
		} else {
			parts = parts.slice(0, lastPaddingLocalPosition + 1);
			length = 0;
			for (var i = 0, ii = parts.length; i < ii; i++) {
				length += parts[i].code.length;
			}
			parts[lastPaddingLocalPosition].padding = {
				width: Math.abs(width - length),
				using: nodes[lastPaddingGlobalPosition].padding
			}
		}
	}

	var before = nodes[startAt - 1];
	if (parts.length == 0) {
		if (before && before.padding) {
			return [{
				position: startAt - 1,
				padding: {
					width: width,
					using: before.padding
				}
			}];
		}
	} else if (length == width || eol) {
		return parts;
	} else if (before && before.padding) {
		parts.unshift({
			position: startAt - 1,
			padding: {
				width: width - length,
				using: before.padding
			}
		});
		return parts;
	} else if (lastPaddingLocalPosition != -1) {
		parts[lastPaddingLocalPosition].padding = {
			width: width - length,
			using: nodes[lastPaddingGlobalPosition].padding
		};
		return parts;
	} else if (parts.length > 1) {
		var parts2 = [];
		var dummySpace = width - length;
		for (var i = 0, ii = parts.length - 1, step = dummySpace / ii; i < ii; i++) {
			parts2.push(parts[i]);

			var space = Math.floor((i + 1) * step) - Math.floor(i * step);
			parts2.push({
				space: space
			});
		}
		parts2.push(parts[parts.length - 1]);
		return parts2;
	}
	return null;
}


function generateLine(nodes, map, startAt) {
	var minScore = 1e8;
	var minScoreLine = null;

	for (var retry = 0, maxRetry = 10; retry <= maxRetry; retry++) {
		var lastTry = retry == maxRetry;
		var start = startAt;

		var line = [];
		if (lastTry) {
			for (var ii = nodes.length; start < ii; start++) {
				line.push({position: start, code: nodes[start].code});
				if (nodes[start].padding) {
					start++;
					break;
				}
			}
		} else {
			for (var ii = Math.min(nodes.length, start + retry); start < ii; start++) {
				line.push({position: start, code: nodes[start].code});
			}
		}
		line.push({breakline: true});

		try {
			for (var i = 0, ii = map.length; i < ii; i++) {
				if (!map[i].fill) {
					line.push({space: map[i].width});
				} else {
					var blocks = generateBlock(nodes, map[i].width, start, i + 1 == ii, lastTry);
					if (!blocks) throw 0;

					line = line.concat(blocks);
					start = blocks[blocks.length - 1].position + 1;
				}
			}
		} catch (e) {
			continue;
		}

		var score = 0;
		var paddingOnly = true;
		for (var i = 0, ii = line.length; i < ii; i++) {
			var block = line[i];
			if (block.code) {
				score += block.code.length;
				paddingOnly = false;
			}
			if (block.space) score += block.space * 3;
			if (block.padding) score += block.padding.width * 5;
		}
		if (score < minScore && !paddingOnly) {
			minScore = score;
			minScoreLine = line;
		}
	}

	return minScoreLine;
}


function generateCode(nodes, shapeCallback) {
	var code = nodes[0] ? nodes[0].code : '';

	for (var i = 0, startAt = 1, kill = false; !kill; i++) {
		var line = generateLine(nodes, parseMap(shapeCallback(i)), startAt);

		if (line) {
			for (var j = line.length - 1; j >= 0; j--) {
				if (line[j].position) {
					startAt = line[j].position + 1;
					break;
				}
			}
		} else {
			line = [];
			for (var j = startAt, jj = nodes.length; j < jj; j++) {
				line.push({code: nodes[j].code, position: j});
			}
			kill = true;
		}

		for (var j = 0, jj = line.length; j < jj; j++) {
			var block = line[j];
			if (block.code) {
				code += block.code;
			}
			if (block.padding) {
				code += block.padding.using(block.padding.width);
			}
			if (block.space) {
				code += repeat(' ', block.space);
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
var defaultShape = (function() {
	var size = 50;
	var paddingX = 30;
	var paddingY = 8;
	var width = size + paddingX * 2;
	var height = size + paddingY * 2;

	return function(n) {
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
})();

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
