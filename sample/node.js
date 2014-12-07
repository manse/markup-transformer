// Load modules
//----------------------------------------
var transformer = require('../index.js');
// var transformer = require('node-markup-transformer');
var fs = require('fs');


// Read target source code
//----------------------------------------
var src = fs.readFileSync('source.html', 'utf8');


// Transform without options
//----------------------------------------
var result0 = transformer(src);
fs.writeFileSync('transformed_without_options.html', result0);


// Transform with all options
//----------------------------------------
var result1 = transformer(src, {
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
fs.writeFileSync('transformed_zigzag.html', result1);


