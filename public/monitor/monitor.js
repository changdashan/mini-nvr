
const VideoLiveViewMore = {

    m_JSPlayers:{},
    m_LiveViewDialogs:{},
    m_CamerasInLiveView: null,

    m_Width_Delta: 0,
    m_Height_Delta: 38,

    //-----------------------------------------------------------------------------------------     
    GetScreenSize: function (width, height) {
        if (!(width > 0 && height > 0)) {
            return { width: width, height: height };
        }

        const maxWidth = Math.max(220, window.innerWidth - 20 - this.m_Width_Delta);
        const maxHeight = Math.max(160, window.innerHeight - 20 - this.m_Height_Delta);
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        if (scale === 1) {
            return { width: width, height: height };
        }

        return {
            width: Math.round(width * scale),
            height: Math.round(height * scale)
        };
    },

    //-----------------------------------------------------------------------------------------     
    GetLiveViewPortSize: function (width, height) {
        if (!(width > 0 && height > 0)) {
            return { width: width, height: height };
        }

        const liveViewPort = document.getElementById('liveview');
        const liveViewPortWidth =  liveViewPort.clientWidth - 20 - this.m_Width_Delta;

        const scale = width/height;

        return {
            width: Math.round(liveViewPortWidth),
            height: Math.round(liveViewPortWidth * (1.0/scale)),
        };
    },    

    //-----------------------------------------------------------------------------------------     
    GetPlaybackViewPortSize: function () {

        const playbackViewPort = document.getElementById('playbackDiv');
        const playbackViewPortWidth =  playbackViewPort.clientWidth - 20 - this.m_Width_Delta;
        const playbackViewPortHeight =  playbackViewPort.clientHeight - 20 - this.m_Height_Delta;

        return {
            width: playbackViewPortWidth,
            height: playbackViewPortHeight,
        };
    },    

    //-----------------------------------------------------------------------------------------    
    GetResponsiveSize: function (width, height) {
        if (!(width > 0 && height > 0)) {
            return { width: width, height: height };
        }

        const liveViewPort = document.getElementById('liveview');
        const maxWidth = Math.max(220, liveViewPort.clientWidth - 20 - this.m_Width_Delta);
        const maxHeight = Math.max(160, liveViewPort.clientHeight - 20 - this.m_Height_Delta);

        //const maxWidth = Math.max(220, window.innerWidth - 20 - this.m_Width_Delta);
        //const maxHeight = Math.max(160, window.innerHeight - 20 - this.m_Height_Delta);
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        if (scale === 1) {
            return { width: width, height: height };
        }

        return {
            width: Math.round(width * scale),
            height: Math.round(height * scale)
        };
    },

    //-----------------------------------------------------------------------------------------
    ResizePlayerToFitDialog: function (cameraId, dialogWidth, dialogHeight) {
        const player = this.m_JSPlayers[cameraId];
        if (!player) {
            return;
        }

        const playerWidth = Math.max(0, dialogWidth - this.m_Width_Delta);
        const playerHeight = Math.max(0, dialogHeight - this.m_Height_Delta);
        const responsiveSize = this.GetResponsiveSize(playerWidth, playerHeight);
        const newWidth = responsiveSize.width;
        const newHeight = responsiveSize.height;

        if (player.video && player.video.h264Player !== undefined && player.video.h264Player !== null && typeof player.video.h264Player.resize === 'function') {
            player.video.h264Player.resize(newWidth, newHeight);
        } else if (player.renderer && typeof player.renderer.resize === 'function') {
            player.renderer.resize(newWidth, newHeight);
        }
    },

    //-----------------------------------------------------------------------------------------
    SignalAndStart: async function (cameraNode) {
        var that = this;
        let siteId = cameraNode.siteId;
        let cameraId = cameraNode.cameraId;
        let cameraName = cameraNode.cameraName;
        let streamOptions = cameraNode.streamOptions;

        await messaging_2('start', streamOptions, siteId, cameraId);        //signal to backend to start streaming

        setTimeout(function () { that.CreatePlayerAndStartPlay(cameraNode); }, 20);

        $("#" + cameraNode.dialog_divId).dialog('option', 'title', cameraName);   //show camera name as dialog title
    },

    //----------------------------------------------------------------------------------------- -
    resizePlayer: function({resizeApplied=false, currentPlayer=null, decoder=null, elapsedTime=0}){
        if (!resizeApplied && currentPlayer.renderer) {
            const screenSize = this.GetScreenSize();
            let width = decoder.width;
            let height = decoder.height;
            if ((!width || !height) && decoder.functions && decoder.decoder) {
                const getWidth = decoder.functions._mpeg1_decoder_get_width;
                const getHeight = decoder.functions._mpeg1_decoder_get_height;
                if (typeof getWidth === "function" && typeof getHeight === "function") {
                    width = getWidth(decoder.decoder);
                    height = getHeight(decoder.decoder);
                }
            }
            if (!(width > 0 && height > 0)) {
                console.warn("Unable to determine decoded video dimensions.", decoder);
                return;
            }
            let aspectRatio = width/height; 
            //console.log("width:" + width + " height:" + height + " radio:" + aspectRatio);                   
            if (screenSize.width < width){
                width = screenSize.width * 0.9;
                height = Math.floor(width * 1.0/aspectRatio);
            }
            //console.log("width:" + width + " height:" + height);
            currentPlayer.renderer.resize(width, height);
            resizeApplied = true;                   
        }        
    },

    //-----------------------------------------------------------------------------------------
    SignalToStop: function (cameraId) {

    },

    //-----------------------------------------------------------------------------------------
    CreatePlayerAndStartPlay: async function (cameraNode) {

        const cameraId = cameraNode.cameraId;
        const canvasId = cameraNode.canvasId;
        const playerOptions = cameraNode.playerOptions;

        let token = await requestAuthToken();
        var url = getWebSocketUrl_2(token, cameraId);        

        var canvas = document.getElementById(canvasId);
        playerOptions.canvas = canvas;
        
        let resizeApplied = false;
		//var player = new JSMpeg.Player(url, playerOptions);
	    var player = new JSMpeg.Player(url, { ...playerOptions,
            onVideoDecode: (decoder, time)=>{
                if (!resizeApplied && player.renderer) {
                    let width = decoder.width;
                    let height = decoder.height;
                    if ((!width || !height) && decoder.functions && decoder.decoder) {
                        const getWidth = decoder.functions._mpeg1_decoder_get_width;
                        const getHeight = decoder.functions._mpeg1_decoder_get_height;
                        if (typeof getWidth === "function" && typeof getHeight === "function") {
                            width = getWidth(decoder.decoder);
                            height = getHeight(decoder.decoder);
                        }
                    }
                    if (!(width > 0 && height > 0)) {
                        console.warn("Unable to determine decoded video dimensions.", decoder);
                        return;
                    }
                    //const responsiveSize = this.GetResponsiveSize(width, height);
                    const responsiveSize = this.GetLiveViewPortSize(width, height);                    
                    player.renderer.resize(responsiveSize.width, responsiveSize.height);
                    resizeApplied = true;                   
                }                
            }
        });        

        this.m_JSPlayers[cameraId] = player;
    },    

    //-----------------------------------------------------------------------------------------
    // The entry function to start showing live view
    ShowLiveViewDialog: async function(cameraNode, Top, Left) {
        var that = this;

        var siteId = cameraNode.siteId;        
        var cameraId = cameraNode.cameraId;
        var cameraName = cameraNode.cameraName;
        let playerOptions = cameraNode.playerOptions;
        let width = playerOptions.width;
        let height = playerOptions.height;
        //const responsiveSize = that.GetResponsiveSize(width, height);
        const responsiveSize = that.GetLiveViewPortSize(width, height);
        const dialogWidth = responsiveSize.width + that.m_Width_Delta;
        const dialogHeight = responsiveSize.height + that.m_Height_Delta;

        if (Top == null) Top = 20;
        if (Left == null) Left = 20;

        var dialog_divId = 'liveview_div_' + cameraId;

        setTimeout(function () {

            var canvasId = "liveview_canvas_" + cameraId;
            var newCanvas = "<div id='" + dialog_divId + "' title='" + cameraName + "'><canvas id='" + canvasId + "' width='" + width + "' height='" + height + "'></canvas></div>"
            $('#liveview').append(newCanvas);

            cameraNode.dialog_divId = dialog_divId;
            cameraNode.canvasId = canvasId;
            var liveViewDialogDiv = $("#" + dialog_divId);
            cameraNode.playerOptions.div = liveViewDialogDiv;

            var liveViewDialog = $("#" + dialog_divId).dialog({

                appendTo: '#liveview',

                open: function (event, ui) {
                    cameraNode.div = liveViewDialog;
                    if (!cameraName.endsWith('(x)'))
                        that.SignalAndStart(cameraNode);
                    else
                        liveViewDialogDiv.text("Camera is not available");
                },

                close: function (event, ui) {
                    //alert("view dialog closed");
                    that.RemoveFromCamerasInLiveView(cameraId);
                    //that.SignalToStop(cameraId);
                    that.DestroyPlayer(cameraId);
                    that.CloseLiveViewDialog(cameraId);
                    $("#" + dialog_divId).dialog('destroy');
                    $("#" + dialog_divId).remove();
                },

                resizeStop: function (event, ui) {
                    that.ResizePlayerToFitDialog(cameraId, ui.size.width, ui.size.height);
                },

                resizable: true,
                width: dialogWidth,
                height: dialogHeight,
                modal: false, 
                position: {
                    using: function (pos) {
                        $(this).css("top", Top + 'px');
                        $(this).css("left", Left + 'px');
                    }
                },

            });

            $("#" + dialog_divId).draggable({
                handle: ".diallog-header",         
            });
            
            that.m_LiveViewDialogs[cameraId] = liveViewDialog;

        }, 1);
    },

    //-----------------------------------------------------------------------------------------
    ShowLiveViewOfCamera: async function(cameraNode) {
        var that = this;
        if (this.m_CamerasInLiveView == null) this.m_CamerasInLiveView = [];
        var index = this.m_CamerasInLiveView.length;
        this.m_CamerasInLiveView.push(cameraNode);
        const cameraId = cameraNode.cameraId;
        const playerOptions = cameraNode.playerOptions;
        const width = playerOptions.width;
        const height = playerOptions.height;
        const aspectRatio = width / height;
        const screenSize = this.GetLiveViewPortSize(width, height);
        var pos = this.GetPosition(index, screenSize.width, screenSize.height);
        await this.ShowLiveViewDialog(cameraNode, pos.top, pos.left);   
    },

    //-----------------------------------------------------------------------------------------
    GetPosition: function(index, width, height) {
        var rowIndex = Math.floor(index / 1);
        var colIndex = index % 1;
        let top = 5 * (rowIndex + 1) + (rowIndex * (height + this.m_Height_Delta));
        let left = 10 * (colIndex + 1) + (colIndex * (width + this.m_Width_Delta));
        return { top: top, left: left }
    },

    //-----------------------------------------------------------------------------------------
    CloseLiveViewDialog: function(cameraId) {
        var liveViewDialog = this.m_LiveViewDialogs[cameraId];
        if (liveViewDialog != undefined && liveViewDialog != null){
            liveViewDialog.dialog("close");
            $(liveViewDialog.selector).remove();
            delete this.m_LiveViewDialogs[cameraId];
        }
    },

    //-----------------------------------------------------------------------------------------
    DestroyPlayer: function(cameraId) {
        var jsplayer = this.m_JSPlayers[cameraId];
        if (jsplayer != undefined) {
            jsplayer.destroy();
        }
    },

    //-----------------------------------------------------------------------------------------
    CloseAllLiveViews: function() {
        this.CloseLiveView();          
    },

    //-----------------------------------------------------------------------------------------
    CloseLiveView: function () {
        var that = this;
        var cameraobj = this.m_CamerasInLiveView.shift();
        if (cameraobj != undefined) {
            var camera = cameraobj.title + ":" + cameraobj.key;
            var cameraId = cameraobj.key;
            this.CloseLiveViewDialog(cameraId);
            setTimeout(function () { that.CloseLiveView(); }, 1000);
        }
    },

    //-----------------------------------------------------------------------------------------
    RemoveFromCamerasInLiveView: function(cameraId){
        var index = -1
        for(var i = 0; i< this.m_CamerasInLiveView.length; i++) {
            var cameraobj = this.m_CamerasInLiveView[i];
            if (cameraobj.cameraId == cameraId) {
                index = i;
                break;
            }
        }             
        
        if (index > -1){
            this.m_CamerasInLiveView.splice(index, 1);
        }       
    },

    //-------------------------------------------------------------------------------------------------
    getScreenSize: function () {
        var width = window.innerWidth;
        var height = window.innerHeight;
        return { width: width, height: height };
    },

    //-------------------------------------------------------------------------------------------------
    playRecordedClip:  async function (recordedSrc) {
        const token = await ensureAuthToken();
        playbackDiv.style.display = "block";
        //console.log("Playing recorded clip:", recordedSrc);
        const width = 640;
        const height = 400;
        const aspectRatio = height / width;

        if (recordedSrc.endsWith('.mp4')){
            imgShowSnapshot.style.display = "none";
            videoShowRecording.style.display = "block";
            videoShowRecording.width = width;
            videoShowRecording.height = height;            
            videoShowRecording.src = recordedSrc + "?token=" + token;
        }

        //if (recordedSrc.endsWith('.jpg')){               
        //    videoShowRecording.poster = recordedSrc + "?token=" + token;
        //    videoShowRecording.src = '';
        //}

        const viewSize = this.GetPlaybackViewPortSize();

        recordedSrc = recordedSrc.replace('.mp4', '.jpg');

        if (recordedSrc.endsWith('.jpg')){ 
            imgShowSnapshot.style.display = "block";
            imgShowSnapshot.width = width;
            imgShowSnapshot.height = height;              
            imgShowSnapshot.src = recordedSrc + "?token=" + token;
            if (viewSize.width < 768) {
                imgShowSnapshot.width = viewSize.width * 0.9; // 90% of screen width
                imgShowSnapshot.height = viewSize.width * aspectRatio; // 40% of screen height
            }        
        }    

        try {
            if (viewSize.width < 768) {
                videoShowRecording.width = viewSize.width * 0.9; // 90% of screen width
                videoShowRecording.height = viewSize.width * aspectRatio; // 40% of screen height
            }

            if (recordedSrc.endsWith('.mp4'))        
                await videoShowRecording.play();

        } catch (error) {
            console.warn("Playback failed:", error);
        }
    },

    //-------------------------------------------------------------------------------------------------
    playbackclip: function (event) {
        event.preventDefault();
        const link = event.currentTarget;
        const url = new URL(link.href, window.location.origin);           
        this.playRecordedClip(url.pathname);
    }    
}
