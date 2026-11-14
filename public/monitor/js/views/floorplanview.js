define([
  'jquery',
  'underscore',
  'backbone',
], function ($, _, Backbone) {

    var FloorPlanView = Backbone.View.extend({

        el: $('#liveview'),

        floorplanid: null,
        mapfile: null,
        kastletreeviewurl: null,
        mykauth: null,

        //-----------------------------------------------------------------------------------------
        initialize: function (options) {
            this.GetAppConfig();
            this.floorplanid = options.floorplanid;
            this.mapfile = options.imagename;
            this.render();
        },

        //-----------------------------------------------------------------------------------------
        render: function () {
            //$('#fpframe').attr('src', 'https://fc-oc.kastle.com/kastletree/floorplanview.php?mapid=' + this.floorplanid);
            //$('#fpframe').attr('src', 'http://localhost/kastletree/floorplanview.php?mapid=' + this.floorplanid);
            var kastletreeurl = this.kastletreeviewurl + '?mapid=' + this.floorplanid;
            if (this.mykauth != null && this.mykauth != "")
                kastletreeurl += '&mykastleauth=' + this.mykauth
            $('#fpframe').attr('src', kastletreeurl);
        },

        //-----------------------------------------------------------------------------------------
        GetAppConfig: function () {
            var that = this;
            $.ajax({
                type: "GET",
                url: "./GetAppConfig.aspx",
                async: false,
                success: function (data) {
                    var config = JSON.parse(data);
                    that.kastletreeviewurl = config.kastletreeviewurl;
                    if (config.mykauth != undefined && config.mykauth != null)
                        that.mykauth = config.mykauth;
                }
            })
        },

    })

    return FloorPlanView;

});