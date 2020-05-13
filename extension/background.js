var currentTab;
var currentBookmark;
var currentTitle;

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
  browser.browserAction.setIcon({
    path: currentBookmark ? {
      19: "icons/star-filled-19.png",
      38: "icons/star-filled-38.png"
    } : {
      19: "icons/star-empty-19.png",
      38: "icons/star-empty-38.png"
    },
    tabId: currentTab.id
  });
  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: currentTitle,
    tabId: currentTab.id
  }); 
}

/*
 * Add or remove the bookmark on the current page.
 */
/*function toggleBookmark() {
  if (currentBookmark) {
    browser.bookmarks.remove(currentBookmark.id);
  } else {
    browser.bookmarks.create({title: currentTab.title, url: currentTab.url});
  }
}

browser.browserAction.onClicked.addListener(toggleBookmark);
*/

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateActiveTab(tabs) {

  function isSupportedProtocol(urlString) {
    var supportedProtocols = ["https:", "http:", "ftp:"];
    var url = document.createElement('a');
    url.href = urlString;
    return supportedProtocols.indexOf(url.protocol) != -1;
  }

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      if (isSupportedProtocol(currentTab.url)) {
        currentTitle = 'Checking...'
        currentBookmark = false;
        updateIcon();
        
        //qurl = "https://www.webarchive.org.uk/wayback/archive/cdx?matchType=exact&url=" + currentTab.url;
        qurl = "https://beta.webarchive.org.uk/wayback/archive/20500101120000mp_/" + currentTab.url;
        fetch(qurl)
        .then(response => {
          console.info(response);
          if( response.status == 200) {
            currentTitle = "In UKWA!"
            currentBookmark = true;
          } else {
            currentTitle = "Not in UKWA!"
            currentBookmark = false;
          }
          updateIcon();
        })
        .catch(error => {
          console.error('Error:', error);
        })
        
      } else {
        currentTitle = 'Unsupported!';
        currentBookmark = false;
        updateIcon();
        console.log(`UKWA Toolkit does not support the '${currentTab.url}' URL.`)
      }
    }
  }

  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);
}

// listen for bookmarks being created
//browser.bookmarks.onCreated.addListener(updateActiveTab);

// listen for bookmarks being removed
//browser.bookmarks.onRemoved.addListener(updateActiveTab);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();
