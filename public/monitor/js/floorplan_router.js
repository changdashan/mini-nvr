// Filename: router.js
define([
'jquery',
'underscore',
'backbone',
'views/frameview',
//'views/bldgvideofloorplantreeview',
'views/UserSiteView',
'views/videoliveview',
'views/bldgselectView',
], function ($, _, Backbone, FrameView, UserSiteView, VideoLiveView, BldgSelectView) {

    //---------------------------------------------------------------------------------------------
    var AppRouter = Backbone.Router.extend({

        routes: {
            '': 'index'
        },

        index: function () {
            this.frameView = new FrameView();
            this.frameView.render();
            this.videoLiveView = new VideoLiveView();
            this.bldgSelectView = new BldgSelectView({ liveView: this.videoLiveView });
            this.userSiteView = new UserSiteView({ liveView: this.videoLiveView });
            //this.bldgTreeView = new BldgTreeView({ liveView: this.videoLiveView });
        }

    });

    //---------------------------------------------------------------------------------------------
    var initialize = function () {
        var app_router = new AppRouter;
        Backbone.history.start();
    };

    return {
        initialize: initialize
    };
});