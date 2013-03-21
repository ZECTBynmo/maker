//////////////////////////////////////////////////////////////////////////
// maker - Server Side
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
	pathModule = require("path"),
	fs = require("fs"),
	clone = require("clone"),
	traverse = require("traverse");

var templateFileExtension = ".tpl";


//////////////////////////////////////////////////////////////////////////
// Constructor
function Maker( separationString ) {
	this.separationString = separationString || "~~";
	this.templates = {};
} // end Maker()


//////////////////////////////////////////////////////////////////////////
// Returns a template object loaded from a file
Maker.prototype.template = function( templateString, contents ) {
	var templateObj = parseTemplate( templateString, this.separationString );

	for( var property in contents ) {
		if( contents.hasOwnProperty(property) ) {

			templateObj[property] = contents[property] || undefined;
		}
	}

	return templateObj;
} // end template()


//////////////////////////////////////////////////////////////////////////
// Returns a template
Maker.prototype.getTemplate = function( templateName ) {
	return clone( this.templates[templateName] );
} // end getTemplate()


//////////////////////////////////////////////////////////////////////////
// Returns a template filled with the contents given
Maker.prototype.fillTemplate = function( templateName, contents ) {
	var templateObj = clone( this.templates[templateName] );

	for( var property in contents ) {
		if( contents.hasOwnProperty(property) ) {

			templateObj[property] = contents[property] || undefined;
		}
	}

	return templateObj;
} // end fillTemplate()


//////////////////////////////////////////////////////////////////////////
// Creates a file on disk composed of the given templates
Maker.prototype.makeFile = function( path, templates, callback ) {
	// Convert any templates that are still objects into strings
	for( var iTemplate=0; iTemplate<templates.length; ++iTemplate ) {
		if( typeof(templates[iTemplate]) === "object" ) {
			templates[iTemplate] = this.renderTemplateToString( templates[iTemplate] );
		}
	}

	var fileContents = "";

	// Concatenate all template strings into one big string
	for( var iTemplate=0; iTemplate<templates.length; ++iTemplate ) {
		fileContents += templates[iTemplate];
	}

	var folderPath = pathModule.dirname( path );

	// Create the directory if it didn't exist already
	wrench.mkdirSyncRecursive( folderPath );

	// Write the file to disk
	fs.writeFile( path, fileContents, function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }

	    if( callback != undefined ) 
	    	callback( err );
	}); 
} // end makeFile()


//////////////////////////////////////////////////////////////////////////
// Renders a template and its contents back into a string
Maker.prototype.renderTemplateToString = function( template ) {
	if( typeof(template) === "string" )
		template = this.templates[template];

	// Start with the original template string
	var renderedTemplate = template.__fullTemplateString__,
		matches = template.__templateMatches__;

	for( var iItem in template ) {
		if( iItem == "__fullTemplateString__" || iItem == "__templateMatches__" )
			continue;

		//console.log("item " + iItem + " is of type " + typeof iItem + " with value " + template[iItem] );

		if( typeof template[iItem] == "undefined" || template[iItem] == "undefined" ) {
			template[iItem] = "";
			console.log( "Item '" + iItem + "' is undefined" );
		} else if( typeof template[iItem] === "object" ) {
			// Render this template recursively
			template[iItem] = this.renderTemplateToString( template[iItem] );
		} else if( typeof template[iItem] != "string" ) {
			console.log( "Item '" + iItem + "' is not a string" );
		} 

		var stringToReplace = this.separationString + iItem + this.separationString;
		renderedTemplate = renderedTemplate.replace( new RegExp(stringToReplace, "g"), template[iItem] );
	}

	return renderedTemplate;
} // end renderTemplate()


//////////////////////////////////////////////////////////////////////////
// Loads all templates inside of a given directory  
Maker.prototype.loadTemplateDir = function( templateDir, callback ) {
	var _this = this; 
	var templates = {};

	// Walk the folder tree recursively
	wrench.readdirRecursive( templateDir, function(error, files) {
		if( files == null ) {
			log( "Templates loaded from directory " + templateDir );
			_this.templates = templates;
			return callback( templates );
		}

		for( var iFile=0; iFile<files.length; ++iFile ) {
			if( files[iFile].indexOf(".tpl") == -1 )
				continue;

			var path = templateDir + "/" + files[iFile],
				file = fs.readFileSync( path, "utf8" );

			var templateName = basename( path );

			// Trim off the extension
			templateName = templateName.substring( 0, templateName.length - templateFileExtension.length );

			templates[templateName] = _this.template( file );
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
		matches.push( iPosition );

		var newPosition = templateString.indexOf( separationString, iPosition+separationString.length );

		iPosition = newPosition;
	}

	if( matches.length % 2 != 0 ) {
		log( "Error while parsing template: Mismatched separation string" );
	}

	for( var iItem = 0; iItem < matches.length; iItem += 2 ) {
		var strItem = templateString.substring( matches[iItem] + separationString.length, matches[iItem+1] );
		
		templateObj[strItem] = undefined;
	}

	// Attach the original template string onto the parsed template object, so that
	// we can reconstruct it later
	templateObj.__fullTemplateString__= templateString;
	templateObj.__templateMatches__ = matches;

	return templateObj;
} // end parseTemplate()