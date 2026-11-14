/*jshint browser:true */
/*global Avc:true, YUVWebGLCanvas:true, Size:true,
          requestAnimationFrame:true */


/*
 * ============================================================================
 * requestAnimationFrame polyfill
 * ============================================================================
 */
(function (window) {
    'use strict';

    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x,
        length,
        currTime,
        timeToCall;

    for (x = 0, length = vendors.length;
         x < length && !window.requestAnimationFrame;
         ++x) {

        window.requestAnimationFrame =
            window[vendors[x] + 'RequestAnimationFrame'];

        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {

            currTime = new Date().getTime();

            timeToCall = Math.max(
                0,
                16 - (currTime - lastTime)
            );

            lastTime = currTime + timeToCall;

            return window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

}(window));


/*
 * ============================================================================
 * H264Player
 *
 * Each H264Player instance owns its own:
 *
 *     socket
 *     avc
 *     webGLCanvas
 *     canvas
 *     width
 *     height
 *     callbackOnce
 *
 * Therefore multiple H264Player objects can run independently.
 * ============================================================================
 */
(function (window, document) {

    'use strict';


    /*
     * ------------------------------------------------------------------------
     * Constructor
     * ------------------------------------------------------------------------
     */
    function H264Player(div, options) {

        options = options || {};

        /*
         * Store constructor arguments on this instance.
         */
        this.div = div;
        this.options = options;
        this._ownsAvc = false;

        /*
         * Instance-specific state.
         */
        this.socket = null;
        this.avc = null;
        this.worker = null;
        this.webGLCanvas = null;
        this.canvas = null;

        this.width = options.width || 640;
        this.workerUrl = options.workerUrl || 'h264/h264-player-worker.js';
        this.height = options.height || 360;
        this.displayWidth = this.width;
        this.displayHeight = this.height;

        this.callbackOnce = null;

        this.animationFrameId = null;
        this._visibilityBound = false;
        this._isHidden = false;
        this.destroyed = false;


        /*
         * Network settings.
         */
        this.hostname =
            options.hostname ||
            window.document.location.hostname;

        this.port =
            options.port ||
            window.document.location.port;


        /*
         * Create canvas and AVC decoder.
         */
        this.setupCanvas();
        this.setupAvc();
        this.bindVisibilityState();


        /*
         * Only one Broadway decoder instance can safely exist in a page.
         * The generated module keeps global HEAP and patch state across all
         * instances, so additional players will corrupt the shared decoder.
         */
        if (this.avc &&
            (options.useBuildinSocket === undefined ||
             options.useBuildinSocket === true)) {

            this.setupSocket();
        }
    }


    /*
     * ------------------------------------------------------------------------
     * setupCanvas()
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.setupCanvas = function () {

        var canvas;


        /*
         * Case 1:
         *
         * An existing canvas was supplied through options.canvas.
         */
        if (this.options.canvas) {

            canvas = this.options.canvas;
        }


        /*
         * Case 2:
         *
         * The first constructor argument itself is a canvas.
         */
        else if (this.div &&
                 this.div.tagName &&
                 this.div.tagName.toLowerCase() === 'canvas') {

            canvas = this.div;
        }


        /*
         * Case 3:
         *
         * The first constructor argument is a DIV/container.
         */
        else {

            canvas = document.createElement('canvas');

            if (this.div &&
                typeof this.div.appendChild === 'function') {

                this.div.appendChild(canvas);

            } else {

                throw new TypeError(
                    'H264Player: first argument must be a DOM ' +
                    'container element or canvas, or options.canvas ' +
                    'must be supplied.'
                );
            }
        }


        /*
         * Set canvas dimensions.
         */
        canvas.width = this.width;
        canvas.height = this.height;

        canvas.style.backgroundColor = '#333333';


        /*
         * Save canvas on this player instance.
         */
        this.canvas = canvas;


        /*
         * Create WebGL renderer for this player.
         */
        this.webGLCanvas =
            new YUVWebGLCanvas(
                canvas,
                new Size(
                    this.width,
                    this.height
                )
            );
    };


    /*
     * ------------------------------------------------------------------------
     * setupAvc()
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.resize = function (width, height) {

        if (!this.canvas) {
            return;
        }

        var nextWidth = Number(width) || this.width || this.canvas.width;
        var nextHeight = Number(height) || this.height || this.canvas.height;

        this.displayWidth = nextWidth;
        this.displayHeight = nextHeight;

        // Keep the decoded frame size unchanged. Only the presentation layer is
        // scaled to the mobile dialog width so the stream data stays valid.
        this.canvas.style.width = nextWidth + 'px';
        this.canvas.style.height = nextHeight + 'px';

        if (this.webGLCanvas && this.webGLCanvas.gl) {
            this.webGLCanvas.gl.viewport(0, 0, this.width || this.canvas.width, this.height || this.canvas.height);
        }

        return {
            width: nextWidth,
            height: nextHeight
        };
    };


    H264Player.prototype.setupAvc = function () {

        var self = this;

        if (this.options && this.options.disableWorker !== true &&
            typeof Worker !== 'undefined' && this.workerUrl) {

            return this.setupWorkerAvc();
        }

        if (H264Player._activeAvcCount &&
            H264Player._activeAvcCount > 0) {

            console.warn(
                'Broadway AVC decoder cannot safely run multiple instances in the same page. ' +
                'Only one H264Player may be active at a time. '
            );

            this.avc = null;
            return;
        }

        H264Player._activeAvcCount = (H264Player._activeAvcCount || 0) + 1;
        this._ownsAvc = true;

        /*
         * Every H264Player gets its own AVC decoder.
         */
        this.avc = new Avc();

        this.avc.configure({
            filter: 'original',
            filterHorLuma: 'optimized',
            filterVerLumaEdge: 'optimized',
            getBoundaryStrengthsA: 'optimized'
        });


        /*
         * This callback belongs to THIS H264Player instance.
         */
        this.avc.onPictureDecoded =
            function (buffer, bufWidth, bufHeight) {

                self.handleDecodedFrame(
                    buffer,
                    bufWidth,
                    bufHeight
                );
            };
    };


    /*
     * ------------------------------------------------------------------------
     * setupWorkerAvc()
     * ------------------------------------------------------------------------
     *
     * Isolate the decoder in its own worker to avoid global Broadway state
     * leaks between multiple cameras in the same page.
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.setupWorkerAvc = function () {

        var self = this;
        var workerUrl = this.workerUrl;
        var defaultConfig = {
            filter: 'original',
            filterHorLuma: 'optimized',
            filterVerLumaEdge: 'optimized',
            getBoundaryStrengthsA: 'optimized'
        };

        this.worker = new Worker(workerUrl);

        this.avc = {
            configure: function (config) {
                self.worker.postMessage({
                    type: 'init',
                    options: config || defaultConfig
                });
            },
            decode: function (data) {

                if (!self.worker || self.destroyed || !data) {
                    return;
                }

                var payload = data;
                var buffer;

                if (payload instanceof Uint8Array) {
                    buffer = new Uint8Array(payload.length);
                    buffer.set(payload);
                } else if (payload instanceof ArrayBuffer) {
                    buffer = new Uint8Array(payload);
                } else if (payload && payload.buffer instanceof ArrayBuffer) {
                    buffer = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
                } else {
                    return;
                }

                self.worker.postMessage({
                    type: 'decode',
                    buffer: buffer.buffer,
                    offset: buffer.byteOffset,
                    length: buffer.byteLength
                }, [buffer.buffer]);
            },
            onPictureDecoded: function (buffer, bufWidth, bufHeight) {
                self.handleDecodedFrame(
                    buffer,
                    bufWidth,
                    bufHeight
                );
            }
        };

        this.worker.onmessage = function (event) {

            var payload = event.data || {};

            if (payload.type === 'ready') {
                return;
            }

            if (payload.type === 'frame') {

                if (typeof self.avc.onPictureDecoded === 'function') {
                    self.avc.onPictureDecoded(
                        new Uint8Array(payload.buffer),
                        payload.width,
                        payload.height
                    );
                }
            }
        };

        this.worker.onerror = function (event) {
            console.error('H264 worker error:', event && event.message ? event.message : event);
        };

        this.avc.configure(defaultConfig);
    };


    /*
     * ------------------------------------------------------------------------
     * setupSocket()
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.bindVisibilityState = function () {

        var self = this;

        if (this._visibilityBound) {
            return;
        }

        this._visibilityBound = true;

        document.addEventListener('visibilitychange', function () {
            self.setVisibilityState(document.hidden || document.visibilityState === 'hidden');
        });

        this.setVisibilityState(document.hidden || document.visibilityState === 'hidden');
    };


    H264Player.prototype.setVisibilityState = function (hidden) {

        this._isHidden = !!hidden;

        if (this.worker) {
            this.worker.postMessage({
                type: hidden ? 'pause' : 'resume'
            });
        }

        if (hidden) {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.close();
                this.socket = null;
            }
            return;
        }

        if (this.avc && !this.socket &&
            (this.options.useBuildinSocket === undefined ||
             this.options.useBuildinSocket === true)) {

            this.setupSocket();
        }
    };


    H264Player.prototype.setupSocket = function () {

        var self = this;


        this.socket = new WebSocket(
            'ws://' +
            this.hostname +
            ':' +
            this.port +
            '/dronestream'
        );

        this.socket.binaryType = 'arraybuffer';


        /*
         * WebSocket message handler belongs to THIS player.
         */
        this.socket.onmessage =
            function (message) {

                self.handleNalUnits(message);
            };


        /*
         * Optional error callback.
         */
        this.socket.onerror =
            function (event) {

                if (typeof self.onSocketError === 'function') {
                    self.onSocketError(event);
                }
            };


        /*
         * Optional close callback.
         */
        this.socket.onclose =
            function (event) {

                if (typeof self.onSocketClose === 'function') {
                    self.onSocketClose(event);
                }
            };
    };


    /*
     * ------------------------------------------------------------------------
     * handleNalUnits()
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.handleNalUnits =
        function (message) {

            if (this.destroyed) {
                return;
            }

            if (!this.avc) {
                return;
            }


            /*
             * Decode using this player's AVC decoder.
             */
            this.avc.decode(
                new Uint8Array(message.data)
            );
        };


    /*
     * ------------------------------------------------------------------------
     * handleDecodedFrame()
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.handleDecodedFrame =
        function (buffer, bufWidth, bufHeight) {

            var self = this;

            if (this.destroyed) {
                return;
            }


            /*
             * Capture THIS player's WebGL canvas.
             *
             * This is important for multi-instance safety.
             */
            var webGLCanvas = this.webGLCanvas;


            /*
             * Calculate YUV plane sizes.
             */
            var lumaSize =
                bufWidth * bufHeight;

            var chromaSize =
                lumaSize >> 2;


            /*
             * Schedule WebGL rendering.
             */
            this.animationFrameId =
                requestAnimationFrame(function () {

                    /*
                     * The player may have been destroyed while
                     * requestAnimationFrame was waiting.
                     */
                    if (self.destroyed) {
                        return;
                    }

                    if (!webGLCanvas) {
                        return;
                    }


                    /*
                     * Y plane.
                     */
                    webGLCanvas.YTexture.fill(
                        buffer.subarray(
                            0,
                            lumaSize
                        )
                    );


                    /*
                     * U plane.
                     */
                    webGLCanvas.UTexture.fill(
                        buffer.subarray(
                            lumaSize,
                            lumaSize + chromaSize
                        )
                    );


                    /*
                     * V plane.
                     */
                    webGLCanvas.VTexture.fill(
                        buffer.subarray(
                            lumaSize + chromaSize,
                            lumaSize + 2 * chromaSize
                        )
                    );


                    /*
                     * Render frame.
                     */
                    webGLCanvas.drawScene();
                });


            /*
             * Call the registered callback once.
             */
            if (this.callbackOnce !== null &&
                this.width) {

                var callback =
                    this.callbackOnce;


                /*
                 * Clear callback BEFORE invoking it.
                 *
                 * This avoids problems if the callback itself
                 * registers another callback.
                 */
                this.callbackOnce = null;


                /*
                 * Send only the Y/luma portion.
                 */
                callback(
                    buffer.subarray(
                        0,
                        this.width * this.height
                    )
                );
            }
        };


    /*
     * ------------------------------------------------------------------------
     * onNextFrame()
     * ------------------------------------------------------------------------
     *
     * Register a callback that will be called once for the
     * next decoded frame.
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.onNextFrame =
        function (callback) {

            if (typeof callback !== 'function') {
                this.callbackOnce = null;
                return;
            }

            this.callbackOnce = callback;
        };


    /*
     * ------------------------------------------------------------------------
     * write()
     * ------------------------------------------------------------------------
     *
     * Allows external code to feed H264 data directly to this player.
     *
     * Example:
     *
     *     player.write(message);
     *
     * where message.data contains an ArrayBuffer.
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.write =
        function (message) {

            if (this.destroyed) {
                return;
            }

            this.handleNalUnits(message);
        };


    /*
     * ------------------------------------------------------------------------
     * destroy()
     * ------------------------------------------------------------------------
     *
     * Release all resources associated with this player.
     * ------------------------------------------------------------------------
     */
    H264Player.prototype.destroy =
        function () {

            if (this.destroyed) {
                return;
            }

            this.destroyed = true;


            /*
             * Cancel pending animation frame.
             */
            if (this.animationFrameId !== null) {

                window.cancelAnimationFrame(
                    this.animationFrameId
                );

                this.animationFrameId = null;
            }


            /*
             * Close WebSocket.
             */
            if (this.socket) {

                /*
                 * Remove event handlers first.
                 */
                this.socket.onmessage = null;
                this.socket.onerror = null;
                this.socket.onclose = null;


                /*
                 * Close socket if it is still active.
                 */
                if (this.socket.readyState ===
                        WebSocket.OPEN ||
                    this.socket.readyState ===
                        WebSocket.CONNECTING) {

                    this.socket.close();
                }

                this.socket = null;
            }

            if (this._visibilityBound) {
                this._visibilityBound = false;
            }


            /*
             * Detach AVC decoder callback.
             */
            if (this.avc) {
                this.avc.onPictureDecoded = null;
            }

            if (this.worker) {
                this.worker.onmessage = null;
                this.worker.onerror = null;
                this.worker.terminate();
                this.worker = null;
            }

            if (this._ownsAvc && H264Player._activeAvcCount) {
                H264Player._activeAvcCount -= 1;
            }

            this._ownsAvc = false;

            /*
             * Release references.
             */
            this.avc = null;
            this.webGLCanvas = null;
            this.canvas = null;
            this.callbackOnce = null;
        };


    /*
     * ------------------------------------------------------------------------
     * Export H264Player
     * ------------------------------------------------------------------------
     */
    window.H264Player = H264Player;


}(window, document));

