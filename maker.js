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


//////////////////////////////////////////////////////////////////////////
// Constructor
function Maker( separationString ) {
	this.separationString = separationString || "~";
	this.templates = require("./templates/templates");

} // end Maker()


//////////////////////////////////////////////////////////////////////////
// 
Maker.prototype.() {

} // end ()


//////////////////////////////////////////////////////////////////////////
// Parses a template string and returns an object of its contents
function parseTemplateString( functionTemplate, separationString ) {
	var iPosition = 0,
		matches = [],
		templateObj = {};

	iPosition = functionTemplate.indexOf( separationString, iPosition );

	while( iPosition > 0 ) {
		matches.push( iPosition + separationString.length );

		iPosition = functionTemplate.indexOf( separationString, iPosition );
	}

	if( matches % 2 != 0 ) {
		log( "Error while parsing template: Mismatched separation string" );
	}

	for( var iItem = 0; iItem < matches.length; iItem += 2 ) {
		var strItem = functionTemplate.substring( matches[iItem] + separationString.length, matches[iItem+1] );
		
		templateObj[strItem] = {};
	}

	return templateObj;
} // end parseTemplateString()
