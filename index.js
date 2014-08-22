"use strict";

var htmlparser = require('htmlparser');
var UglifyJS = require('./uglify-js/tools/node.js');
var cssParser = require('css');


var 
spaces = [
	'',
	' ',
	'  ',
	'   ',
	'    ',
	'     ',
	'      ',
],
padding = {
	
	html: function(attribs, seed) {
		return function(n) {
			if (n <= 3) {
				return spaces[n];
			} else if (n == 4) {
				return ('dir' in attribs) ? spaces[4] : ' dir';
			} else if (n == 5) {
				return ('lang' in attribs) ? spaces[5] : ' lang';
			} else if (n == 6) {
				return ('title' in attribs) ? spaces[6] : ' title';
			}
			var attr;
			for (var i = 0; i < 10; i++) {
				attr = 'data-' + generateKey(seed += 151, n - 6);
				if (!(attr in attribs)) break;
			}
			attribs[attr] = true;
			return ' ' + attr;
		}
	},

	cssjs: function(n) {
		var pad = '';
		for (var i = 0; i < n; i++) {
			pad += ';';
		}
		return pad;
	}

},
parser = {

	html: function(html) {
		var list = [];
		var calls = 1e5;

		function push(code, padding) {
			code = code.replace(/\n/g, '');
			if (padding) {
				list.push({code: code, padding: padding});
			} else {
				list.push({code: code});
			}
		}

		function dig(nodes) {
			for (var i = 0; i < nodes.length; i ++) {
				var node = nodes[i];
				switch (node.type) {
					case 'comment':
					break;

					case 'text':
					var words = node.raw.split(' ');
					for (var j = 0, jj = words.length; j < jj; j++) {
						if (words[j].length == 0) continue;
						push(words[j] + ' ');
					}
					break;

					case 'directive':
					push('<' + node.raw + '>');
					break;

					default:
					var tag = node.name;
					var attribs = node.attribs || {};
					var pad = padding.html(attribs, calls += 557);
					push('<' + tag, pad);
					for (var key in attribs) {
						push(' ' + key + '="' + attribs[key] + '"', pad);
					}
					push('>');

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
						list = list.concat(parser.js(node.children[0].raw));
						break;

						case 'style':
						list = list.concat(parser.css(node.children[0].raw));
						break;

						default:
						if (node.children) dig(node.children);
					}

					push('</' + tag + '>')
				}
			}
		}

		var handler = new htmlparser.DefaultHandler(function (error, dom) {});
		new htmlparser.Parser(handler).parseComplete(html);
		dig(handler.dom);
		return list;
	},

	css: function(css) {
		var list = [];

		function push() {
			for (var i = 0, ii = arguments.length; i < ii; i++) {
				var code = arguments[i].replace(/\n/g, '');
				if (code == ';') {
					list.push({code: code, padding: padding.cssjs});
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
				push(';');
			}
		}

		function pushSplit(value, delimiter) {
			var isSpace = (delimiter == ' ');
			var values = value.split(delimiter);
			for (var i = 0, ii = values.length; i < ii; i++) {
				var tail = (i + 1 == ii);
				var value = values[i].replace(/^\s+/, '').replace(/\s+$/, '');
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
							push(keyframes.values[k].replace(/^\s+/, '').replace(/\s+$/, ''));
							if (k + 1 != kk) push(',');
						}
						push('{');
						pushDeclarations(keyframes.declarations);
						push('}');
					}
					push('}');
					break;

					case 'media':
					push('@media ', entry.media, '{');
					pushRules(entry.rules || []);
					push('}');
					break;

					case 'page':
					push('@page ');
					for (var k = 0, kk = entry.selectors.length; k < kk; k++) {
						push(entry.selectors[k].replace(/^\s+/, '').replace(/\s+$/, ''));
						if (k + 1 != kk) push(',');
					}
					push('{');
					pushDeclarations(entry.declarations);
					push('}');

					break;

					case 'supports':
					push('@supports ', entry.supports, '{');
					pushRules(entry.rules);
					push('}');
					break;
				}
			}
		}
		pushRules(cssParser.parse(css).stylesheet.rules)
		return list;
	},

	js: function(js) {
		var stream = UglifyJS.OutputStream({});
		var toplevel = UglifyJS.parse(js);
		toplevel.figure_out_scope();
		toplevel.transform(UglifyJS.Compressor()).print(stream);
		var gets = stream.gets();

		function next(pad) {
			if (pad) list[cursor].padding = padding.cssjs;
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

};


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


function generateKey(seed, len) {
	var alphabet = 'TVJSWPXUMYANKHRDEOZFQLBGIC';
	var base = alphabet.length;
	seed = seed % Math.pow(base, len);
	var key = '';
	for (var i = 0; i < len; i++) {
		key += alphabet[(seed + i) % base];
		seed = Math.floor(seed / base);
	}
	return key;
}


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
	for (var i = 0, p = startAt, pp = list.length; p < pp; p++, i++) {
		var node = list[p];
		if (length + node.code.length >= width && !eol) break; 
		position.push({
			position: p,
			node: node
		});
		length += node.code.length;
		if (node.padding) lastPaddingIndex = i;
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
	var results = [];
	for (var retry = 0, maxRetry = 5; retry <= maxRetry; retry++) {
		var lastTry = retry == maxRetry;
		var start = startAt;

		var result = [];
		if (lastTry) {
			for (var i = startAt, ii = list.length; i < ii; i++) {
				result.push({
					positions: [{
						position: start,
						node: list[start]
					}]
				});
				if (list[start++].padding) break;
			}
		} else {
			for (var i = 0; i < retry; i++) {
				result.push({
					positions: [{
						position: start,
						node: list[start++]
					}]
				});
			}
		}

		result.push({breakline: true});

		var kill = false;
		for (var i = 0, ii = map.length; i < ii; i++) {
			if (!map[i].fill) {
				result.push({
					spaces: map[i].width
				});
			} else {
				var b = generateBlock(list, map[i].width, start, i + 1 == ii, lastTry);
				if (!b) {
					kill = true;
					break;
				}
				start = b[b.length - 1].position + 1;
				result.push({
					positions: b
				});
			}
		}
		if (!kill) {
			results.push(result);
		}
	}

	var minScore = 1e5;
	var minScoreIndex = 0;
	for (var i = 0, ii = results.length; i < ii; i++) {
		var score = 0;
		var result = results[i];
		for (var j = 0, jj = result.length; j < jj; j++) {
			var node = result[j];
			if (node.positions) {
				for (var k = 0, kk = node.positions.length; k < kk; k++) {
					if (node.positions[k].node) score += node.positions[k].node.code.length;
					if (node.positions[k].padding) score += node.positions[k].padding * 4;
				}
			}
		}
		if (score < minScore) {
			minScore = score;
			minScoreIndex = i;
		}
	}

	return results[minScoreIndex];
}


function generateCode(list, shapeCallback) {
	var startAt = 1;
	var code = list[0].code;
	var kill = false;
	for (var i = 0; !kill; i++) {
		var line = generateLine(list, parseMap(shapeCallback(i)), startAt);

		if (!line) {
			kill = true;
			line = [];
			for (var j = startAt, jj = list.length; j < jj; j++) {
				line.push({
					positions: [
					{
						node: list[j],
						position: j
					}
					]
				});
			}
		}
		for (var j = line.length - 1; j >= 0; j--) {
			if (line[j].positions) {
				startAt = line[j].positions[line[j].positions.length - 1].position + 1;
				break;
			}
		}
		code += render(line);
	}

	return code;
}


function render(datas) {
	var result = '';
	for (var i = 0, ii = datas.length; i < ii; i++) {
		var data = datas[i];
		if (data.positions) {
			for (var j = 0, jj = data.positions.length; j < jj; j++) {
				if (!data.positions[j].paddingonly && data.positions[j].node) {
					result += data.positions[j].node.code;
				}
				if (data.positions[j].padding) {
					result += data.positions[j].node.padding(data.positions[j].padding);
				}
				if (data.positions[j].space) {
					for (var k = 0, kk = data.positions[j].space; k < kk; k++) {
						result += ' ';
					}
				}
			}
		} else if (data.spaces) {
			for (var j = 0; j < data.spaces; j++) {
				result += ' ';
			}
		} else if (data.breakline) {
			result += "\n";
		}
	}
	return result;
}


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
		list = parser.css(code);
		break;

		case 'js':
		case 'javascript':
		list = parser.js(code);
		break;

		default:
		list = parser.html(code);
	}

	return generateCode(list, options.shape);
};

