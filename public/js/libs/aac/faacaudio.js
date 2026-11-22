//-------------------------------------------------------------------------------------------------------------
JSMpeg.Decoder.AACAudio = (function(){ 
	"use strict";

	//---------------------------------------------------------------------------------------------
	var AAC = function(options) {
		//JSMpeg.Decoder.Base.call(this, options);		
		this.player = new AV.Player.fromWebSocket('ws://localhost:8080', 'base.m4a');
		this.player.play();
	};

	AAC.prototype = Object.create(JSMpeg.Decoder.Base.prototype);
	AAC.prototype.constructor = AAC;

	//---------------------------------------------------------------------------------------------	
	AAC.prototype.appendBuffer = function(buffer1, buffer2) {
		var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
		tmp.set(new Uint8Array(buffer1), 0);
		tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
		return tmp;
	}; 
	
	//---------------------------------------------------------------------------------------------
	AAC.prototype.write = function(pts, buffers) {
		var buf = new Uint8Array();
		for(var i=0; i<buffers.length; i++){
			var buffer = buffers[i];
			buf = this.appendBuffer(buf, buffer);
			//this.player.asset.source.write(buffer);			
		}
		this.player.asset.source.write(buf);		
	};
	
	return AAC;

})();


