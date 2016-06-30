// Executes videofinder.js when extension button is clicked

chrome.browserAction.onClicked.addListener(function(tab) {

	// Inject CSS
	chrome.tabs.insertCSS(null, { file: "videofinder.css" }, function() {

		// Inject jQuery
		chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {

			// Inject videofinder.js
		  chrome.tabs.executeScript(null, { file: "videofinder.js" });
		});
	});
});



// Extension Install Event
	// send tracking data when extension is installed
chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install") {

		// MIXPANEL
		(function(f,b){if(!b.__SV){var a,e,i,g;window.mixpanel=b;b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.track_charge people.clear_charges people.delete_user".split(" ");
			for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2;a=f.createElement("script");a.type="text/javascript";a.async=!0;a.src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";e=f.getElementsByTagName("script")[0];e.parentNode.insertBefore(a,e)}})(document,window.mixpanel||[]);
			mixpanel.init("0a00fd2dbf4489e41d66c4d4693db111");

		// Google Analytics
		var _gaq = _gaq || [];
		_gaq.push(['_setAccount', 'UA-54259732-5']);
		_gaq.push(['_trackPageview']);

		(function() {
		  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		  ga.src = 'https://ssl.google-analytics.com/ga.js';
		  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		})();

		console.log("Chrome Extension Installed");
		_gaq.push(['_trackEvent', 'Chrome Extension', 'Installed']);
		mixpanel.track("Chrome Extension Installed");
		
	} else if (details.reason == "update") {
		console.log('Chrome Extension Updated');
	} else { 
		console.log('Nothing!');
	}
});