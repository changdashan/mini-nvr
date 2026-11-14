define([
    'jquery',
    'underscore',
    'backbone',
    './floorplanview',
    'fancytree',
    'libs/jquery-contextmenu/jquery.contextmenu',

], function ($, _, Backbone, FloorPlanView) {

    var UserSiteView = Backbone.View.extend({

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
        showLiveViewOnFloorplan: function (floorplanNode) {
            this.liveView.ShowLiveViewOnFloorplan(floorplanNode);
        },

        //-----------------------------------------------------------------------------------------
        showLiveViewOfCamera: function (cameraNode) {
            this.liveView.ShowLiveViewOfCamera(cameraNode);
        },

        //-----------------------------------------------------------------------------------------
        showFloorPlan: function (floorplanNode) {
            var floorplanId = floorplanNode.key;
            var imagename = floorplanNode.data.imagename;
            var floorplanView = new FloorPlanView({ floorplanid: floorplanId, imagename: imagename });
        },

        //-----------------------------------------------------------------------------------------
        render: function () {
            this.showBldgTree();
            $(document).click(function (e) { $("#contextMenu").hide(); });
            $(window).resize(function (e) { $("#contextMenu").hide(); });
        },

        //-----------------------------------------------------------------------------------------
        showBldgTree: function () {
            var that = this;


            var tree = $("#tree").fancytree({
                //source: {
                //    url: "GetBuildingCameras.aspx"
                //}

                extensions: ["filter"],
                filter: {
                    autoApply: true,   // Re-apply last filter if lazy data is loaded
                    autoExpand: true, // Expand all branches that contain matches while filtered
                    counter: true,     // Show a badge with number of matching child nodes near parent icons
                    fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
                    hideExpandedCounter: true,  // Hide counter badge if parent is expanded
                    hideExpanders: true,       // Hide expanders if all child nodes are hidden by filter
                    highlight: true,   // Highlight matches by wrapping inside <mark> tags
                    leavesOnly: false, // Match end nodes only
                    nodata: true,      // Display a 'no data' status node if result is empty
                    mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
                },

                selectMode: 1,

                source: [
                    { title: "My Video Sites", key: "MYSITES", lazy: true, nodetype: "MYSITES", icon: "kastle.jpg"},
                    /*
                    {
                        title: "RVM Regions", key: "REGION", folder: true, expanded: true, icon: "kastle.jpg",
                        children: [
                            { title: "CH Region", key: "CH", folder: true, lazy: true, icon: "illinois.jpg", nodetype: 'REGION' },
                            { title: "DA Region", key: "DA", folder: true, lazy: true, icon: "texas.jpg", nodetype: 'REGION' },
                            { title: "DC Region", key: "DC", folder: true, lazy: true, icon: "dc.jpg", nodetype: 'REGION' },
                            { title: "LA Region", key: "LA", folder: true, lazy: true, icon: "california.jpg", nodetype: 'REGION' },
                            { title: "NY Region", key: "NY", folder: true, lazy: true, icon: "newyork.jpg", nodetype: 'REGION' },
                            { title: "HO Region", key: "HO", folder: true, lazy: true, icon: "texas.jpg", nodetype: 'REGION' },
                            { title: "AU Region", key: "AU", folder: true, lazy: true, icon: "australia.png", nodetype: 'REGION' },
                        ]
                    },
                    */
                ],

                // Called when a lazy node is expanded for the first time:
                lazyLoad: function (event, data) {
                    var node = data.node;
                    var key = node.key;
                    var title = node.title;
                    if (key == 0) title = '';
                    // Load child nodes via ajax GET /getTreeData?mode=children&parent=1234
                    var nodetype = 'REGION';
                    if (node.data.nodetype != undefined)
                        nodetype = node.data.nodetype;

                    if (MyBldgNumber != undefined && MyBldgNumber != "" && node.data.nodetype == "MYSITES") {
                        key = MyBldgNumber;
                        nodetype = 'MYBUILDING';
                    }

                    data.result = {
                        url: "GetBldgVideoFloorPlans.aspx?nodekey=" + key + "&nodetype=" + nodetype,
                        data: { mode: "children", parent: node.key },
                        cache: false
                    };

                },

                click: function (event, data) {
                    var node = data.node;
                    if (node.isSelected() == true) { 
                        //alert(node.key + ':' + node.title + ':' + node.data.nodetype);
                    }

                    if (node.data.nodetype == 'building') {

                    }

                    if (node.data.nodetype == 'floorplan') {
                        //alert(node.data.nodetype);
                        //alert(node.title + ':' + node.key);
                        //that.showFloorPlan(node);
                        //that.showLiveViewOnFloorplan(node);
                    }

                    if (node.data.nodetype == 'hotspot') {
                        //alert("I am here");
                        //alert(node.title + ':' + node.key);
                        //var camera = node.title + ':' + node.key;
                        //window.frames[0].ShowLiveView(camera);
                        //that.showLiveViewOfCamera(node);
                    }
                },

                dblclick: function (event, data) {

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

                    if (node.data.nodetype == 'floorplan') {
                        //alert(node.data.nodetype);
                        //alert(node.title + ':' + node.key);
                        that.showFloorPlan(node);
                        that.showLiveViewOnFloorplan(node);
                    }

                    if (node.data.nodetype == 'hotspot') {
                        //alert(node.title + ':' + node.key);
                        var camera = node.title + ':' + node.key;
                        //window.frames[0].ShowLiveView(camera);
                        that.showLiveViewOfCamera(node);
                    }

                },

                select: function (event, data) {
                    //alert('select');
                    //var node = data.node;
                    //alert(node.key + ':' + node.title + ':' + node.data.nodetype);

                    data.node.setExpanded(true);
                },

                beforeSelect: function (event, data) {
                    // A node is about to be selected: prevent this for folders:
                    //alert('select');
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
                                {
                                    label: 'Restart Live555', icon: 'building.jpg', action: function () {
                                        //alert('Restart Live555 clicked on ' + bldgnumber) ;
                                        that.RestartLive555(bldgnumber);
                                    }
                                },
                                null, // null can be used to add a separator to the menu items 
                                { label: 'Testing', icon: 'icons/receipt-text.png', action: function () { alert('Testing clicked') } },
                            ]
                        });
                        */
                    }
                },

                expand: function (event, data) {
                    var node = data.node;
                    if (node.data.nodetype == 'floorplan') {
                        //alert(node.data.nodetype);
                        //alert(node.title + ':' + node.key);
                        that.showFloorPlan(node);
                    }
                    
                    if (node.data.nodetype == "MYSITES" || node.data.nodetype == "building") {
                        for (var i = 0; i < node.children.length; i++) {
                            //node.children[i].setSelected(true);
                            //node.children[i].setExpanded(true);
                        }
                    }
                    
                },

                init: function (event, data) {
                    var activeJumpNode = data.tree.getActiveNode();
                    if (activeJumpNode) {
                        var treeObj = $("div[id^=msctree]").fancytree("getTree");

                        var jumpToNode = treeObj.findFirst(function (node) {
                            return node === activeJumpNode;
                        });
                        jumpToNode.setActive();
                        jumpToNode.setFocus();
                        $(treeObj.$container).focus();
                    }
                }

            });

            var tree = $.ui.fancytree.getTree("#tree");
            tree.visit(function (node) {
                node.setExpanded(true);
                //node.setSelected(true);
            });

        },      //end of showBldgTree

        //-----------------------------------------------------------------------------------------
        RestartLive555: function (bldgnumber) {
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

        //-----------------------------------------------------------------------------------------
        qs: function (search_for) {
            var query = window.location.search.substring(1);
            var parms = query.split('&');
            for (var i = 0; i < parms.length; i++) {
                var pos = parms[i].indexOf('=');
                if (pos > 0 && search_for == parms[i].substring(0, pos)) {
                    return parms[i].substring(pos + 1);;
                }
            }
            return null;
        },

    })

    return UserSiteView;

});