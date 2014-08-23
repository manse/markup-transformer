# markup-transformer

markup-transformer transforms your html/css/javascript source into ASCII Art with keeping syntax.
https://www.npmjs.org/package/markup-transformer

## Installation

```
npm install markup-transformer
```

## Usage
```JavaScript

/* Load modules */
var markupTransformer = require('markup-transformer');
var fs = require('fs');


/* Read target source code */
var sourceCode = fs.readFileSync('source.html', 'utf8');


/* Transform without options
	By default, source code should be transformed by hexagonal form and interpreted as HTML.
*/
var result0 = markupTransformer(sourceCode);
fs.writeFileSync('transformed_default.html', result0);
console.log(result0);
console.log(';\n;\n;\n;');


/* Transform with options
	There are two options, 'syntax' and 'shape'.
*/
var result1 = markupTransformer(sourceCode, {
	syntax: 'html', // ..or 'css', 'js'
	/* String,
		Specifies syntax of the source code ('html' by default).
		For example the source code is written in StyleSheet, you should pass {syntax: 'css'}.
	*/


	shape: function(n) {
		var map = [
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111111111111111111100000000000000011111',
			'11111111111111111111111111111111111111111111111111100000000000000011111',
			'11111111111111111111111111111111111111111111111111100000000000000011111',
			'11111111111111111111111111111111111111111111111111100000000000000011111',
			'11111111111111111111111111111111111111111111111111100000000000000011111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111111111111111111100000000000000011111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111',
			'11111111111111111111100000000000000011111111111111111111111111111111111',
		];
		return map[n % map.length];
	}
	/* function,
		Specifies the form to transform source code (`hexagonal form` by default).
		The function gets passed one argument: a line number at the output, 
		and should return a String which comprised of 0 or 1.
		'1' will filled with transformed source code, and '0' will be blank (filled with spaces).
	*/
})
fs.writeFileSync('transformed_zigzag.html', result1);
console.log(result1);

```

then your terminal says:
```html
<!DOCTYPE html><html
><head><meta charset="UTF-8"><title>Attractor (attractor.manse.jp)</title><meta name="apple-mobile-web-app-capable"
 content="yes"><meta name="viewport" content="user-scalable=no, width=1024, maximum-scale=1"><style type="text/css"
>html,body{width:100%;height:100%;overflow:hidden}html,body,ul,li,h1,h2,div,p,th{padding:0;margin:0;line-height
:130%;-webkit-user-select:none;-moz-user-select:none;-khtml-user-select:none;-o-user-select:none;-ms-user-select
:none;user-select:none}.bl{text-indent:-999em;overflow:hidden;text-align:left}.b{background:#000}.i{background
:#fff}body,td,th{color:#fff;font-size:9pt;;font-family   :Arial,Verdana,Tahoma}.i,.i td,.i th{color:rgba(0,0,0,0.8)
}#cover{width:100%;height:100%;top:0;left:0;;right:         0;bottom:0;position:fixed;z-index:1000;background:
#000}.i #cover{background:#fff;;;}#cover .logo{                 width:190px;height:44px;background:url(init.gif)
no-repeat 0 0;position:absolute;top:50%;;;;;                       left:50%;margin:-22px 0 0 -95px}.ie #cover
.unsupport{position:absolute;top:50%;;;;                               left:50%;width:346px;height:37px;background:
url(ie.gif) no-repeat;;margin:60px 0                                      0 -173px}.i #cover .logo{background-position
:0 bottom}canvas{position:fixed;;                                             top:0;left:0;z-index:1;-webkit-transform
:rotateZ()}h1{width:319px;;;;;;                                                 height:75px;background:url(logo.png)
no-repeat 0 0;position:fixed;;;                                                 left:45px;bottom:0;z-index:2}.i
h1{background-position:bottom;}                                                 #form{z-index:3;position:fixed;
;bottom:0;left:0;right:0;filter                                                 :alpha(opacity=4);-moz-opacity
:.4;opacity:.4;padding:15px 0;;                                                 border-top:1px solid rgba(0,0,0,
0);}#form th{padding:0 0 0 15px                                                 ;font-weight:bold;text-align:left}
#form .box{width:148px;;padding                                                 :5px 15px 0}.phone #form th,.phone
#form .box{padding:5px 10px 0;}                                                 #form .separate{border-right:1px
solid rgba(255,255,255,0.3);;;}                                                 .i #form .separate{border-right:1px
solid rgba(0,0,0,0.1);}#form h2                                                 {font-size:8pt;font-weight:normal
;padding:3px 0 0;}.slider,.face                                                 ,.radio .border,.radio .dot,.button{-moz-border-radius
:99em;;;;-webkit-border-radius:                                                 99em;-khtml-border-radius:99em;-o-border-radius
:99em;-ms-border-radius:99em;;;                                                 border-radius:99em;border-width:
1px;border-style:solid;}.slider                                                 {margin:5px 0;width:146px;height
:6px;;border-color:rgba(255,255                                                 ,255,0.4);background:rgba(255,
255,255,0.15);position:relative;;}                                           .i .slider{border-color:rgba(0,0,
0,0.2);background:rgba(0,0,0,0.05);;;}                                   .face{top:-5px;margin-left:-5px;width
:14px;height:14px;;border-color:rgba(255,                             255,255,0.7);background:rgba(255,255,255,0.5);overflow
													:
													:
 pad></div></td><td class="box"                                                  valign="top"><h2>Life</h2><div
    pad id="s_amount"></div><h2                                                 >Delta</h2><div id="s_speed"></div><h2>Lag</h2><div
  id="s_shadow"></div><h2>Line                                                  Width</h2><div id="s_line_width"
 pad></div></td><td class="box"                                                  valign="top"><h2>Jitter</h2><div id="s_color"
 pad></div><h2>Lighter</h2><div                                                  id="s_lighter"></div></td><td class="box"
   valign="top"><div id="r_camera">                                         </div><h2>Zoom</h2><div id="s_zoom"></div></td><td
 pad pad class="box" valign="top"><div                                    id="b_theme"></div><div id="b_save">
</div></td></tr></table></div><div pad pad                            id="pause"></div><p class="bl" id="copyright">Copyright(C)<a
 pad href="http://manse.jp/">manse.jp</a>All                      rights reserved.</p></body></html>
;
;
;
;
<!DOCTYPE html><html
 ><head><meta charset="UTF-8"><title               >Attractor (attractor.manse.jp)</title><meta name="apple-mobile-web-app-capable" content="yes"><meta name="viewport" content="user-scalable=no, width=1024, maximum-scale=1"
  ><style type="text/css">html,body{               width:100%;height:100%
;overflow:hidden;}html,body,ul,li,h1               ,h2,div,p,th{padding
:0;margin:0;line-height:130%;;;;;;;;               -webkit-user-select:
none;-moz-user-select:none;;;;;;;;;;               -khtml-user-select:none;-o-user-select
:none;-ms-user-select:none;user-select:none;;;}.bl{               text-indent:-999em;
;overflow:hidden;text-align:left}.b{background:#000               }.i{background:#fff
}body,td,th{color:#fff;font-size:9pt;;;font-family:               Arial
,Verdana,Tahoma;;;}.i,.i td,.i th{color:rgba(0,0,0,               0.8)}
#cover{width:100%;height:100%;top:0;left:0;;right:0               ;bottom:0;position
:fixed;z-index:1000;background:#000;               }.i #cover{background
:#fff}#cover .logo{width:190px;;;;;;               height:44px;background:url(init.gif)
no-repeat 0 0;position:absolute;;top               :50%;left:50%;margin:-22px
0 0 -95px;;;;}.ie #cover .unsupport{               position:absolute;top:50%
;left:50%;width:346px;height:37px;;;               background:url(ie.gif) no-repeat;margin
:60px 0 0 -173px;}.i                #cover .logo{background-position:0 bottom}canvas
{position:fixed;;top:               0;left:0;z-index:1;-webkit-transform
:rotateZ();}h1{width:               319px;height:75px;background:url(logo.png) no-repeat
0 0;position:fixed;;;               left:45px;bottom:0;z-index:2}.i h1{
background-position :               bottom}#form{z-index:3;position:fixed;bottom:0;left
:0;right:0;filter:alpha(opacity=4);;               -moz-opacity:.4;opacity
:.4;padding:15px 0;;;border-top:1px                solid rgba(0,0,0,0)}#form
													:
													:
```
