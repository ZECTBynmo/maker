//////////////////////////////////////////////////////////////////////////
// maker
//////////////////////////////////////////////////////////////////////////
//
// Main module
//
/* ----------------------------------------------------------------------
                                                    Object Structures
-------------------------------------------------------------------------

	
*/
//////////////////////////////////////////////////////////////////////////
// Node.js Exports
exports.createMaker = function( separationString, defaultPropertyValue ) { return new Maker(separationString, defaultPropertyValue); }

//////////////////////////////////////////////////////////////////////////
// Namespace (lol)
var DEBUG = true;

var log = function( text, isImportant ) { 
	if(DEBUG && isImportant) {
		console.log("\n******************************************");
		console.log("* " + text);
		console.log("******************************************\n");
	} else if(DEBUG) {
		console.log(text); 
	}
};

var pathModule = require("path"),
	basename = require("path").basename,
	traverse = require("traverse"),
	wrench = require("wrench"),
	clone = require("clone"),
	async = require("async"),
	fs = require("fs");

var templateFileExtension = ".tpl";


//////////////////////////////////////////////////////////////////////////
// Constructor
function Maker( separationString, defaultPropertyValue ) {
	this.separationString = separationString || "~~";
	this.templates = {},
	this.defaultPropertyValue = defaultPropertyValue;
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
// Returns an array of the template params within a template string
Maker.prototype.getTemplateParams = function( template, contents ) {
	var templateObj = {};

	if( typeof(template) == "string" ) {
		templateObj = parseTemplate( template, this.separationString );
	} else if( typeof(template) == "object" ) {
		templateObj = template;
	}

	var params = [];

	for( var property in templateObj ) {
		if( templateObj.hasOwnProperty(property) && property != "__fullTemplateString__" && property != "__templateMatches__" ) {
			params.push( property );
		}
	}

	return params;
} // end getTemplateParams()


//////////////////////////////////////////////////////////////////////////
// Retrurns a template object created by processing a file on disk
Maker.prototype.makeTemplate = function( filePath, templateParams ) {
	try {
		var file = fs.readFileSync( filePath, "utf8" );
	} catch( err ) {
		console.log( err );
		return {};
	}

	// Replace all instances of given strings with the given template 
	// parameter string within the file
	for( var iParam in templateParams ) {
		if( templateParams.hasOwnProperty(iParam) ) {
			var templateParamString = this.separationString + templateParams[iParam] + this.separationString;
			file = file.replace( new RegExp(iParam, "g"), templateParamString );
		}
	}

	var template = parseTemplate( file, this.separationString );

	this.templates[filePath] = template

	return clone( template );
} // end makeTemplate()


//////////////////////////////////////////////////////////////////////////
// Returns a template
Maker.prototype.getTemplate = function( templateName ) {
	return clone( this.templates[templateName] );
} // end getTemplate()


//////////////////////////////////////////////////////////////////////////
// Returns a template filled with the contents given
Maker.prototype.fillTemplate = function( template, contents ) {
	var templateObj = {};

	if( typeof(template) === "string" )
		templateObj = clone( this.templates[template] );
	else
		templateObj = template;

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
	log( "Making file " + path );

	// If this is a folder, just return
	if( pathModule.extname(path) == "" )
		return;

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
	    }

	    if( callback != undefined ) 
	    	callback( err );
	}); 
} // end makeFile()


//////////////////////////////////////////////////////////////////////////
// Renders a template recursively back into a string
Maker.prototype.renderTemplateToString = function( template ) {
	var replaceAtIndex = function( string, start, end, replaceString ) {
      return string.substring(0, start) + replaceString + string.substring(end);
	}

	if( typeof(template) === "string" )
		template = this.templates[template];

	// Start with the original template string
	var renderedTemplate = template.__fullTemplateString__,
		matches = template.__templateMatches__;

	for( var iMatch=matches.length-1; iMatch>0; iMatch-= 2 ) {

		var thisTemplateItem = renderedTemplate.substring( matches[iMatch-1] + this.separationString.length, matches[iMatch] );
		
		var newText = "";

		if( typeof(template[thisTemplateItem]) == "function" )
			newText = template[thisTemplateItem]();
		else
			newText = template[thisTemplateItem];

		renderedTemplate = replaceAtIndex( renderedTemplate, matches[iMatch-1], matches[iMatch]+this.separationString.length, newText );
	}	

	return renderedTemplate;
} // end renderTemplate()


//////////////////////////////////////////////////////////////////////////
// Loads all templates inside of a given directory  
Maker.prototype.loadTemplateDir = function( templateDir, callback ) {
	var _this = this; 
	var templates = {};

	var files = wrench.readdirSyncRecursive( templateDir );

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

	log( "Templates loaded from directory " + templateDir );

	_this.templates = templates;

	callback( templates );

} // end loadTemplateDir()


//////////////////////////////////////////////////////////////////////////
// Create templates from all files within a directory, and maps their
// filled out versions to a new location  
Maker.prototype.makeTemplatesFromDir = function( source, dest, replacementMap, pathReplacementMap, extensions, contents, callback ) {
	log( "Making directory " + source + " into templates and outputting to " + dest, true );

	// Make the pathReplacementMap, extensions, and contents arguments optional
	if( arguments.length == 4 ) {
		callback = extensions;
		pathReplacementMap = {};
		extensions = [];
		contents = {};
	} else if( arguments.length == 5 ) {
		callback = contents;
		contents = {};
		extensions = [];
	} else if( arguments.length == 6 ) {
		callback = contents;
		contents = {};
	}

	if( extensions.length > 0 ) {
		log( "Only templating files with extensions: " + extensions );
	} else {
		log( "Not filtering for extensions" );
		log( arguments );
	}

	var _this = this,
		templates = {},
		numTemplates = 0,
		finishedReading = false,
		finishedTemplating = false;

	var files = wrench.readdirSyncRecursive( source );

	// Walk the folder tree recursively\
	if( files != undefined )
		numTemplates += files.length;

	log( numTemplates + " files inspected within directory " + source );
	_this.templates = templates;

	finishedReading = true;

	function iteratorFn( file, finishedCB ) {
		// Make sure this file has a file extension we care about
		//
		// NOTE: extension filtering is optional, so if extensions is an
		// empty array, any file extension will be let through
		var hasValidExtension = extensions.length > 0 ? false : true;
		for( var iExtension = 0; iExtension < extensions.length; ++iExtension ) {
			if( pathModule.extname(file) == extensions[iExtension] )
				hasValidExtension = true;
		}

		// Give up on this round if this file has an invalid extension
		if( !hasValidExtension )
			return finishedCB();

		var path = source + "/" + file;

		var templateObj = _this.makeTemplate( path, replacementMap );

		// Copy over the parameters we're trying to fill in
		for( var property in contents ) {
			if( contents.hasOwnProperty(property) ) {
				templateObj[property] = contents[property] || undefined;
			}
		}

		// Use the path replacement map to modify output locations
		var outputPath = dest + file;
		for( var iItem in pathReplacementMap ) {
			if( pathReplacementMap.hasOwnProperty(iItem) ) {
				outputPath = outputPath.replace( new RegExp(iItem, "g"), pathReplacementMap[iItem] );
			}
		}

		_this.makeFile( outputPath, [templateObj], finishedCB );
	}

	function asyncCallback( error, results ) {
		finishedTemplating = true;

		// We have a race condition between reading and templating,
		// so we want to make sure both are finished before calling callback()	
		callback();
	}

	async.forEachSeries( files, iteratorFn, asyncCallback );

} // end makeTemplatesFromDir()


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

	// Pull out the name of each template parameter
	for( var iItem = 0; iItem < matches.length; iItem += 2 ) {
		var strItem = templateString.substring( matches[iItem] + separationString.length, matches[iItem+1] );
		
		// Fill out our object with whatever our default value is
		// We'll fill this template object out with contents later
		templateObj[strItem] = this.defaultPropertyValue;
	}

	// Attach the original template string onto the parsed template object, so that
	// we can reconstruct it later
	templateObj.__fullTemplateString__= templateString;
	templateObj.__templateMatches__ = matches;

	return templateObj;
} // end parseTemplate()
