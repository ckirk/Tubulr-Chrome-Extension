chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {file: "forward.js"})
});


chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install") {
		console.log('extension installed');

		// ANALYTICS
		ga('send', 'event', 'Chrome Extension', 'Installed'); // google analytics
		mixpanel.track("Chrome Extension Installed");
		
	} else if (details.reason == "update") {
		console.log('extension updated');
	} else { 
		console.log('nothing')
	}
});