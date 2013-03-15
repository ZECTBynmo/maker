//////////////////////////////////////////////////////////////////////////
// gyp-builder - Server Side
//////////////////////////////////////////////////////////////////////////
//
// Main module for gyp-builder
//
/* ----------------------------------------------------------------------
                                                    Object Structures
-------------------------------------------------------------------------

	
*/
//////////////////////////////////////////////////////////////////////////
// Node.js Exports
exports.createMaker = function( separationString ) { return new Maker(separationString); }

//////////////////////////////////////////////////////////////////////////
// Namespace (lol)
var DEBUG = true;

var log = function( text, isImportant ) { 
	if(DEBUG && isImportant) {
		console.log("\n******************************************")
		console.log("* " + text)
		console.log("******************************************\n")
	} else if(DEBUG) {
		console.log(text); 
	}
};

var wrench = require("wrench"),
	basename = require("path").basename,
	fs = require("fs");

var templateFileExtension = ".tpl";


//////////////////////////////////////////////////////////////////////////
// Constructor
function Maker( separationString ) {
	this.separationString = separationString || "~~";
	this.templates = require("./templates/templates");
} // end Maker()


//////////////////////////////////////////////////////////////////////////
// Returns a template object loaded from a file
Maker.prototype.template = function( templateString, contents ) {
	var templateObj = parseTemplate( templateString, this.separationString );

	for( var property in contents ) {
		if( contents.hasOwnProperty(property) ) {

			templateObj[property] = contents[property] || {};
		}
	}

	return templateObj;
} // end template()


//////////////////////////////////////////////////////////////////////////
// Loads all templates inside of a given directory  
Maker.prototype.loadTemplateDir = function( templateDir, callback ) {
	var templates = {};

	// Walk the folder tree recursively
	wrench.readdirRecursive( templateDir, function(error, files) {
		if( files == null ) 
			return callback( templates );

		for( var iFile=0; iFile<files.length; ++iFile ) {
			if( files[iFile].indexOf(".tpl") == -1 )
				continue;

			var path = templateDir + "/" + files[iFile],
				file = fs.readFileSync( path, "utf8" );

			var templateName = basename( path );

			// Trim off the extension
			templateName = templateName.substring( 0, templateName.length - templateFileExtension.length );

			templates[templateName] = file;
		}
	});
} // end loadTemplateDir()


//////////////////////////////////////////////////////////////////////////
// Parses a template string and returns an object of its contents
function parseTemplate( templateString, separationString ) {
	var iPosition = 0,
		matches = [],
		templateObj = {};

	iPosition = templateString.indexOf( separationString, iPosition );

	while( iPosition > 0 ) {
		matches.push( iPosition + separationString.length );

		iPosition = templateString.indexOf( separationString, iPosition+1 );
	}

	if( matches.length % 2 != 0 ) {
		log( "Error while parsing template: Mismatched separation string" );
	}

	for( var iItem = 0; iItem < matches.length; iItem += 2 ) {
		var strItem = templateString.substring( matches[iItem] + separationString.length, matches[iItem+1] );
		
		templateObj[strItem] = {};
	}

	return templateObj;
} // end parseTemplate()