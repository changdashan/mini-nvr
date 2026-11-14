/*jshint worker:true */
(function () {
    'use strict';

    if (typeof importScripts === 'function') {
        try {
            importScripts('./h264.js');
        } catch (error) {
            self.postMessage({
                type: 'error',
                message: error && error.message ? error.message : String(error)
            });
            return;
        }
    }

    var decoder = null;
    var isPaused = false;

    function defaultConfig() {
        return {
            filter: 'original',
            filterHorLuma: 'optimized',
            filterVerLumaEdge: 'optimized',
            getBoundaryStrengthsA: 'optimized'
        };
    }

    function ensureDecoder() {
        if (!decoder && typeof Avc !== 'undefined') {
            decoder = new Avc();
            decoder.configure(defaultConfig());

            decoder.onPictureDecoded = function (buffer, width, height) {
                if (!buffer || !buffer.length) {
                    return;
                }

                var frame = new Uint8Array(buffer);
                self.postMessage({
                    type: 'frame',
                    buffer: frame.buffer,
                    width: width,
                    height: height
                }, [frame.buffer]);
            };
        }

        return decoder;
    }

    self.addEventListener('message', function (event) {
        var message = event.data || {};

        if (message.type === 'pause') {
            isPaused = true;
            return;
        }

        if (message.type === 'resume') {
            isPaused = false;
            return;
        }

        if (message.type === 'init') {
            ensureDecoder();

            if (decoder && message.options) {
                decoder.configure(message.options);
            }

            self.postMessage({ type: 'ready' });
            return;
        }

        if (message.type === 'decode') {
            if (isPaused) {
                return;
            }

            if (!decoder) {
                ensureDecoder();
            }

            if (!decoder || !message.buffer) {
                return;
            }

            var data = new Uint8Array(message.buffer, message.offset || 0, message.length || message.buffer.byteLength);
            decoder.decode(data);
        }
    }, false);

    if (typeof Avc !== 'undefined') {
        ensureDecoder();
        self.postMessage({ type: 'ready' });
    }
}());
