/* exported FindProxyForURL */

var blockedHosts = [];
const allow = "DIRECT";
const deny = "PROXY localhost:8090";

// tell the background script that we are ready
chrome.runtime.sendMessage("init");

// listen for updates to the blocked host list
chrome.runtime.onMessage.addListener((message) => {
  blockedHosts = message;
});

// required PAC function that will be called to determine
// if a proxy should be used.
function FindProxyForURL(url, host) {
	return "PROXY 192.168.45.25:8090";
	/*
  if (blockedHosts.indexOf(host) != -1) {
    chrome.runtime.sendMessage(`Proxy-blocker: blocked ${url}`);
    return deny;
  }
  return allow;
  */
}
