var maker = require("./maker").createMaker( "~" );

maker.loadTemplateDir( "D:/Projects/maker/templates", function( templates ) {
	console.log( templates );
});