define([
  'jquery',
  'underscore',
  'backbone',
  'fancytree',
  'libs/jquery-contextmenu/jquery.contextmenu',
], function ($, _, Backbone) {

    var BldgTreeView = Backbone.View.extend({

        el: $('#bldgliveview'),

        //-----------------------------------------------------------------------------------------
        initialize: function (options) {
            this.liveView = options.liveView;
            this.render();
        },

        //-----------------------------------------------------------------------------------------
        showLiveViewOnBuilding: function (bldgnumber) {
            this.liveView.ShowLiveViewOnBuilding(bldgnumber);
        },

        //-----------------------------------------------------------------------------------------
        showLiveViewOfCamera: function (camera) {
            this.liveView.ShowLiveViewOfCamera(camera);
        },

        //-----------------------------------------------------------------------------------------
        render: function () {
            this.showBldgTree();
            $(document).click(function(e){ $("#contextMenu").hide();});
            $(window).resize(function(e){ $("#contextMenu").hide();});
        },

        //-----------------------------------------------------------------------------------------
        showBldgTree: function () {

            var that = this;

            $("#tree").fancytree({
                //source: {
                //    url: "GetBuildingCameras.aspx"
                //}

                selectMode: 1,

                source: [
                    //{ title: "Video Buildings", key: "0", lazy: true},
                    { title: "RVM Regions", key: "1", folder: true, expanded: true, icon: "kastle.jpg",
                        children: [
                            {title: "CH Region", key: "2", folder:true, lazy: true, icon: "illinois.jpg"},
                            {title: "DA Region", key: "3", folder:true, lazy: true, icon: "texas.jpg"},
                            {title: "DC Region", key: "4", folder:true, lazy: true, icon: "dc.jpg"},
                            {title: "LA Region", key: "5", folder:true, lazy: true, icon: "california.jpg"},
                            {title: "NY Region", key: "6", folder:true, lazy: true, icon: "newyork.jpg"},
                            {title: "HO Region", key: "7", folder:true, lazy: true, icon: "texas.jpg"},	
                            {title: "AU Region", key: "8", folder:true, lazy: true, icon: "australia.png"},							
                        ]
                    },

                ],

                // Called when a lazy node is expanded for the first time:
                lazyLoad: function (event, data) {
                    var node = data.node;
                    var key = node.key;
                    var title = node.title;
                    if (key == 0) title = '';
                    // Load child nodes via ajax GET /getTreeData?mode=children&parent=1234
                    data.result = {
                        url: "GetBuildingCameras.aspx?bldgnumber=" + title + "&region=" + node.key,
                        data: { mode: "children", parent: node.key },
                        cache: false
                    };

                },

                click: function (event, data) {
                    var node = data.node;
                    if (node.isSelected() == true)
                        alert(node.key + ':' + node.title + ':' + node.data.nodetype);

                    if (node.data.nodetype == 'building') {

                    }

                    if (node.data.nodetype == 'camera') {
                        //alert("I am here");
                        //alert(node.title + ':' + node.key);
                        var camera = node.title + ':' + node.key;
                        //window.frames[0].ShowLiveView(camera);
                        that.showLiveViewOfCamera(node);
                    }
                },

			    dblclick: function(event, data) {

			    },

                activate: function (event, data) {
                    var node = data.node;
                    //alert(node.key);
                    if (node.data.nodetype == 'building') {
                        //alert(node.title + ':' + node.key);
                        var bldgnumber = node.title;
                        //window.frames[0].ShowLiveViewOnBuilding(bldgnumber)
                        that.showLiveViewOnBuilding(bldgnumber);

                    }

                    if (node.data.nodetype == 'camera') {
                        //alert(node.title + ':' + node.key);
                        var camera = node.title + ':' + node.key;
                        //window.frames[0].ShowLiveView(camera);
                        //that.showLiveViewOfCamera(node);
                    }
                },

                select: function (event, data) {
                    alert('select');
                    //var node = data.node;
                    //alert(node.key + ':' + node.title + ':' + node.data.nodetype);

                },

                beforeSelect: function (event, data) {
                    // A node is about to be selected: prevent this for folders:
                    alert('select');
                    if (data.node.isFolder()) {
                        return false;
                    }
                },

                loadChildren: function (event, data) {
                    var iconimage = 'camera.png';
                    if (data.node.data == 'building')
                        iconimage = 'building.jpg'

                    var children = data.node.getChildren();

                    for (var i = 0; i < children.length; i++) {
                        if (!children[i].isFolder()) {
                            children[i].data.icon = iconimage;
                            children[i].renderTitle();
                        }
                    }
                },

                createNode: function (event, data) {
                    var node = data.node;
                    if (node.data.nodetype == 'building') {
                        var bldgnumber = node.title;
                        /*
                        $(node.span).contextPopup({
                            title: '',
                            items: [
                                {label:'Restart Live555', icon:'building.jpg', action:function() {
                                    //alert('Restart Live555 clicked on ' + bldgnumber) ;
                                    that.RestartLive555(bldgnumber);
                                }},
                                null, // null can be used to add a separator to the menu items
                                {label:'Testing', icon:'icons/receipt-text.png',    action:function() { alert('Testing clicked') } },
                                ]
                        });
                        */
                    }
                },

            });
        },      //end of showBldgTree

	    //-----------------------------------------------------------------------------------------
        RestartLive555: function(bldgnumber){
            //alert('RestartLive555 on ' + bldgnumber);
	        $.ajax({
	            type: "GET",
	            url: "./RestartLive555.aspx?bldgnumber=" + bldgnumber,
	            async: true,
	            success: function (data) {
	                //alert(data);
	            }
	        })
        },

    })

    return BldgTreeView;

});