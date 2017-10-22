Tachyon - Browse The Past
=========================

This is an experimental web extension exploring whether we can make proxy-mode access to web archives.

Ideally, we could have different target time settings in every tab. However, [browser proxy settings](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/proxy) are not tab-scoped, they are global, so this is not trivial to implement. Even if we switch proxy settings when tabs are stwiched, any background activity in a tab will be re-directed to a different datetime when the switch is made. It may be possible to come up with more elaborate solutions for this, but for now it seems easier to accept that the proxy is a global setting and work with that.

In this approach, each tab would indicate whether it the target time (Memento datetime or current/live web) had been changed since the page was loaded. i.e. this potential for inconsistency would be made clear to the user, rather than being wholly avoided.

The [address bar button](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/user_interface/Page_actions) would be used to communicate the page status, whereas  the [toolbar button](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/user_interface/Browser_action) would be used to control the browser-level settings.

The address bar button should be coloured according to how good the fit between the target time and the page time(s) is. The button should provide a popup that at least gives the datetime of the main frame (but could be extended to show e.g. time-range of resources in page).

The main temporal navigation would be through the toolbar button. This would be used to set the target time and engage/disengage the archival proxy (or proxies). It would also summarise the current page mementos available to assist in temporal navigation (e.g. jump to first previous next last would be shown here). Actions here can also force a reload of the page and possible [clear the cache](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/browsingData/removeCache) (as needed).

Under the hood, the extension will need to put in the `Accept-Datetime` header on requests and likely try to avoid caching content by modifying headers in the response.

We can also [register a protocol handler](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler) to support URIs that point to an archived web page. Due to security limitations we can't add any-old protocols (e.g. no `webarchive:` or `pwid:` as proposed [here](https://github.com/ukwa/ukwa-player)), but we can add a `web+archive:` protocol and let the extension handle those links (here's how that was done for [ssh](https://chromium.googlesource.com/apps/libapps/+/master/nassh/js/nassh.js#222)). Our extension could look for URIs something like

    web+archive://proxy.webarchive.org.uk:80/?url=http://portico.bl.uk&timestamp=20010101120000
    web+archive://proxy.webarchive.org.uk:80/?url=http://www.bl.uk&datetime=2016-01-22T11.20.29Z&api=proxy
    web+pwid:archive.org:2016-10-20_22.26.35_page:https://www.doi.org/
    
On receiving those URIs, the extension would set the proxy and `Accept-datetime` appropriately, engage time-travel mode and load the required URI. Sadly, as this all needs proxy-modification to work at all, we can't leave them in the address bar, but we can perhaps support them as 'canonical' URIs and expose them well enough that they can be bookmarked by the user.

As well as this, it may make sense to support a custom content type for e.g. lists of archival bookmarks. The [pdf.js extension shows how do to that kind of thing](https://stackoverflow.com/questions/27770677/chrome-extension-how-to-show-custom-ui-for-a-pdf-file).

Other ideas:

* Intercept 404s and offer replacements (e.g. highlight toolbar button)
* Offer indication of archival status of all pages. e.g.
    * Badge colour indicates duration since last archival crawl. Red for none.
    * Badge number indicates number of known archival snapshots.
    * Offer to submit to archives.
* Allow user to easily switch between proxy services.
* Extend support/definition of 'archival bookmarks' (e.g. integrate them as proper bookmarks?)
* Support the PWID notion of [Context of use](https://tools.ietf.org/html/draft-pwid-uri-specification-02#section-6) and help the user understand the scope if a bookmark.
* Allow different proxies to be specified for different host/SURT ranges?
* Interface with UKWA W3ACT API and allow some curation activities from in the browser?



Change Log
----------

### 2017-10-22 ###

At this point, we switch tactics and try to support proxy-mode access and resolvable 'archival bookmark' URIs.

Pre-2017 this extension aimed to re-direct requests to archived Mementos by intercepting `webRequests` and redirecting them to Memento API enpoints. This proved too difficult to get to work without relying on re-writing the page content (in particular, JavaScript HTTP requests were being blocks due to appearing to be cross-site requests, but this was being done within the jQuery library, before the request could get to the extension and be re-mapped).

As the original intention was to aim for the highest possible playback quality, the strategy was switch to exploring how to make proxy-mode playback more usable. Furthermore, in the intervening time, many browsers have moved towards a common standard for web extensions, meaning that it should be possible to make the extension available to many different browsers (not just Chrome).