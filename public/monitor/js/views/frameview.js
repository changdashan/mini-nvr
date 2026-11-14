define([
  'jquery',
  'underscore',
  'backbone',
  'enhsplitter'
], function ($, _, Backbone, enhsplitter) {


    var FrameView = Backbone.View.extend({

        el: $('body'),

        initialize: function(){
            this.render();
        },

        render: function () {
            $('#liveviewfederation').enhsplitter({ minSize: 50, vertical: false, position: '8%' });
            $('#bldgliveview').enhsplitter({ position: '30%' });
            $("#liveviewfederation").width = $(window).width();
            $("#liveviewfederation").height = $(window).height();
        }
    })

    return FrameView;

});