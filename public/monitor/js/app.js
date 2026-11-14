// Filename: app.js
define([
    'jquery', 
    'underscore',
    'backbone',
    'jqueryui',
    'floorplan_router'
], function ($, _, Backbone, $, Router) {

    var initialize = function(){
        // Pass in our Router module and call it's initialize function
        Router.initialize();
    };

    return { 
        initialize: initialize
    };
});