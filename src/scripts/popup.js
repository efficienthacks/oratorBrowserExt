import ext from "./utils/ext";
import storage from "./utils/storage";
import $ from "./vendor/jquery"

var popup = document.getElementById("app");
storage.get('color', function(resp) {
  var color = resp.color;
  if(color) {
    popup.style.backgroundColor = color
  }
});

$(document).ready(function(){
  $('body').on('click', 'a', function(){
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
  });
});

var template = (data) => {
  var json = JSON.stringify(data);
  return (`
  <div class="site-description">
  
    <p class="description">${new Option(data.title).innerHTML}</p>
    
    URL<br/>
    <input type="text" id="url" value="${data.url}"/> <br/>

    Tag<br/>
    <input type="text" id="tag" placeholder="optional" value=""/><br/>
    
  </div>
  <div class="action-container">
    <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Send to My Orator</button><br/>
    <small><a href="https://orator.azurewebsites.net/Articles">See entire playlist</a></small> 
  </div>
  `);
}
var renderMessage = (message) => {
  var displayContainer = document.getElementById("display-container");
  displayContainer.innerHTML = `<p class='message'>${message}</p>`;
}

var renderBookmark = (data) => {
  var displayContainer = document.getElementById("display-container")
  if(data && data.url.startsWith("http")) {
    storage.get('bearer', function(res){
      if(res.bearer)
      {
        //grab username via URL

        var url = 'https://orator.azurewebsites.net/Account/GetUserInfo'
        $.ajax({url: url, 
          type:'GET',
        headers:{'Authorization': 'Bearer ' + res.bearer},
        //headers:{'Authorization': 'Bearer ' + "res.bearer"},
        success: function(result){
          console.log(result);
          if(result.startsWith("<!DOCTYPE html>"))
          {
            ext.runtime.sendMessage({ action: "perform-login" }, function(response) {
              if(response && response.action === "login success")
              {
                console.log("called back log in success");
                renderBookmark(data);
              }
            });
          }
          else{
            var tmpl = template(data);
            displayContainer.innerHTML = tmpl;
          }
        
      } });
      }
      else{
        renderMessage("Please click options to sign in first.");
      }
    });
      
  } else {
    renderMessage("Sorry, My Orator does not work on this page.")
  }
}

ext.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
  var activeTab = tabs[0];
  //console.log(activeTab.url);
  //console.log(activeTab.title);
  renderBookmark(
    {"title":activeTab.title,
    "url":activeTab.url}
  );
  //chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
});

popup.addEventListener("click", function(e) {
  if(e.target && e.target.matches("#save-btn")) {
    e.preventDefault();
    var data= {};
    data.title = "";
    data.url = document.getElementById('url').value;
    data.tag = document.getElementById('tag').value;
    ext.runtime.sendMessage({ action: "perform-save", data: data }, function(response) {
      if(response && response.action === "error") {
        renderMessage("Sorry, there was an error while processing this URL.");
      }
    });
    renderMessage("Your article is in your inbox. <br/><a href='http://myorator.net'>See your entire playlist</a>.");
    setTimeout(function(){window.close()}, 5000);
  }
});

var optionsLink = document.querySelector(".js-options");
optionsLink.addEventListener("click", function(e) {
  e.preventDefault();
  ext.tabs.create({'url': ext.extension.getURL('options.html')});
})
