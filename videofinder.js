// Copyright 2015, Chris Kirkinis, All rights reserved.

// prevent second click on button
if (!window.hasOwnProperty('flag_98cds0d')) {
  window.flag_98cds0d = true; // set flag - so button can't be re-triggered

  // Main Variables
  // domain = 'http://localhost:3000/';
  // domain = 'https://tubulr-staging.herokuapp.com/'; // staging domain
  domain = 'https://tubulr.herokuapp.com/'; // production domain

  loadingIcon = '<svg width="60px" height="60px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="uil-dashinfinity ext-loading_icon"><path d="M24.3,30C11.4,30,5,43.3,5,50s6.4,20,19.3,20c19.3,0,32.1-40,51.4-40C88.6,30,95,43.3,95,50s-6.4,20-19.3,20C56.4,70,43.6,30,24.3,30z" fill="none" stroke="#ff9900" stroke-width="5" stroke-dasharray="8" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="0" to="40" begin="0" dur="1s" repeatCount="indefinite" fill="freeze"></animate></path></svg>'
  loadingIconCircle = '<svg version="1.1" id="bmk-circle_spinner" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve"><path opacity="0.2" fill="#ff9900" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/><path fill="#ff9900" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite"/></path></svg>'
  var user = {};
  var cssFilename = 'videofinder.css';
  var foundVideos = []; // array of video objects containing title, id, and thumbnail url
  onYouTubePage = false;


  // LOAD ASSETS -> CSS, jQuery, images

  loadCss(domain + cssFilename); // load external style sheet
  jQueryLoad(function() { // load jQuery
    console.log('jquery loaded');
    checkSignIn(function() {
    buildPopupBase();
      if (user.signedIn) {
        checkCurrentUrl();
      } else {
        loginPopup();
      }
    });
  }); 
}

// Check Current URL
// Determine if user is on YouTube, Vimeo, or Other -> take appropirate action
function checkCurrentUrl() {
  var current_url = location.href;
  var regex = /https?:\/\/www\.youtube\.com\/watch\?v=(?:[\w-]{11})|https?:\/\/vimeo\.com\/\d+/i
  var videoPage = regex.test(current_url);

  // Video Page
  if (videoPage) {
    buildPopupButtons(current_url);

    var provider = window.location.origin;
    if (provider === "https://www.youtube.com" || provider === "http://www.youtube.com") {
      onYouTubePage = true;
      console.log("provider is YouTube");
      $('#bmk-container').css("top", "210px");
    }

  // Other Page
  } else {
    insertMessage(loadingIcon + '<span class="ext-scanning_text">Scanning...</span>');
    console.log('Not on a Video Page -> Scanning for videos...');
    setTimeout(function(){
      findVideos();
    }, 1000);
  }
}

// Parse raw HTML
// Find YouTube/Vimeo embed and link patterns
function findVideos() {
  var html = document.documentElement.innerHTML; // store entire document html in string
  var regex = /(?:https?:)?\/\/(?:[0-9A-Za-z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com)(?:\/\S*(?:\/|\?v=))?([\w-]{11})|(?:<iframe [^>]*src=")?(?:(?:https?:)?\/\/(?:[\w]+\.)*vimeo\.com(?:[\/\w:]*(?:\/videos)?)?\/([0-9]+)[^\s]*)"?(?:[^>]*><\/iframe>)?(?:<p>.*<\/p>)?/ig
  
  var match; // stores matches

  // yt ids stored in capture group #1, vimeo ids stored in capture group #2
  // vimeo alt regex: /.*\.com\/(?:(?:groups\/[^\/]+\/videos\/)|(?:ondemand|channels)(?:(?:\/less\/)|(?:\/\w*\/))|(?:video\/))?([0-9]+).*$/

  // Iterate over regex matches
  // Build array of found video ids -> ( foundVideos )
  match = regex.exec(html);
  foundVideos = [];
  while (match !== null) {
    if (match[1]) { // if its a yt embed
      var video = {
        id: match[1],
        source: "YouTube"
      }
    } else { // if its a vimeo embed
      var video = {
        id: match[2],
        source: "Vimeo"
      };
    }
    foundVideos.push(video); // add video to array
    match = regex.exec(html); // move to next match
  }

  // if no videos are found
  if (foundVideos.length == 0 ) {
    insertMessage("No videos found");
    console.log("No videos found on this page.");
    closePopup(1000);

  // Otherwise display found videos
  } else {

    // look for & remove duplicates
    removeDuplicateVideos(foundVideos);
    console.log('...Found ' + foundVideos.length + " videos on page");

    // get info for all videos
    $.each(foundVideos, function(e) {
      if (!foundVideos[e].title) { // if havent fetched metadata for particular video
        if (foundVideos[e].source == "YouTube") {
          fetch_yt_data(foundVideos[e], e);
        } else if (foundVideos[e].source == "Vimeo") {
          fetch_vimeo_data(foundVideos[e], e);
        }
      }
      if (e == foundVideos.length-1) { // once last video is reached
        $(document).ajaxStop(function() { // once all ajax requests are finished
          $(this).unbind("ajaxStop"); // unbind ajax stop event once triggered

          // REMOVE UNDEFINED VIDEOS
          for (var i = 0; i < foundVideos.length; i++) {
            if (foundVideos[i].title == undefined) {
              foundVideos.splice(i, 1); // remove undefined videos
            }
          }

          if (foundVideos.length == 0 ) {
            console.log("No videos found on this page.");
            insertMessage("No videos found");
            closePopup(1000);
          } else {
            // BUILD VIDEO DISPLAY
            buildFinderBase();
          }
        });
      }
    })
  }
}

////////////////////////////////
// API REQUESTS ////////////////
////////////////////////////////

/////////////
// YOUTUBE //
/////////////

// Given a YouTube id: grab YouTube video data
// Update foundVideo with new data
function fetch_yt_data(foundVideo, e) {
  var baseURL = "https://www.googleapis.com/youtube/v3/videos?";
  var apiKey = "key=" + "AIzaSyC9Y31DRE7py286PKkLOqOV0a-IHtHLwB0";
  var videoIds = "&id=" + foundVideo.id;
  var part = "&part=snippet,id"; // options: https://developers.google.com/youtube/v3/docs/videos

  $.ajax({
    url: baseURL + apiKey + part + videoIds,
    success: function(data) {
      results = data.items;
      for (var i = 0; i < results.length; i++) {
        foundVideos[e] = {
          title: results[i].snippet.title,
          id: results[i].id,
          thumbnail: results[i].snippet.thumbnails.medium.url,
          source: "YouTube"
          //categoryId: results[i].snippet.categoryId, // 10 = music
          //datePublished: results[i].snippet.publishedAt,
          //description: results[i].snippet.description,
          //duration: convertDuration(duration), 
          //viewCount: results[i].statistics.viewCount,
          //likeCount: results[i].statistics.likeCount,
        }
      }
    }
  });
}

////////////
// VIMEO ///
////////////

function fetch_vimeo_data(foundVideo, e) {
  var baseURL = "https://vimeo.com/api/v2/video/";

  $.ajax({
    url: baseURL + foundVideo.id + ".json",
    success: function(data) {
      videoTitle = data[0].title;
      thumbURL = data[0].thumbnail_large;
      foundVideos[e] = { title: videoTitle, 
                         id: foundVideo.id, 
                         thumbnail: thumbURL, 
                         source: "Vimeo" };
    }
  });
}

///////////////////
// Submit Video ///
///////////////////

function addVideo(type, source, video_id) {

  // For Other Pages
  if (source == "YouTube" || source == "Vimeo") {
    closeFinder();
    buildPopupBase();
    if (source == "YouTube") {
      var video_link = "youtu.be/" + video_id;
    } else if (source == "Vimeo"){
      var video_link = "vimeo.com/" + video_id;
  }

  // For Video Pages
  } else {
    var video_link = source;
  }

  insertMessage(loadingIconCircle);
  
  $.ajax({
    url: domain + 'videos/submit?' + type + '=' + video_link, // http://localhost:3000/video/submit?heart=//youtu.be/xxx
    xhrFields: { withCredentials: true }, // provided user logged with session cookie applies authentication
    type: 'POST',

    success: function(data) {
      console.log('AJAX request successfull');
      insertMessage('Video added!');
      closePopup(1000);
    },

    error: function(data) {
      console.log('AJAX request failed');
      insertMessage('Something went wrong');
      closePopup(1000);
    }
  });
}

////////////////////////////////
// CONSTRUCTORS ////////////////
////////////////////////////////

function buildPopupBase() {
  if ( $('#bmk-container').length == 0) { // only if doesn't already exist
    // create main div
    $bmkContainer = $('<div>');
    $bmkContainer.attr('id', 'bmk-container').attr('class', 'bmk-show');

    // create message box
    $messageBox = $('<div>');
    $messageBox.attr('id', 'bmk-message-box');

    $('body').append($bmkContainer);
  }
}

function buildPopupButtons(url) {
  // create heart button
  $heartButton = $('<div>'); // create heart button div
  $heartButton.attr('id', 'bmk-heart').attr('class', 'bmk-button');
  $heartButton.html('<img class="bmk-icons" src="' + domain + 'images/icon_heart.png"/><br><span class="bmk-text">Heart</span>');

  // create watch later button
  $watchLaterButton = $('<div>');
  $watchLaterButton.attr('id', 'bmk-watchlater').attr('class', 'bmk-button');
  $watchLaterButton.html('<img class="bmk-icons" src="' + domain + 'images/icon_time.png"/><br><span class="bmk-text">Watch Later</span>');

  $bmkContainer.append($heartButton);
  $bmkContainer.append($watchLaterButton);

  popupClickable(url);
}

// Build the overlay html that holds the video thumbnails
function buildFinderBase() {
  closePopup(0); // closes "scanning..." popup
  console.log('building finder...');
  $('#ext-bkg').remove(); // remove previous finder (if it exists)

  // blur background and lock scroll
  $('body').children().addClass('ext-blur'); // apply backgound blur
  $('body').addClass('ext-no_scroll'); // prevent bkg scrolling

  // insert black backdrop
  $bkg = $('<div id="ext-bkg">');
  $('body').append($bkg);

  // insert container divs
  $outter = $('<div id="ext-outter">');
  $bkg.append($outter);
  $inner = $('<div id="ext-inner">');
  $outter.append($inner);

  // reveal and activate
  $('#ext-bkg').hide(); // hide entire finder
  buildFinderThumbnails(foundVideos); // build thumbnails
  $('#ext-bkg').fadeIn(500); // fade in finder (with thumbnails)
  finderClickable(); // make buttons clickable
}

// add a thumbnail for each found video
function buildFinderThumbnails(videos) {

  // build header notice ('Found X Videos')
  var video = videos.length != 1 ? 'Videos' : 'Video'
  $notice = $('<div id="ext-notice"><div id="ext-notice_box">Found ' + videos.length + ' ' + video + '</div></div>');
  $inner.append($notice);

  for (var i = 0; i < videos.length; i++) {
    var title = videos[i].title;
    var thumbnail = videos[i].thumbnail;

    $thumbnail = $('<div class="ext-thumbnail">');
    $thumbnail.data('id', videos[i].id);
    $thumbnail.data('source', videos[i].source);
    $thumbnail.attr('style', "background: url(" + thumbnail + ") no-repeat center center; background-size: cover;" );
    $inner.append($thumbnail);

    $heart = $('<div id="ext-heart">');
    $watchlater = $('<div id="ext-watchlater">');
    $title = $('<div id="ext-title">' + title + '</div>');
    $thumbnail.append($title);
    $thumbnail.append($heart);
    $thumbnail.append($watchlater);
  }
}

function loginPopup() {
  insertMessage('Please <a href="#" id="bmk-launch_signin">Sign In</a></p>');
  $('#bmk-container').on('click', function() {
    window.open(domain + "users/sign_in?bookmarklet=true", "_blank", "height=400, width=400");
    closePopup(2000);
  });
  popupClickable(); // Makes signin popup closable
}

function insertMessage(message){
  $('#bmk-container').html(''); // clear bmk-container

  // add message-box modal to DOM
  $('#bmk-container').append($messageBox);
  $('#bmk-message-box').html(message); // insert message
}

////////////////////////////////
// DESTROYERS //////////////////
////////////////////////////////

function closePopup(wait) {
  console.log('closePopup triggered');
  // wait = how long the message shows for before beginning close animation
  // totalAnimationTime = total time from click to destroy (animation takes 500ms)
  totalAnimationTime = wait+500;
  setTimeout(function(){
    $('#bmk-container').attr('class', 'bmk-hide'); // hide
  }, wait);
  setTimeout(function(){
    $('#bmk-container').remove();
    removeFlag();
  }, totalAnimationTime);
}

function closeFinder() {
  console.log('finder closed');
  $('#ext-bkg').fadeOut(300, function(){
    $('#ext-bkg').remove(); // delete finder
    $('.ext-blur').removeClass('ext-blur'); // remove backgound blur
    $('.ext-no_scroll').removeClass('ext-no_scroll'); // remove scroll lock
    removeFlag();
  })
}

////////////////////////////////
// ACTIONS /////////////////////
////////////////////////////////

// heart and watch later action on popup
function popupClickable(url) {
  $('#bmk-heart').on('click', function(){
    setTimeout(function(){
      addVideo('heart', url);
    }, 100);
    $('#bmk-heart').off('click'); // prevent multi click
  });
  $('#bmk-watchlater').on('click', function(){
    setTimeout(function(){
      addVideo('watchlater', url);
    }, 100);
    $('#bmk-watchlater').off('click'); // prevent multi click
  });

  // Dismiss Popup (by clicking outside of box)
  $('body').on('click', function(e) {
    console.log('body clicked!');
    var container = $('#bmk-container');
    target = e.target;

    if ( !container.is(e.target) // if the target of the click isn't the container...
      && container.has(e.target).length === 0 ) // ...does container include the item clicked? - nor a descendant of the container
    {
      console.log('clicked OUTSIDE');
      closePopup(0);
      $('body').off('click'); // turn off event binding on click
    } else {
      console.log('clicked INSIDE');
    }

  });
}

function finderClickable() {
  $('#ext-bkg').on('click', "#ext-heart", function(){
    var videoId = $(this).parent().data('id'); // get video id
    var source = $(this).parent().data('source');
    addVideo('heart', source, videoId);
    $('#ext-bkg').off('click'); // prevent multi click
  });

  $('#ext-bkg').on('click', "#ext-watchlater", function(){
    var videoId = $(this).parent().data('id');
    var source = $(this).parent().data('source');
    console.log('id: ' + videoId + ', source: ' + source);
    addVideo('watchlater', source, videoId);
    $('#ext-bkg').off('click'); // prevent multi click
  });

  // dismiss with click
  $('#ext-bkg').on('click', function(e) {
    var container = $(".ext-thumbnail");
    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
      console.log('closeFinder triggered by clicking outside results');
      $('#ext-bkg').off('click'); // turn off event binding on click
      closeFinder();
    }
  });

  // dismiss with escape key
  $(document).keyup(function(e) {
    if (e.keyCode == 27) {  // esc
      $('#ext-bkg').off('click'); // turn off event binding on click
      closeFinder();
    }
  });
}

////////////////////////////////
// UTILITY FUNCTIONS ///////////
////////////////////////////////

function jQueryLoad(callback) {
  var version = '1.11.3';
  if (window.jQuery === undefined || window.jQuery.fn.jquery < version) { // if jQuery is not loaded or its an old version of jQuery, load jQuery
    var script = document.createElement("script")
    script.type = "text/javascript";
    if (script.readyState) { //IE
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else { //Others
      script.onload = function () {
        callback();
      };
    }
    script.src = "https://ajax.googleapis.com/ajax/libs/jquery/" + version + "/jquery.min.js";
    document.getElementsByTagName("head")[0].appendChild(script);
  } else {
    callback(); // otherwise we have what we need and we're good to move on
  }
}

function loadCss(url) {
  var el = document.createElement("link");
  el.type = "text/css";
  el.rel = "stylesheet";
  el.href = url;
  var head = document.getElementsByTagName("head")[0];
  head.appendChild(el);
  console.log('stylesheet imported: ' + url);
}

function checkSignIn(callback) {
  $.ajax({
    url: domain + 'signedin',
    xhrFields: { withCredentials: true},
    type: 'POST',
    error: function() {
      console.log('error checking user signin status');
    },
    success: function(data) {
      var response = data;
      console.log(response.result);
      if ( response.result === "Signed In" ) {
        user.signedIn = true;
      } else {
        user.signedIn = false;
      }
      callback();
    }
  });
}

// allow button to be clicked again
function removeFlag() {
  delete window.flag_98cds0d;
}

function removeDuplicateVideos(origArr) {
  var newArr = [],
    origLen = origArr.length,
    found, x, y;
  for (x = 0; x < origLen; x++) {
    found = undefined;
    for (y = 0; y < newArr.length; y++) {
      if (origArr[x].id === newArr[y].id) {
        found = true;
        break;
      }
    }
    if (!found) {
      newArr.push(origArr[x]);
    }
  }
  foundVideos = newArr;
}