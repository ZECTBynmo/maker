var maker = require("./maker").createMaker( "~" );

maker.loadTemplateDir( "./templates", function( templates ) {
	var templateObj = maker.template( templates["functionTemplate"] );
	console.log( templates );
});