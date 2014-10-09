/*
	Copyright (c) 2014, Zhaofeng Li
	All rights reserved.
	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:
	* Redistributions of source code must retain the above copyright notice, this
	list of conditions and the following disclaimer.
	* Redistributions in binary form must reproduce the above copyright notice,
	this list of conditions and the following disclaimer in the documentation
	and/or other materials provided with the distribution.
	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
	FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
	DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
	SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
	CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
	OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*
	This script is intended to be included on-wiki!
	
	This script depends on jQuery and MediaWiki environment.
	Please change the metadata and configuations below to suit your needs.
*/

/*global wgPageName, wDiff, mw */
/*jshint multistr: true */

// ==UserScript==
// @name        Reflinks
// @description Adds a toolbox link to the Reflinks tool
// @namespace   https://en.wikipedia.org/wiki/User:Zhaofeng_Li
// @include     *://en.wikipedia.org/*
// @version     4
// @grant       none
// ==/UserScript==

var rlServer = "https://tools.wmflabs.org/fengtools/reflinks";

function rlIsWatching() {
	// Let's use a little hack to determine whether the current page is watched or not
	if ( $( "#ca-unwatch" ).length !== 0 ) {
		return true;
	} else {
		return false;
	}
}

function rlSetUpForm( pagename ) {
	$( "#mw-content-text" ).prepend( "\
<div id='reflinks' style='border: 1px solid #ccc; border-radius: 2px; margin: 5px; padding: 0 10px 10px 10px;'>\
	<form id='reflinks-form' method='post' action='" + rlServer + "/result.php?page=" + encodeURIComponent( pagename ) + "'>\
		<h1>Reflinks</h1>\
		<h3>Options</h3>\
		<ul id='form-wiki-options' class='optionul'>\
			<li>\
				<input name='plainlink' id='checkbox-plainlink' type='checkbox'/>\
				<label for='checkbox-plainlink'>Use plain formatting instead of <code>{{cite web}}</code></label>\
			</li>\
			<li>\
				<input name='noremovetag' id='checkbox-noremovetag' type='checkbox'/>\
				<label for='checkbox-noremovetag'>Do not remove link rot tags</label>\
			</li>\
			<!--\
			<li>\
				<input name='nofixuplain' id='checkbox-nofixuplain' type='checkbox'/>\
				<label for='checkbox-nofixuplain'>Do not expand uncaptioned plain links (surrounded with [ ])</label>\
			</li>\
			-->\
			<li>\
				<input name='nofixcplain' id='checkbox-nofixcplain' type='checkbox'/>\
				<label for='checkbox-nofixcplain'>Do not expand references with a captioned external link only</label>\
			</li>\
			<li>\
				<input name='nouseoldcaption' id='checkbox-nouseoldcaption' type='checkbox'/>\
				<label for='checkbox-nouseoldcaption'>Do not use old captions</label>\
			</li>\
			<li>\
				<input name='nofixutemplate' id='checkbox-nofixutemplate' type='checkbox'/>\
				<label for='checkbox-nofixutemplate'>Do not expand <code>{{cite web}}</code> templates with a URL only</label>\
			</li>\
			<li>\
				<input name='addblankmetadata' id='checkbox-addblankmetadata' type='checkbox'/>\
				<label for='checkbox-addblankmetadata'>Add blank <code>|author=</code> and <code>|date=</code> fields if the information is unavailable</label>\
			</li>\
			<li>\
				<input name='noaccessdate' id='checkbox-noaccessdate' type='checkbox' checked=''/>\
				<label for='checkbox-noaccessdate-wiki'>Do not add access dates in the result</label>\
			</li>\
		</ul>\
		<input name='method-wiki' type='submit' value='Fix page'/>\
		<a href='" + rlServer + "' style='color: #555;'>Tool homepage</a>\
	</form>\
</div>" );
	if ( !rlIsWatching() ) {
		var nowatch = $( "<input>" ).name( "nowatch" ).type( "hidden" ).value( "y" );
		$( "#reflinks-form" ).append( nowatch );
	}
	$( "html, body" ).animate( {
		scrollTop: $( "#reflinks" ).offset().top - 10
	}, 250 );
}

function rlTearDownForm() {
	$( "#reflinks" ).remove();
}

function rlInit() {
	rlTearDownForm();
	rlSetUpForm( wgPageName );
}

$( document ).ready( function() {
	var link = rlServer + "/result.php?page=" + encodeURIComponent( wgPageName );
	if ( !rlIsWatching() ) {
		link += "&nowatch=y";
	}
	var rlPortlet = mw.util.addPortletLink( "p-tb", link, "Reflinks");
	var optionLink = $( "<a>" ).attr( "href", "#" ).html( "(options)" ).click( function() {
		rlInit();
	} );
	$( rlPortlet ).append( $( "<sup>").html( optionLink ) );
} );
