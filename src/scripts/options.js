import ext from "./utils/ext";
import storage from "./utils/storage";
import $ from "./vendor/jquery"

var colorSelectors = document.querySelectorAll(".js-radio");

var setColor = (color) => {
  document.body.style.backgroundColor = color;
};

/*storage.get('color', function(resp) {
  var color = resp.color;
  var option;
  if(color) {
    option = document.querySelector(`.js-radio.${color}`);
    setColor(color);
  } else {
    option = colorSelectors[0]
  }

  option.setAttribute("checked", "checked");
});*/

storage.get('oratorName', function(resp){
  var name = resp.oratorName;

  var nameLabel = document.getElementById('oratorName');
  if(name)  {
    $('.authenticated').show();
    $('.unauthenticated').hide();
  }
  else{
    name = "unknown";
    $('.authenticated').hide();
    $('.unauthenticated').show();
  }

  nameLabel.innerText = name;
});

colorSelectors.forEach(function(el) {
  el.addEventListener("click", function(e) {
    var value = this.value;
    storage.set({ color: value }, function() {
      setColor(value);
    });
  })
})

document.getElementById("logout-btn").addEventListener("click",
  function (){
    ext.runtime.sendMessage({ action: "perform-logout" }, function(response) {});
    $('.authenticated').hide();
    $('.unauthenticated').show();
  }
);

document.getElementById("login-btn").addEventListener("click",
  function (){
    ext.runtime.sendMessage({ action: "perform-login" }, function(response) {
      document.getElementById('refreshPageMsg').innerText = "Refresh this page after signing in";
    });
  }
);

$(document).ready(function(){
  $('body').on('click', 'a', function(){
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
  });
});