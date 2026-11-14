// Require.js allows us to configure shortcut alias
// Their usage will become more apparent futher along in the tutorial.
require.config({
    paths: {
        //jsmpg: 'libs/jsmpg/jsmpg',
        jsmpg: 'libs/jsmpg/jsmpeg.min',
        jquery: 'libs/jquery/jquery-3.7.1.min',
        jqueryui: 'libs/jquery/jquery-ui-1.13.2.min',
        underscore: 'libs/underscore/underscore-min',
        backbone: 'libs/backbone/backbone',
        enhsplitter: 'libs/enhsplitter/js/jquery.enhsplitter',
        fancytree: 'libs/fancytree/jquery.fancytree-all.min',
        templates: 'templates',
        floorplan: '../js-floorplan/KastleFP',
        locationmapping: '../js-floorplan/LocationMapping',
        jqueryuitouchpunch: 'libs/jquery/jquery.ui.touch-punch.min',
    },


    shim: {

        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        jqueryui: {
            deps: ['jquery'],
            exports: '$',
        }, 
        
        enhsplitter:{
            deps: ['jquery'],
            exports: '$',
        },
          
        fancytree: {
            deps: ['jquery','jqueryui']
        },
        
        jsmpg: {
            exports: 'jsmpg'
        }, 

        jqueryuitouchpunch: {
            deps: ['jquery', 'jqueryui']
        },           
    },

    baseUrl: 'js',
    

});

require([
  // Load our app module and pass it to our definition function
  'app',

], function(App){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  App.initialize();
});
