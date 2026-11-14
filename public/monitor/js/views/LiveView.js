//-------------------------------------------------------------------------------------------------
// javascript: LiveView.js
// Developed by Dashan Chang
// Date: 2/14/2018
//
// Description: LiveView is a controller object that facilitates an integration of liveview 
//              into other web applications.
//
//  To use this utility object, the following scripts are requeired.
//  <link rel="stylesheet" href="js/libs/jquery/jquery-ui.min.css">
//  <script src="js/libs/jquery/jquery.js"></script>
//  <script src="js/libs/jquery/jquery-ui.min.js"></script>
//  <script src="js/libs/jsmpeg/jsmpeg.min.js"></script>
//  <script src="js/liveview.js"></script>
//
//-------------------------------------------------------------------------------------------------

function LiveView(div_id, camera, options) {

    var random = Math.floor((Math.random() * 100) + 1);

    this.camera = camera;
    this.dialogId = div_id;
    this.canvasId = "playercanvas_" + div_id;

    this.top = options.top || screen.height/2 - 240;
    this.left = options.left || screen.width/2 - 320;
    this.width = options.width || 320;
    this.height = options.height || 240;
    this.duration = options.duration || 30;
    this.signallingurl = options.signallingurl || "http://localhost/StreamSignalling/StreamSignalling.aspx"; //"https://kastlenet.kastle.com/StreamSignalling/StreamSignalling.aspx" ;
	this.mykastleauth = options.mykastleauth || '';

    this.canvas = null;
    this.player = null;
    this.dialogue = null;


    //---------------------------------------------------------------------------------------------
    this.openPlayer = function (streamserver, port, secret) {
        var that = this;
        var camera = this.camera.replace(/ /g, '_').toUpperCase();
        var url = 'wss://' + streamserver + ':' + port + '/' + secret + '/' + camera;

        var canvasHtml = "<canvas id='" + this.canvasId + "' width='" + this.width + "' height='" + this.height + "'></canvas>";
        $('#' + this.dialogId).append(canvasHtml);
        var canvas = document.getElementById(this.canvasId);
        this.player = new JSMpeg.Player(url, { audio: false, canvas: canvas, disableGl: true });
        this.player.source.onClose = function () {
            if (this.dialogue != null) {
                this.player = null;
                this.dialogue.close();
            }
        };
    }

    //---------------------------------------------------------------------------------------------
    this.requestStream = function (action) {
        var that = this;
        var streamsignal = {
            cameraid: this.camera,
            action: action,
            width: this.width,
            height: this.height,
            duration: this.duration,
			mykastleauth: this.mykastleauth,
        };

        //alert(JSON.stringify(sentdata));
        var url = this.signallingurl;

        $.ajax({
            url: url,
            dataType: 'json',
            type: 'post',
            headers: {
                //'Content-Type': 'application/x-www-form-urlencoded'
            },
            //contentType: 'application/json',
            contentType: 'application/x-www-form-urlencoded',
            data: streamsignal,
            processData: true,
            success: function (signal, textStatus, jQxhr) {
                //alert(signal.secret);
				if (signal == 'undefined' || signal == null || signal.error != "")
					return;
					
                if (action == 'Start') {
                    var camera = signal.camera;
                    var streamserver = signal.streamserver;
                    var port = signal.port;
                    var secret = signal.secret;
                    setTimeout(function () { that.openPlayer(streamserver, port, secret); }, 2000);
                }
            },
            error: function (jqXhr, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    }

    //---------------------------------------------------------------------------------------------
    this.stopStreaming = function () {
        this.requestStream("Stop");
    }

    //---------------------------------------------------------------------------------------------
    this.startStreaming = function () {
        this.requestStream("Start");
    }

    //---------------------------------------------------------------------------------------------
    this.show = function () {
    
        var that = this;
        this.dialogue = $("#" + this.dialogId).dialog({

            title: that.camera,

            open: function (event, ui) {
                that.startStreaming();
            },

            close: function (event, ui) {
                $("#" + that.canvasId).remove();
                that.stopStreaming();
				//that.RemoveFromCamerasInLiveView(hotspotId);
				//that.StopStreamServer(hotspotId);
				//that.DestroyPlayer(hotspotId)
                if (that.player != null) {
                    that.player.destroy();
                }
                that.dialogue = null;				
            },

            resizable: false,
            width: that.width + 40,
            height: that.height + 70,
            modal: false,

            position: {
            using: function (pos) {
                $(this).css("top", that.top + 'px');
                $(this).css("left", that.left + 'px');
                }
            }
        }) 
    }
}