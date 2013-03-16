maker is a general purpose text file templating engine. Use it to create text files programmatically.

Installation
```
npm install maker
```

maker scans a directory for a collection of templates, and allows you to select and fill out those templates as needed. 

Here's an example template, lets say we save it as 'myTemplate.tpl'
```JavaScript
//////////////////////////////////////////////////////////////////////////
// ~~comment~~
function ~~className~~( ~~arguments~~ ) {
	~~contents~~
} // end ~~className~~()
```
The template is a copy of the code you're trying to output with the variables and custom names replaced with template strings. The default separation string is ~~, but it can be changed to anything by using the optional argument to the maker constructor.

Here's a basic usage example
```JavaScript
var maker = require("maker").createMaker();

maker.loadTemplateDir( "./templates", function( templates ) {
	templates["myTemplate"].comment = "comment stuff";
	templates["myTemplate"].className = "SomeClass";
	templates["myTemplate"].arguments = "";
	templates["myTemplate"].contents = "console.log('test');";

	templates["myOtherTemplate"].someThing = "someOtherThing";

	// Create an array of templates in the order that 
	// we want them to appear in the file
	fileTemplates = [];
	fileTemplates.push( templates["myTemplate"] );
	fileTemplates.push( templates["myOtherTemplate"] );

	// Write the file
	maker.makeFile( "./testOutput.js", fileTemplates );
}
```