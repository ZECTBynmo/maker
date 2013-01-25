var headingTemplate = function( className ) {
	return "//////////////////////////////////////////////////////////////////////////
// 
//////////////////////////////////////////////////////////////////////////
//
// Main module for gyp-builder
//
/* ----------------------------------------------------------------------
                                                    Object Structures
-------------------------------------------------------------------------

	
*/
//////////////////////////////////////////////////////////////////////////
// Node.js Exports";
} 

var function = function( className, functionName, functionBody ) {
	return "//////////////////////////////////////////////////////////////////////////
// 
" + className + ".prototype." + functionName + "() {

} // end ()";
}

var functionTemplate = 
"//////////////////////////////////////////////////////////////////////////
// ~comment~
~className~.prototype.~functionName~() {
	~functionBody~
} // end ~functionName~()";

