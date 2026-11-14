// Filename: router.js
define([
'jquery',
'underscore',
'backbone',
'views/frameview',
'views/bldgtreeview',
'views/videoliveview',
'views/bldgselectView',
], function ($, _, Backbone, FrameView, BldgTreeView, VideoLiveView, BldgSelectView) {

    //---------------------------------------------------------------------------------------------
    var StreamingSignal = Backbone.Model.extend({
        defaults: {
            cameraid: null,
            cameraname: null,
            action: null,
            width: 320,
            height: 240,
            duration: 30
        }

    });
});



