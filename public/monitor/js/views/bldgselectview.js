define([
  'jquery',
  'underscore',
  'backbone',
], function ($, _, Backbone) {

    var BldgSelectView = Backbone.View.extend({

        el: $('#bldgselection'),

        //-----------------------------------------------------------------------------------------
        initialize: function(options) {
            this.liveView = options.liveView;
            this.render();
        },

        render: function(){
            var that = this;
            $('#bldgselection #btnCloseViews').on('click', function(){that.CloseAllLiveViews();});
            $('#bldgselection #btnResetServer').on('click', function(){that.ResetLiveViewServer();});
            $('#bldgselection #btnRotateLiveView').on('click', function(){that.RotateLiveView();});
            $('#bldgselection #videosize').on('click', function () { that.VideoSizeChanged(); });
            $('#bldgselection #btnSignOut').on('click', function () { that.SignOut(); });
        },

        //-----------------------------------------------------------------------------------------
        SignOut: function () {
            window.location = "Logon.aspx";
        },

        //-----------------------------------------------------------------------------------------
        VideoSizeChanged: function(){
            var size =$('#videosize:checked').val();
            this.liveView.m_Size = size;
        },

        //-----------------------------------------------------------------------------------------
        CloseAllLiveViews: function() {
            this.liveView.CloseAllLiveViews();         
        },

	    //-----------------------------------------------------------------------------------------
	    ResetLiveViewServer: function(bldgnumber) {
            this.liveView.ResetLiveViewServer();
	    },

	    //-----------------------------------------------------------------------------------------
	    RotateLiveView: function() {
            this.liveView.RotateLiveView();
	    },
    })

    return BldgSelectView;

});