var fs = require('fs'),
	basename = require('path').basename;

var JSTemplateFiles = [
	"./JS/functionTemplate.tpl",
];

var JSTemplates = {};

for( var iFile=0; iFile < JSTemplateFiles.length; ++iFile ) {
	var path = JSTemplateFiles[iFile],
		file = fs.readFileSync( JSTemplateFiles[iFile], "utf8" );

	var templateName = basename( path );

	// Trim off the extension
	templateName = templateName.substring( 0, templateName.length - 4 );

	JSTemplates[templateName] = file;
}

exports.JS = JSTemplates;