console.log("LOC "+location.hash)

function locationHashChanged() {
	webarchiveUrl = unescape(location.hash.split('#')[1])
    $('#bookmark-url').text(webarchiveUrl);
	
	// Use a dummy http protocol so the parser parses the URI right:
	var parser = new URL(webarchiveUrl.replace('web+webarchive:', 'http:'));
	
	// Set the target URL:
    $('#target-url').val(parser.searchParams.get('url'));
    
    // Sort out the timestamp:
    timestamp = parser.searchParams.get('timestamp')
    $('#target-date').val(timestamp);
    
    // TODO Add parser.pathname depending on playback mode?
    $('#target-archive').val(parser.host);
}


window.onhashchange = locationHashChanged;

locationHashChanged();

