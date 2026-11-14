//-------------------------------------------------------------------------------------------------------------
JSMpeg.Decoder.H264Video = (function(){ 
	"use strict";

	var H264 = function(options) {
		JSMpeg.Decoder.Base.call(this, options);

		//var div_liveview = document.getElementById("liveview");
		//var options = {hostname:'localhost', port:'8084', DisableWebSocket:true, canvas:options.canvas, width:options.width, height:options.height};	
		options.useBuildinSocket = false;
		this.h264Player = new H264Player(options.div, options);		
	};

	H264.prototype = Object.create(JSMpeg.Decoder.Base.prototype);
	H264.prototype.constructor = H264;

	H264.prototype.write = function(pts, buffers) {
		var buf = new Uint8Array();
		for(var i=0; i<buffers.length; i++){
			var buffer = buffers[i];
			buf = this.appendBuffer(buf, buffer);
		}
		//var firstUnit = buf.subarray(0,6);
		//console.log(firstUnit);
		//this.player.write(firstUnit);  
		var nalUnit = buf.subarray(6);
		//console.log(nalUnit);
		var message = new Object();
		message.data = nalUnit;
		this.h264Player.write(message);
	};

	H264.prototype.appendBuffer = function(buffer1, buffer2) {
		var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
		tmp.set(new Uint8Array(buffer1), 0);
		tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
		return tmp;
	}; 

	return H264;

})();

