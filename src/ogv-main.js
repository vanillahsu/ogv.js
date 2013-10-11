OgvJs = (function(canvas) {
	var self = this;
    var ctx = canvas.getContext('2d');
    
    var Module = {
    	noInitialRun: true,
    	noExitRuntime: true,
    	print: function(str) {
    		console.log("OgvJs: " + str);
    	}
    };
    //import "../build/ogv-libs.js"
    
    var OgvJsInit = Module.cwrap('OgvJsInit', 'void', []);
    var OgvJsDestroy = Module.cwrap('OgvJsDestroy', 'void', []);
    var OgvJsReceiveInput = Module.cwrap('OgvJsReceiveInput', 'void', ['*', 'number']);
    var OgvJsProcess = Module.cwrap('OgvJsProcess', 'int', []);

	var imageData, imageWidth, imageHeight;
	function OgvJsImageData(width, height) {
		if (imageData !== null && width == imageWidth && height == imageHeight) {
			// reuse imageData object
		} else {
			imageData = ctx.createImageData(width, height);
		}
		return imageData;
	}
	
	var inputBuffer, inputBufferSize;
	function reallocInputBuffer(size) {
		if (inputBuffer && inputBufferSize >= size) {
			// We're cool
			return inputBuffer;
		}
		if (inputBuffer) {
			Module._free(inputBuffer);
		}
		inputBufferSize = size;
		inputBuffer = Module._malloc(inputBufferSize);
		return inputBuffer;
	}
	
	function OgvJsFrameCallback(imageData) {
		if (self.onframe) {
			self.onframe(imageData);
		}
	}

	/**
	 * @property function(imageData) event handler when a frame is decoded
	 */
	self.onframe = null;
		
	/**
	 * Tear down the instance when done.
	 *
	 * todo: do we need to do something more to destroy the C environment?
	 */
	self.destroy = function() {
		if (inputBuffer) {
			Module._free(inputBuffer);
			inputBuffer = undefined;
		}
		OgvJsDestroy();
		console.log("ogv.js destroyed");
	};
	
	/**
	 * Queue up a chunk of input data for later processing.
	 *
	 * @param ArrayBuffer data
	 */
	self.receiveInput = function(data) {
		// Map the blob into a buffer in emscripten's runtime heap
		var len = data.byteLength;
		var buffer = reallocInputBuffer(len);
		Module.HEAPU8.set(new Uint8Array(data), buffer);

		console.log("receiving! " + buffer + "; " + len);
		OgvJsReceiveInput(buffer, len);
		console.log("received...?");
	};
	
	/**
	 * Process the next packet in the stream
	 *
	 * This may trigger 'onframe' event callbacks after calling.
	 */
	self.process = function() {
		return OgvJsProcess();
	}

	OgvJsInit();
	return self;
});
