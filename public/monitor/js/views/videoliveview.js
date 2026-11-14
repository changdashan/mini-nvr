/*
    File Name: videoliveview.js
    Description: A live view dialogue management module.
    Developed by: Dashan Chang
    Date: 2017-2023
*/ 
define([
  'jquery',
  'underscore',
  'backbone',
  'jsmpg',
  'jqueryuitouchpunch'
], function ($, _, Backbone, jsmpg, jqueryuitouchpunch) {

    var VideoLiveView = Backbone.View.extend({

        el: $('#liveview'),

        //-----------------------------------------------------------------------------------------
        initialize: function(){
            this.render();
        },

        //-----------------------------------------------------------------------------------------
        render: function () {
            /*
            var that = this;
            $('#liveview #btnCloseViews').on('click', function(){that.CloseBuildingLiveViews();});
            $('#liveview #btnResetServer').on('click', function(){that.ResetLiveViewServer();}); 
            */
            this.GetAppConfig();
        },

	    m_WebSocketClients: {},
        m_JSPlayers:{},
        m_LiveViewDialogs:{},
	    m_Cameras: null,
	    m_CamerasInLiveView: null,
        m_CamCountOfBldg: 0,

        //web config parameters
        m_WebSocketProtocol: null,
        m_StreamServer: null,
        m_StreamPort: 8082,
        m_Duration: 30,
        m_Width: 320,
        m_Height: 240,
        m_Size: '320x240',

        m_CheckVideoLiveUrl: "CheckVideoLiveUrl.aspx",

        //-----------------------------------------------------------------------------------------
        StartKvLiveView: function(canvasId, cameraGuid, deviceGuid, cameraName) {
            var Url = this.m_CheckVideoLiveUrl + "?type=liveviewurl&deviceguid=" + deviceGuid + "&cameraguid=" + cameraGuid + "&CameraName=" + cameraName;

            $.ajax({
                dataType: 'text',
                type: "GET",
                url: Url,
                async: true,
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    if (data == undefined || data == null || data == "")
                        return;
                    var live_url = "";
                    var xmlDoc = $.parseXML(data);
                    $result = $(xmlDoc).find('result');
                    live_url = $result.text();
                    //var live_url = "https://videocentral.mykastle.com/VideoPlayerEx.php?auth=3dd9bc87-1ca9-11ec-a9f7-125cb6425e3d&cam=00210F00B65D_1&mode=live";
                    if (live_url.indexOf("https:") == 0) {
                        var canvas = document.getElementById(canvasId);
                        canvas.src = live_url + '&allowRelay=1';
                    } else {
                        $("#" + canvasId).append('body').contents().find('body').append("<b>Live URL could not be discovered by device guid or by camera name.<br/>Please request RVM team to correct either of them.</b>");
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    //alert(xhr.status);
                    //alert(thrownError);
                    alert("An error occured in acquiring KastleVideo live url.");
                }
            });
        },

	    //-----------------------------------------------------------------------------------------
	    StartStreamServer: function (HotspotId, CanvasID, divid) {

            var that = this;

            var action = 'Start';
            var StreamPort = this.m_StreamPort;
            var Duration = this.m_Duration;
            var Width = this.m_Width;
            var Height = this.m_Height;
            var Url = "./StreamSignalling.aspx?cameraid=" + HotspotId + "&port=" + StreamPort + "&action=" + action + "&duration=" + Duration + "&width=" + Width + "&height=" + Height;

	        $.ajax({
                dataType: 'json',
	            type: "GET",
	            url: Url,
	            async: true,
	            success: function (data) {
                    if (data.error != "")
                    {
	                    alert(data.error);
                        return;
                    }

                    var secret = data.secret;
                    var camera = data.camera;
	                setTimeout(function () { that.StartLiveViewer(CanvasID, divid, camera, secret, HotspotId); }, 20);
                    $("#" + divid).dialog('option', 'title', camera);
	            }
	        })
	    },


	    //-----------------------------------------------------------------------------------------
	    StopStreamServer: function (HotspotId) {
            var that = this;

            var action = 'Stop';
            var StreamPort = this.m_StreamPort;
            var Duration = this.m_Duration;
            var Width = this.m_Width;
            var Height = this.m_Height;
            var Url = "./StreamSignalling.aspx?cameraid=" + HotspotId + "&port=" + StreamPort + "&action=" + action + "&duration=" + Duration + "&width=" + Width + "&height=" + Height;

	        $.ajax({
                dataType: 'json',
	            type: "GET",
	            url: Url,
	            async: true,
	            success: function (data) {

	            }
	        })
	    },


	    //-----------------------------------------------------------------------------------------
	    StartLiveViewer: function (canvasID, divid, cameraName, secret, hotspotId) {
			var that = this;
            
            var WebSocketProtocol = this.m_WebSocketProtocol;
	        var StreamServer = this.m_StreamServer; 
            var StreamPort = this.m_StreamPort;

            cameraName = cameraName.replace(/ /g, '_').toUpperCase();

            var url = WebSocketProtocol + '://' + StreamServer + ':' + StreamPort + '/' + secret + '/' + cameraName;          

            var canvas = document.getElementById(canvasID);
            var player = new JSMpeg.Player(url, { audio: false, canvas: canvas, disableGl: true, camera:cameraName });
            player.IntervalID = null;
            player.endTimer = function () {
                if (player.IntervalID != null) {
                    clearInterval(player.IntervalID);
                }
            };

            player.source.onClose = function()
            {
                $("#" + divid).dialog("close");

                if (this.IntervalID != null) {
                    clearInterval(this.IntervalID);
                }
            };

            player.demuxerLastCheckTime = 0;
            player.demuxerTimeNoChangeCnt = 0
            player.timer = (function (player) {

                var intervalID = setInterval((function fn(player) {
                    if (player != undefined && player != null) {
                        if (player.demuxer != undefined && player.demuxer != null) {
                            var cam = player.options.camera;
                            //console.log(cam + ":" + player.demuxer.currentTime);
                            if (player.demuxer.currentTime > player.demuxerLastCheckTime) {
                                player.demuxerLastCheckTime = player.demuxer.currentTime;
                            }
                            else {
                                player.demuxerTimeNoChangeCnt++;
                                //console.log("Demuxer time no change cnt: " + player.demuxerTimeNoChangeCnt);
                                if (player.demuxerTimeNoChangeCnt >= 6) {
                                    console.log("No live view stream for 60 seconds and stopped at: " + player.demuxer.currentTime);
                                    clearInterval(intervalID);

                                    var canvasId = player.options.canvas.id;
                                    var parentElem = $("#" + canvasId).parent();
                                    $("#" + canvasId).get(0).remove();
                                    var canvas = document.createElement("canvas");
                                    canvas.id = canvasId;
                                    canvas.width = 320;
                                    canvas.height = 240;

                                    parentElem.append(canvas);
                                    var ctx = canvas.getContext("2d");
                                    ctx.fillStyle = "rgb(192,192,192)";
                                    if (ctx != null) {
                                        ctx.font = "12px Arial";
                                        if (player.demuxer.currentTime == 0) {
                                            ctx.fillText("Live view not availabe for the camera.", 40, 60);
                                            ctx.fillText("Please check power, connection,", 40, 80);
                                            ctx.fillText("site comm loss, liveview configure, or", 40, 100);
                                            ctx.fillText("cam name matches its hotspot description.", 40, 120);
                                        }
                                        else {
                                            ctx.fillText("Live view streaming stopped", 70, 100);
                                        }
                                    }
                                    else {
                                        console.log("ctx is null");
                                    }
                                }
                            }
                        }
                    };
                    return fn;
                })(), 10000, player);

                player.IntervalID = intervalID;

            })(player);

            this.m_JSPlayers[hotspotId] = player;
	    },

	    //-----------------------------------------------------------------------------------------
	    ShowLiveView: function(CameraNode, Top, Left) {
            var that = this;

            var hotspotId = CameraNode.key;
            var cameraName = CameraNode.title;
            var cameraTech = "";
            if (CameraNode.data == undefined)
                cameraTech = CameraNode.CameraTech;
            else
                cameraTech = CameraNode.data.CameraTech;
 
	        if (Top == null) Top = 20;
	        if (Left == null) Left = 20;

	        var divid = 'liveview_div_' + hotspotId;

            if (this.m_Size == "640x480")
            {
                this.m_Width = 640;
                this.m_Height = 480;
            }
            else if (this.m_Size == "320x240")
            {
                this.m_Width = 320;
                this.m_Height = 240;
            }

            setTimeout(function () {
                var canvasID = "liveview_canvas_" + hotspotId;
                var newCanvas = "<div id='" + divid + "' title='" + cameraName + "'><canvas id='" + canvasID + "' width='" + that.m_Width + "' height='" + that.m_Height + "'></canvas></div>"
                if (cameraTech == 1)
                    newCanvas = "<div id='" + divid + "' title='" + cameraName + "'><iframe id='" + canvasID + "' width='" + that.m_Width + "' height='" + that.m_Height + "'></iframe></div>"

                $('#liveview').append(newCanvas);

                var liveViewDialog = $("#" + divid).dialog({

                    appendTo: '#liveview',

                    open: function (event, ui) {
                        if (cameraTech == 1) {
                            if (CameraNode.data == undefined) {
                                var deviceGuid = CameraNode.EntityId;
                                var cameraGuid = CameraNode.CameraGuid;
                            } else {
                                var deviceGuid = CameraNode.data.EntityId;
                                var cameraGuid = CameraNode.data.CameraGuid;
                            }
                            that.StartKvLiveView(canvasID, cameraGuid, deviceGuid, cameraName);
                        } else {
                            that.StartStreamServer(hotspotId, canvasID, divid);
                        }
                    },
                    close: function (event, ui) {
                        //alert("view dialog closed");
                        that.RemoveFromCamerasInLiveView(hotspotId);
                        if (cameraTech != 1)
                            that.StopStreamServer(hotspotId);
                        that.DestroyPlayer(hotspotId);
                        that.CloseLiveViewDialog(hotspotId);
                        $("#" + divid).dialog('destroy');
                        $("#" + divid).remove();

                    },
                    resizable: false,
                    width: that.m_Width + 30,
                    height: that.m_Height + 60,
                    modal: false
                    , position: {
                        using: function (pos) {
                            $(this).css("top", Top + 'px');
                            $(this).css("left", Left + 'px');
                        }
                    }
                });

                $("#" + divid).draggable();

                that.m_LiveViewDialogs[hotspotId] = liveViewDialog;

            }, 100);


	    },

	    //-----------------------------------------------------------------------------------------
	    ShowLiveViewOnBuilding: function(bldgnumber) {
            var that = this;
	        $.ajax({
	            type: "GET",
	            url: "./GetBuildingCameras.aspx?bldgnumber=" + bldgnumber,
	            async: true,
	            success: function (data) {
	                //alert(data);
	                var cameras = $.parseJSON(data)
                    that.m_CamCountOfBldg = cameras.length;
                    //that.m_CamerasInLiveView = cameras;
	                //that.m_Cameras = that.m_CamerasInLiveView.slice();
                    that.m_Cameras = cameras.slice();
	                that.OpenBldgLiveViews(0);
	            }
	        })
	    },

	    //-----------------------------------------------------------------------------------------
	    ShowLiveViewOnFloorplan: function(floorplanNode) {
            var that = this;
	        $.ajax({
                dataType: 'json',
	            type: "GET",
	            url: "GetBldgVideoFloorPlans.aspx?nodekey=" + floorplanNode.key + "&nodetype=" + floorplanNode.data.nodetype,
	            async: true,
	            success: function (data) {
	                //alert(data);
	                //that.m_Cameras = $.parseJSON(data)
                    that.m_Cameras = data;
	                that.OpenLiveViewOnFloorplan();
	            },
                error: function (jqXhr, textStatus, errorThrown) {
                    alert(errorThrown);
                }
	        })
	    },

        //-----------------------------------------------------------------------------------------
        ShowLiveViewOfCamera: function(cameraNode)
        {
            if (this.m_CamerasInLiveView == null) this.m_CamerasInLiveView = [];
            var index = this.m_CamerasInLiveView.length;

            this.m_CamerasInLiveView.push(cameraNode);
            var pos = this.GetPosition(index);
            var camera = cameraNode.title + ':' + cameraNode.key;
            cameraNode.CameraTech = cameraNode.data.CameraTech;
	        this.ShowLiveView(cameraNode, pos.top, pos.left);
        },

	    //-----------------------------------------------------------------------------------------
	    GetPosition: function(index, top, left) {
	        var rowIndex = Math.floor(index / 3);
	        var colIndex = index % 3;
	        top = 15 * (rowIndex + 1) + (rowIndex * (this.m_Height + 60));
	        left = 15 * (colIndex + 1) + (colIndex * (this.m_Width + 30));
	        return { top: top, left: left }
	    },

	    //-----------------------------------------------------------------------------------------
	    CloseLiveViewDialog: function(hotspotId) {

            var liveViewDialog = this.m_LiveViewDialogs[hotspotId];
            if (liveViewDialog != undefined && liveViewDialog != null) 
            {
                liveViewDialog.dialog("close");
                $(liveViewDialog.selector).remove();
                delete this.m_LiveViewDialogs[hotspotId];
            }
        },

	    //-----------------------------------------------------------------------------------------
	    DestroyPlayer: function(hotspotId) {
            var jsplayer = this.m_JSPlayers[hotspotId];
            if (jsplayer != undefined) 
            {
                jsplayer.endTimer();
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
	        if (cameraobj != undefined) 
            {
	            var camera = cameraobj.title + ":" + cameraobj.key;
                var hotspotId = cameraobj.key;
                this.CloseLiveViewDialog(hotspotId);
	            setTimeout(function () { that.CloseLiveView(); }, 1000);
	        }
	    },

        //-----------------------------------------------------------------------------------------
        RemoveFromCamerasInLiveView: function(hotspotId){
            var index = -1
            for(var i = 0; i< this.m_CamerasInLiveView.length; i++)
            {
                var cameraobj = this.m_CamerasInLiveView[i];
                if (cameraobj.key == hotspotId)
                {
                    index = i;
                    break;
                }
            }             
            
            if (index > -1)
            {
                this.m_CamerasInLiveView.splice(index, 1);
            }       
        },

	    //-----------------------------------------------------------------------------------------
	    OpenBldgLiveViews: function (i) {
            var that = this;
	        if (i == undefined || i == null) i = 0;
	        var cameraobj = this.m_Cameras.shift();
	        if (cameraobj != undefined) {
	            var pos = this.GetPosition(i);
	            var camera = cameraobj.title + ":" + cameraobj.key;
	            this.ShowLiveView(cameraobj, pos.top, pos.left);
                if (this.m_CamerasInLiveView == null) this.m_CamerasInLiveView = [];
                this.m_CamerasInLiveView.push(cameraobj);
	            i++;
                if (this.m_CamCountOfBldg <= 12 || (this.m_CamCountOfBldg > 12 && i <3) )
                {
	                setTimeout(function () { that.OpenBldgLiveViews(i); }, 1000);
                }
	        }
	    },

	    //-----------------------------------------------------------------------------------------
	    OpenLiveViewOnFloorplan: function (i) {
            var that = this;

	        if (i == undefined || i == null) i = 0;
	        var cameraobj = this.m_Cameras.shift();
	        if (cameraobj != undefined) {
	            var pos = this.GetPosition(i);
	            var camera = cameraobj.title + ":" + cameraobj.key;
	            this.ShowLiveView(cameraobj, pos.top, pos.left);
                if (this.m_CamerasInLiveView == null) this.m_CamerasInLiveView = [];
                this.m_CamerasInLiveView.push(cameraobj);
	            i++;
                if (this.m_CamCountOfBldg <= 12 || (this.m_CamCountOfBldg > 12 && i <3) )
                {
	                setTimeout(function () { that.OpenLiveViewOnFloorplan(i); }, 1000);
                }
	        }
	    },

        //-----------------------------------------------------------------------------------------
        GetAppConfig: function()
        {
            var that = this;
            $.ajax({
	            type: "GET",
	            url: "./GetAppConfig.aspx",
	            async: true,
	            success: function (data) {
                    var config = JSON.parse(data);
                    that.m_WebSocketProtocol = config.websocketprotocol;
                    that.m_StreamServer = config.streamserver;
                    that.m_StreamPort = config.streamport;
                    that.m_Duration = config.duration;
                    //if (config.CheckVideoLiveUrl == undefined || config.CheckVideoLiveUrl == null || config.CheckVideoLiveUrl == "") return;
                    //that.m_CheckVideoLiveUrl = config.CheckVideoLiveUrl;
	            }
	        })
        },

	    //-----------------------------------------------------------------------------------------
	    ResetLiveViewServer: function(bldgnumber) {
            //alert('ResetLiveViewServer called');
	        $.ajax({
	            type: "GET",
	            url: "./ResetLiveViewServer.aspx",
	            async: true,
	            success: function (data) {
	                //alert(data);
	            }
	        })
	    },

	    //-----------------------------------------------------------------------------------------
	    RotateLiveView: function() {
            //alert('ResetLiveViewServer called');
	        $.ajax({
	            type: "GET",
	            url: "./GetBuildingCameras.aspx",
	            async: true,
	            success: function (data) {
	                //alert(data);
	            }
	        })
	    },

    })

    return VideoLiveView;

});