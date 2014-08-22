var transformer = require('../index.js');
var fs = require('fs');


var src = fs.readFileSync('source.html', 'utf8');
src = transformer(src, {
	syntax: 'html', // ..or 'css', 'js'

	shape: function(n) {
		console.log('Shape Requested: line number #' + n);
		var map = [
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111111111111111111100000000000000011111111111111111111111',
			'11111111111111111111111111111111111111111111111111100000000000000011111111111111111111111',
			'11111111111111111111111111111111111111111111111111100000000000000011111111111111111111111',
			'11111111111111111111111111111111111111111111111111100000000000000011111111111111111111111',
			'11111111111111111111111111111111111111111111111111100000000000000011111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111111111111111111111',
		];
		return map[n % map.length];
	}
})
fs.writeFileSync('transformed.html', src);
