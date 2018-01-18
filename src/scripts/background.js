import ext from "./utils/ext";
import storage from "./utils/storage"
import $ from "./vendor/jquery"
import { hostname } from "os";

var oratorHost = "orator.azurewebsites.net";

function sendArticleToOrator(articleData,sendResponse){
  storage.get("bearer" , function(result) {
    //console.log("bearer got from storage =  " + result.bearer)
    var url = 'https://'+oratorHost+'/BrowserExt/AddArticleChromeExt'
    $.ajax({url: url, 
      type:'GET',
      data:articleData,
      headers:{'Authorization': 'Bearer ' + result.bearer},
      success: function(result){
        if(result!="done"){
          sendResponse( {action:"error", message:result});
        }
      }
  });

  });
}

ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action === "perform-save") {
      console.log("Extension Type: ", "/* @echo extension */");
      console.log("PERFORM AJAX", request.data);

      sendArticleToOrator(request.data,sendResponse);
    }
    else if (request.action === "perform-logout"){
      //clear the token
      storage.set({ "oratorName" : "" }, function() {
        console.log("oratorName cleared");
      });
      storage.set({ "bearer" : "" }, function() {
        console.log("bearer cleared");
      });
      var redirectUri = encodeURIComponent(chrome.identity.getRedirectURL('provider_cb'));
      var options = {
        'interactive': false,
        'url': 'https://'+oratorHost+'/Account/Logout?redirect_uri=' + redirectUri
      }
      chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
        console.log('launchWebAuthFlow logout my orator', chrome.runtime.lastError,redirectUri);
      });

      
      //log out of google
      options = {
        'interactive': false,
        'url': 'https://accounts.google.com/logout?redirect_uri='+ redirectUri
      }
      chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
        console.log('launchWebAuthFlow logout google', chrome.runtime.lastError,redirectUri);
      });
    }
    else if (request.action === "perform-login"){
      
      var redirectUri = chrome.identity.getRedirectURL('provider_cb');
      
      var options = {
        'interactive': true,
        'url': 'https://'+oratorHost+'/BrowserExt/LoginWithChromeExtension' +
               //'?client_id=2' +
               '?redirect_uri=' + encodeURIComponent(redirectUri)
      }
      console.log(redirectUri + " " + options.url);
      chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
        console.log('launchWebAuthFlow completed', chrome.runtime.lastError,
            redirectUri);
  
        if (chrome.runtime.lastError) {
          sendResponse({ action: "error" });//(new Error(chrome.runtime.lastError));
          return;
        }
  
        var redirectRe = new RegExp('access_token=(.*)&');
        var matches = redirectUri.match(redirectRe);
        if (matches && matches.length > 1)
        {
          //store the bearer token
          storage.set({ "bearer" : matches[1] }, function() {
            //console.log("bearer token stored: " + matches[1]);
          });
          //todo:get the username info, store it and display it
          var url = 'https://'+oratorHost+'/Account/GetUserInfo'
        $.ajax({url: url, 
          type:'GET',
          data:request.data,
        headers:{'Authorization': 'Bearer ' + matches[1]},
      success: function(result){
        console.log(result);
        storage.set({ "oratorName" : result }, function() {
          console.log("oratorName stored: " + result);
          sendResponse({ action: "login success" });
        });
      } });
          
        }
        else
        {
          sendResponse({ action: "error log in can't parse" });
        }
      });
    }
    return true;//this is required to get the sendResponse callback to work
  }
);

function parseRedirectFragment(fragment) {
  var pairs = fragment.split(/&/);
  var values = {};

  pairs.forEach(function(pair) {
    var nameval = pair.split(/=/);
    values[nameval[0]] = nameval[1];
  });

  return values;
}

   var errorFn = function errorFn(resp) {
        if (!resp) {
            alert("Please refresh this page and try again.");
        }
    };

ext.commands.onCommand.addListener(function (command) {
  if (command === "save-page-shortcut") {
    console.log("save page shortcut"); 
    testValidBearerToken(function(tokenValid){
    
          
          /*ext.tabs.sendMessage(activeTab.id, {
              action: "keyboard-shortcut"
          }, errorFn);*/

          
            if(tokenValid)
            {
                ext.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                  var activeTab = tabs[0];
                sendArticleToOrator({"url":activeTab.url,"title":activeTab.title, "tag":""}, function(){});

                chrome.notifications.create('sentNotif',{ 
                  type: 'basic',
                  iconUrl: 'icons/icon-38.png',
                  title:'My Orator - Article sent',
                  message: '"'+activeTab.title + '" is saved to your playlist.  Click this to view your entire list.'
                });
              });
            }
            else{
              chrome.notifications.create('sentNotif',{ 
                type: 'basic',
                iconUrl: 'icons/icon-38.png',
                title:'Error - My Orator - Not signed in',
                message: 'Open the My Orator extension to log in first, then try again.'
              });
            }
            });
          }
});

chrome.notifications.onClicked.addListener(function (e){
  var newURL = "http://myOrator.net/";
  chrome.tabs.create({ url: newURL });
});

function testValidBearerToken(fn){
  storage.get('bearer', function(res){
      if(res.bearer)
      {
        //grab username via URL
        var url = 'https://'+oratorHost+'/Account/GetUserInfo'
        $.ajax({url: url, 
          type:'GET',
        headers:{'Authorization': 'Bearer ' + res.bearer},
        //headers:{'Authorization': 'Bearer ' + "res.bearer"},
        success: function(result){
          console.log(result);
          if(result.startsWith("<!DOCTYPE html>"))
          {
            fn(false);
          }
          else{
            console.log('logged in');
            fn(true);
          }
        
      } });
    }
    else{
      fn(false);
    }
  })
}