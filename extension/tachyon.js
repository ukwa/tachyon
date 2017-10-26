/* This is used to record the state of the plugin - active or not. */
var timeTravelEnabled = false;

var targetTime = "Thu, 31 May 2001 20:35:00 GMT";

//var mementoPrefix = "http://www.webarchive.org.uk/wayback/memento/";
var mementoPrefix = "http://localhost:18080/memento/";
var waybackPrefix = "http://localhost:18080/wayback/";
var timegatePrefix = mementoPrefix + "timegate/";

//
// Redirect loop:
//var timegatePrefix = "http://purl.org/memento/timegate/";
// 
// This is rather hacky, as we should be able to determine Memento status from the requests etc.
//var mementoPrefix = "http://api.wayback.archive.org/memento/"
//var timegatePrefix = "http://mementoproxy.lanl.gov/aggr/timegate/";

/* This is used to record any useful information about each tab, 
 * determined from the headers during download.
 */

function disableTimeTravel() {
    if( timeTravelEnabled ) {
        timeTravelEnabled = false;
        chrome.browserAction.setIcon({path:"icon-off.png"});
        // Remove the proxy override:
        browser.proxy.unregister();
        // Clear cache
        chrome.browsingData.removeCache({});
        // revert to live site.
        chrome.tabs.reload({bypassCache: true});
    }
}

function enableTimeTravel() {
    if( !timeTravelEnabled ) {
        timeTravelEnabled = true;
        chrome.browserAction.setIcon({path:"icon-on.png"});
        // Enable the proxy:
        console.log("Registering proxy...")
        browser.proxy.register('webarchive-proxy.js');
        // Clear cache
        chrome.browsingData.removeCache({});
        // Refresh tab to force switch to archival version:
        chrome.tabs.reload({bypassCache: true});
    }
}

browser.proxy.onProxyError.addListener(error => {
	  console.error(`Proxy error: ${error.message}`);
	});

function setTargetTime(timeString) {
	targetTime = new Date(timeString).toUTCString()
}

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  if (msg.engageTimeTravel) {
    console.log("Setting date "+msg.targetTime);
    setTargetTime(msg.targetTime);
    console.log("Engage TimeGate...");
    enableTimeTravel();
  } else	 if (msg.disengageTimeTravel) {
    console.log("Disengage TimeGate...");
    disableTimeTravel();
  } else if( msg.setTargetTime ) {
    console.log("Setting date "+msg.targetTime);
    setTargetTime(msg.targetTime);
    // Refresh tab to force update to new time setting::
    chrome.tabs.reload({bypassCache: true});
  } else if( msg.requestTargetTime ) {
    console.log("Sending current targetTime...");
    chrome.runtime.sendMessage({showTargetTime: true, targetTime: targetTime });
  }
});

/**
 * This takes a HTTPS request and redirects it to HTTP because that's all the proxy can support.
 * 
 * @param details
 * @returns
 */
function bounceToHttp(requestDetails) {
    if( timeTravelEnabled ) {
	  newUrl = requestDetails.url;
	  newUrl = newUrl.replace("https://", "http://");
	  console.log("Redirecting: " + requestDetails.url + " to " + newUrl);
	  return {
	    redirectUrl: newUrl
       };
    }
}

// add the listener,
// passing the filter argument and "blocking"
chrome.webRequest.onBeforeRequest.addListener(
  bounceToHttp,
  {urls:["https://*/*"]},
  ["blocking"]
);

/**
 * This modifies the request headers, adding in the desire Datetime.
 * 
 * TODO avoid interfering when there is no tab?
 */

function addAcceptDatetime(details) {
    // Pass through if the plugin is inactive.
    if( !timeTravelEnabled ) {
      return {requestHeaders: details.requestHeaders};
    }
    // Push in the Accept-Datetime header:
    console.log("Adding Accept-Datetime: "+ targetTime);
    details.requestHeaders.push( 
        { name: "Accept-Datetime", 
          value: targetTime }
    );
    return {requestHeaders: details.requestHeaders};
}
// Hook it in:
chrome.webRequest.onBeforeSendHeaders.addListener(
	addAcceptDatetime,
	{ urls: ['<all_urls>']},
    ['requestHeaders','blocking']
);


/**
 * During download, look for the expected Link headers and store them
 * associated with the appropriate tab.
 * Data looks like:
 Link: <http://www.webarchive.org.uk/wayback/list/timebundle/http://www.webarchive.org.uk/ukwa/>;rel="timebundle", <http://www.webarchive.org.uk/ukwa/>;rel="original", <http://www.webarchive.org.uk/wayback/memento/20090313000232/http://www.webarchive.org.uk/ukwa/>;rel="first memento"; datetime="Fri, 13 Mar 2009 00:02:32 GMT", <http://www.webarchive.org.uk/wayback/memento/20100623220138/http://www.webarchive.org.uk/ukwa/>;rel="last memento"; datetime="Wed, 23 Jun 2010 22:01:38 GMT", <http://www.webarchive.org.uk/wayback/memento/20090401212218/http://www.webarchive.org.uk/ukwa/>;rel="next memento"; datetime="Wed, 01 Apr 2009 21:22:18 GMT" , <http://www.webarchive.org.uk/wayback/list/timemap/link/http://www.webarchive.org.uk/ukwa/>;rel="timemap"; type="application/link-format",<http://www.webarchive.org.uk/wayback/memento/timegate/http://www.webarchive.org.uk/ukwa/>;rel="timegate"
 * i.e. <([^>])>;rel="([^"])"
 */
var relRegex = /<([^>]+)>;rel="([^"]+)"/g;
var tabRels = [];
function checkForMementoHeaders(details) {
    tabRels[details.tabId] = {};
    var headers = details.responseHeaders;
    var isMemento = false;
    for( var i = 0, l = headers.length; i < l; ++i ) {
      if( headers[i].name == 'Link' ) {
        while( matches = relRegex.exec(headers[i].value) ) {
          console.log("tabRels: "+matches[2]+" -> "+matches[1]);
          tabRels[details.tabId][matches[2]] = matches[1];
        }
      }
      // According to spec, can use presence of this header as definitive indicator that this is a Memento, and therefore not a live URL.
      if( headers[i].name == 'Memento-Datetime' ) {
        console.log("Memento-Datetime: "+headers[i].value);
        isMemento = true;
        tabRels[details.tabId]["Memento-Datetime"] = headers[i].value;
      }
    }
}
// Hook in it:
chrome.webRequest.onHeadersReceived.addListener(
		  checkForMementoHeaders,
		  {urls: ['<all_urls>']},
		  ["blocking", "responseHeaders"]
		);

/* This for Chrome */
navigator.registerProtocolHandler('web+webarchive',
	    chrome.runtime.getURL('webarchive-bookmark.html#%s'),
	    chrome.runtime.getManifest().name);

/**
 * Also allow Google Analytics to track if people are actually using this.
 * Only reports installations, no other details are shared.
 *
 * c.f. http://developer.chrome.com/extensions/tut_analytics.html
 */
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-7571526-4']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
