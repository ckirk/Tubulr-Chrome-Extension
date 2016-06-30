// Copyright 2015, Chris Kirkinis, All rights reserved.

// prevent second click on button
if (!window.hasOwnProperty('flag_98cds0d')) {
  window.flag_98cds0d = true; // set flag - so button can't be re-triggered

  // Sets domain variable if not already set (new version of bookmarklet sets it)
  if( typeof domain === 'undefined' ) {
    domain = 'https://tubulr.herokuapp.com/'; // production domain
  }

  loadingIcon = '<svg width="60px" height="60px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="uil-dashinfinity ext-loading_icon"><rect x="0" y="0" width="100" height="100" fill="none" class="bk"></rect><path d="M24.3,30C11.4,30,5,43.3,5,50s6.4,20,19.3,20c19.3,0,32.1-40,51.4-40C88.6,30,95,43.3,95,50s-6.4,20-19.3,20C56.4,70,43.6,30,24.3,30z" fill="none" stroke="#ff9900" stroke-width="5" stroke-dasharray="8.018404006958008 8.018404006958008" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="0" to="16.036808013916016" begin="0" dur=".4s" repeatCount="indefinite" fill="freeze"></animate></path></svg>'
  loadingIconCircle = '<svg version="1.1" id="bmk-circle_spinner" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve"><path opacity="0.2" fill="#ff9900" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/><path fill="#ff9900" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite"/></path></svg>'
  var user = {}; // stores user id
  var extAdd = {}; // stores data for adding videos to collection
  var cssFilename = 'videofinder.css';
  var foundVideos = []; // array of video objects containing title, id, and thumbnail url
  var current_url = location.href;

  var heartImgUrl = chrome.extension.getURL("images/bmk-heart.png");
  var addImgUrl = chrome.extension.getURL("images/bmk-plus.png");
  var laterImgUrl = chrome.extension.getURL("images/bmk-clock-o.png");

  onYouTubePage = false;


  checkSignIn(function() {
  buildPopupBase();
    if (user.signedIn) {
      checkCurrentUrl();
    } else {
      loginPopup();
    }
  });
}

// Check Current URL
// Determine if user is on YouTube, Vimeo, or Other -> take appropirate action
function checkCurrentUrl() {
  var regex = /https?:\/\/(?:www|m)\.youtube\.com\/watch\?v=(?:[\w-]{11})|https?:\/\/vimeo\.com\/\d+/i
  onVideoPage = regex.test(current_url);

  // Video Page
  if (onVideoPage) {
    buildPopupButtons(current_url);

    var provider = window.location.origin;
    if (provider === "https://www.youtube.com" || provider === "http://www.youtube.com") {
      onYouTubePage = true;
      console.log("provider is YouTube");
      $('#bmk-container').css("top", "245px");
    }

  // Other Page
  } else {
    var fbRegex = /https?:\/\/www\.facebook\.com/i
    onFacebook = fbRegex.test(current_url);

    if (onFacebook) {
      console.log("on Facebook!");
      // findVideosFB();
    } else {
      insertMessage(loadingIcon + '<span class="ext-scanning_text">Scanning...</span>');
      console.log('Not on a Video Page -> Scanning for videos...');
      setTimeout(function(){
        findVideos();
      }, 500);
    }
  }
}

// Parse raw HTML
// Find YouTube/Vimeo embed and link patterns
function findVideos() {
  var html = document.documentElement.innerHTML; // store entire document html in string

  var fbRegex = /https?:\/\/www\.facebook\.com/i
  onFacebook = fbRegex.test(current_url);
  // if on facebook {
  if (onFacebook) {
    var regex = /(?:https?:)?\/\/(?:[0-9A-Za-z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com)(?:\/\S*(?:\/|\?v=))?([\w-]{11})|(?:<iframe [^>]*src=")?(?:(?:https?:)?\/\/(?:[\w]+\.)*vimeo\.com(?:[\/\w:]*(?:\/videos)?)?\/([0-9]+)[^\s]*)"?(?:[^>]*><\/iframe>)?(?:<p>.*<\/p>)?|(?:src="\/ajax\/inset\/iframe\?id=(?:(?:youtube-video-([\w-]{11}))|(?:vimeo-([0-9]+))))|(?:\/|\%2F)(?:\w+)(?:\/|\%2F)(?:videos|posts)(?:\/|\%2F)([0-9]+)/ig
  } else {
    var regex = /(?:https?:)?\/\/(?:[0-9A-Za-z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com)(?:\/\S*(?:\/|\?v=))?([\w-]{11})|(?:<iframe [^>]*src=")?(?:(?:https?:)?\/\/(?:[\w]+\.)*vimeo\.com(?:[\/\w:]*(?:\/videos)?)?\/([0-9]+)[^\s]*)"?(?:[^>]*><\/iframe>)?(?:<p>.*<\/p>)?|(?:src="\/ajax\/inset\/iframe\?id=(?:(?:youtube-video-([\w-]{11}))|(?:vimeo-([0-9]+))))|(?:https?:(?:\/|\%2F)(?:\/|\%2F))?www.facebook.com(?:\/|\%2F)(?:\w+)(?:\/|\%2F)(?:videos|posts)(?:\/|\%2F)([0-9]+)/ig
  }
  
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
    } else if (match[2]) { // if its a vimeo embed
      var video = {
        id: match[2],
        source: "Vimeo"
      };
    } else if (match[3]) { // 3rd match group is gawker-specific - looks for this pattern: src="/ajax/inset/iframe?id=youtube-video-0r1NtANXN8E
      var video = {
        id: match[3],
        source: "YouTube"
      };
    } else if (match[4]) { // 4th match group is gawker-specific - looks for this pattern src="/ajax/inset/iframe?id=vimeo-155572038
      var video = {
        id: match[4],
        source: "Vimeo"
      };
    } else if (match[5]) {
      var video = {
        id: match[5],
        source: "Facebook"
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
        } else if (foundVideos[e].source == "Facebook") {
          fetch_fb_data(foundVideos[e], e);
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

//////////////
// FACEBOOK //
//////////////

function fetch_fb_data(foundVideo, e) {
  var baseURL = "https://graph.facebook.com/";
  var token = "459236620900995|L9jVnpz7nM6Dp-F4BSdSumn7A2k";

  $.ajax({
    url: baseURL + foundVideo.id + "?access_token=" + token,
    success: function(data) {
      window.test = data;

      videoTitle = data.name;
      thumbURL = data.format[1].picture;
      foundVideos[e] = { title: videoTitle, 
                         id: foundVideo.id, 
                         thumbnail: thumbURL, 
                         source: "Facebook" };
    }
  });
}

///////////////////////
// Get Collections ////
///////////////////////

// http://localhost:3000/users/1/collections.json
function getCollections() {
  insertMessage(loadingIconCircle);
  $.ajax({
    url: domain + 'users/' + user.id + '/collections.json',
    xhrFields: { withCredentials: true }, // provided user logged with session cookie applies authentication
    type: 'GET',

    success: function(data) {
      console.log('AJAX request successfull - Successfully fetched user collections');
      response = data;
      closePopup(1);
      setTimeout(function(){
        showCollections(data);
      }, 150);
    },
    complete: function() {
      // alert('ajax finished');
    },

    error: function(data) {
      console.log('AJAX request failed');
      insertMessage('Something went wrong');
      closePopup(1000);
    }
  });
}

/////////////////////////
// Add To Collection ////
/////////////////////////

function addToCollection(video_link, collection_id) {
  buildPopupBase();
  insertMessage(loadingIconCircle);
  if (!onVideoPage) {
    var current_url = location.href;
  } else {
    var current_url = null
  }
  $.ajax({
    url: domain + 'videos/add_to_collection',
    xhrFields: { withCredentials: true }, // provided user logged with session cookie applies authentication
    type: 'POST',
    data: { 
        video_url: video_link,
        collection_id: collection_id,
        source_url: current_url
      },

    success: function(data) {
      response = data;
      console.log('AJAX request successfull - Added video to collection');
      insertMessage('Video added!');
      closePopup(1000);
    },

    error: function(data) {
      response = data;
      console.log('AJAX request failed');
      insertMessage('Something went wrong');
      closePopup(1000);
    }
  });
}

///////////////////
// Submit Video ///
///////////////////

function addVideo(type, source, video_id) {
  // type: 'heart' or 'watchlater'
  // source: 'YouTube/Vimeo/Facebook' or url
  // video_id: provider's video id

  // For Other Pages
  if (source == "YouTube" || source == "Vimeo") {
    closeFinder();
    buildPopupBase();
    if (source == "YouTube") {
      var video_link = "youtu.be/" + video_id;
    } else if (source == "Vimeo"){
      var video_link = "vimeo.com/" + video_id;
    }
  } else if (source == "Facebook") {
    closeFinder();
    buildPopupBase();
    var video_link = "facebook.com/facebook/videos/" + video_id;
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
// Check SignIn ////////////////
////////////////////////////////

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
        user.id = response.user_id;
      } else {
        user.signedIn = false;
      }
      callback();
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
  // create heart, add, and watch later buttons
  $buttons = $('<div id="bmk-heart" class="bmk-button"><img src=' + heartImgUrl + '><span class="bmk-text">Heart</span></div><div id="bmk-add" class="bmk-button"><img src=' + addImgUrl + '><span class="bmk-text">Add</span></div><div id="bmk-watchlater" class="bmk-button"><img src=' + laterImgUrl + '><span class="bmk-text">Later</span></div>');
  $bmkContainer.append($buttons);
  popupClickable(url);
}

// Build the overlay html that holds the video thumbnails
function buildFinderBase() {
  $('#bmk-container').remove();// closePopup(0); // closes "scanning..." popup
  console.log('building finder...');
  $('#ext-bkg').remove(); // remove previous finder (if it exists)

  // blur background and lock scroll
  $('body').children().addClass('ext-blur'); // apply backgound blur
  $('body').addClass('ext-no_scroll'); // prevent bkg scrolling

  // insert black backdrop
  $bkg = $('<div id="ext-bkg">');
  $('body').append($bkg);

  // insert container divs
  $container = $('<div id="ext-container">');
  $bkg.append($container);

  // reveal and activate
  buildFinderThumbnails(foundVideos); // build thumbnails
  $('#ext-bkg').hide().fadeIn(500); // fade in finder (with thumbnails)
  $('#ext-container').css({
    transform: 'scale(1) translate(-50%, -50%)',
    opacity: '1'
  });
  finderClickable();
}

// add a thumbnail for each found video
function buildFinderThumbnails(videos) {

  // Build Header (summary) ('Found X Videos')
  var video = videos.length != 1 ? 'Videos' : 'Video'
  $summary = $('<div id="ext-summary"><div id="ext-summary_box">Found ' + videos.length + ' ' + video + '</div></div>');
  $container.append($summary);

  for (var i = 0; i < videos.length; i++) {
    var title = videos[i].title;
    var thumbnail = videos[i].thumbnail;

    // Build Thumbnail
    $thumbnail = $('<div class="ext-thumbnail">');
    $thumbnail.data('id', videos[i].id);
    $thumbnail.data('source', videos[i].source);
    $thumbnail.attr('style', "background: url(" + thumbnail + ") no-repeat center center; background-size: cover;" );

    // Build Buttons
    $action_buttons = $('<div id="ext-actions"><div class="ext-action ext-heart"><div class="ext-button ext-heart"></div></div><div class="ext-action ext-add"><div class="ext-button ext-add"></div></div><div class="ext-action ext-watchlater"><div class="ext-button ext-watchlater"></div></div></div>');
    $title = $('<div id="ext-title">' + title + '</div>');

    $thumbnail.append($title);
    $thumbnail.append($action_buttons);

    $container.append($thumbnail);
    // $thumbnail.hide().delay(100 * i).slideDown(400);
  }
}

function loginPopup() {
  insertMessage('Please: <a href="#" id="bmk-launch_signin">Sign In</a></p>');
  $('#bmk-container').on('click', function() {
    window.open(domain + "users/sign_in?bookmarklet=true", "_blank", "height=400, width=400");
    closePopup(2000);
  });
  popupClickable(); // Makes signin popup closable
}

function insertMessage(message){
  $('#bmk-container').empty(); // clear bmk-container

  // add message-box modal to DOM
  $('#bmk-container').append($messageBox);
  $('#bmk-message-box').html(message); // insert message
}

function showCollections(data) {
  // No collections found
  if ( data.length == 0) {
    setTimeout(function(){
      buildPopupBase();
      insertMessage('No Collections Found');
      closePopup(1500);
    }, 300);

  // Add Collections list
  } else {
    // Build Collection Container
    $collection_container = $('<div id="ext-collection_container"><ul id="ext-collections"></ul></div>');
    if (onVideoPage){
      $('#bmk-container').after($collection_container); // insert collection container
      $('body').addClass('ext-no_scroll'); // prevent bkg scrolling
    } else {
      $collection_container.data('videoId', extAdd.videoId);
      $collection_container.data('source', extAdd.source);
      $('#ext-container').after($collection_container);
    }

    if ( onYouTubePage ) {
      $('#ext-collections').css("top", "150px");
    }
    
    console.log('begin building collections list');
    for (var i = 0; i < data.length; i++) {
      $('#ext-collections').append('<li data-id=' + data[i].id + '>' + data[i].name + '</li>');
    }
    collectionsClickable();
  }
}

////////////////////////////////
// DESTROYERS //////////////////
////////////////////////////////

function closePopup(wait) {
  console.log('closePopup triggered');
  // wait = how long the message shows for before beginning close animation
  // totalAnimationTime = total time from click to destroy (animation takes 500ms)
  totalAnimationTime = wait+400;
  setTimeout(function(){
    $('#bmk-container').addClass('bmk-hide'); // hide
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

function closeCollections() {
  $('#ext-collection_container').fadeOut('300', function() {
    $('#ext-collection_container').remove();
    $('body').removeClass('ext-no_scroll'); // prevent bkg scrolling
  });
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
  $('#bmk-add').on('click', function(){
    setTimeout(function(){
      getCollections();
    }, 100);
    $('#bmk-add').off('click'); // prevent multi click
  });
  $('#bmk-watchlater').on('click', function(){
    setTimeout(function(){
      addVideo('watchlater', url);
    }, 100);
    $('#bmk-watchlater').off('click'); // prevent multi click
  });

  // Dismiss Popup (by clicking outside of box)
  $('body').on('click', function(e) {
    var container = $('#bmk-container');
    target = e.target;

    if ( !container.is(e.target) // if the target of the click isn't the container...
      && container.has(e.target).length === 0 ) // ...does container include the item clicked? - nor a descendant of the container
    { 
      console.log('clicked outside popup!');
      closePopup(0);
    } else {
      console.log('clicked inside popup!');
    }
    $('body').off('click'); // turn off event binding on click
  });
}

function finderClickable() {
  // Heart Button
  $('#ext-bkg').on('click', '.ext-action.ext-heart', function(){
    var videoId = $(this).parents('.ext-thumbnail').data('id'); // get video id
    var source = $(this).parents('.ext-thumbnail').data('source');
    var url = window.location.href;
    addVideo('heart', source, videoId);
    $('#ext-bkg').off('click'); // prevent multi click
  });

  // Add Button
  $('#ext-bkg').on('click', ".ext-action.ext-add", function(){
    extAdd.videoId = $(this).parents('.ext-thumbnail').data('id');
    extAdd.source = $(this).parents('.ext-thumbnail').data('source');
    getCollections();
    // $('#ext-bkg').off('click'); // prevent multi click
  });

  // Watch Later Button
  $('#ext-bkg').on('click', ".ext-action.ext-watchlater", function(){
    var videoId = $(this).parents('.ext-thumbnail').data('id');
    var source = $(this).parents('.ext-thumbnail').data('source');
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

function collectionsClickable() {
  $('#ext-collections li').click(function() {
    var collection_id = $(this).data('id');
    if (onVideoPage){
      addToCollection(window.location.href, collection_id);
    } else {
      var video_id = $(this).parents('#ext-collection_container').data('videoId');
      var source = $(this).parents('#ext-collection_container').data('source');
      if (source == "YouTube") {
        var video_link = "youtu.be/" + video_id;
      } else if (source == "Vimeo"){
        var video_link = "vimeo.com/" + video_id;
      } else if (source == "Facebook") {
        var video_link = "facebook.com/facebook/videos/" + video_id;
      }
      addToCollection(video_link, collection_id);
    }
  });

  // Dismiss with click
  $('#ext-collection_container').on('click', function(e) {
    closeCollections();
  });
}

////////////////////////////////
// UTILITY FUNCTIONS ///////////
////////////////////////////////

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