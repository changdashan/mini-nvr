define([
  'jquery',
  'underscore',
  'backbone',
], function ($, _, Backbone) {

    var FloorPlanView = Backbone.View.extend({

        floorplanid: null,
        mapfile: null,

        el: $('#liveview'),

        //-----------------------------------------------------------------------------------------
        initialize: function (options) {
            this.floorplanid = options.floorplanid;
            this.mapfile = options.imagename;

            var path = "../js-floorplan/kinetic-v4.5.4.min.js";
            LoadJSFile(path);

            LoadJSFile("../js-floorplan/LocationMapping.js");

            this.render();
        },

        //-----------------------------------------------------------------------------------------
        render: function () {

             var floorp = FloorPlan.GetFloorPlan(
                false,
                "https://www.mykastle.com/Floorplans/" + this.mapfile, 
                "https://www.mykastle.com/Floorplans/Icons",
                "https://www.mykastle.com/KastleDirect/Images/FloorPlan/",
                "/jquery/",
                900,
                "container"
            );

            floorp.hotspots = new Array();
            
            var hotspots = this.loadHotspots();

            hotspots.forEach(function(hs){
                new hotspot(
                    hs.HotspotId,
                    hs.ID,
                    hs.X,
                    hs.Y,
                    0,
                    hs.Title,
                    hs.Type,
                    hs.NormalImage,
                    hs.ActiveImage,
                    hs.Description,
                    hs.DegreeRotate
                )
            });

            window.setTimeout("objFP.loadFloorPlan();", 2000);

        },

        //-----------------------------------------------------------------------------------------
        loadHotspots: function () {
            var hotspots;
            
            var url = "GetFloorplanHotspots.aspx?mapid=" + this.floorplanid;
            $.ajax({
                url: url,
                dataType: 'json',
                type: 'get',
                async: false,
                processData: true,
                success: function (data) {
                    hotspots = data;
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    alert(errorThrown);
                }
            });

            return hotspots;
        },
    })

    return FloorPlanView;

});