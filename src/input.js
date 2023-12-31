var pressed = {};
var typedCallbacks = {};
function keyPress(e){
  if (typedCallbacks[e.key]){
    typedCallbacks[e.key]();
  }
}
window.onkeydown = e => pressed[e.key] = true;
window.onkeyup = e => pressed[e.key] = false;
window.addEventListener("keypress", keyPress);
window.addEventListener("keydown", e => {if(e.key.indexOf("Arrow") === 0) e.preventDefault();});
function isDown(keyCode){
  return pressed[keyCode];
};
function typed(keyCode, callback){
  typedCallbacks[keyCode] = callback;
}

module.exports = {
    isDown, typed
}

window.hordeGlobal = {};
window.hordeGlobal.touch = function (key) {
  pressed[key] = true;
}

window.hordeGlobal.touchEnd = function() {
  pressed['ArrowUp'] = false;
  pressed['ArrowDown'] = false;
  pressed['ArrowLeft'] = false;
  pressed['ArrowRight'] = false;
}

window.hordeGlobal.touchEnter = function() {
  typedCallbacks['Enter']();
}

// http://www.javascriptkit.com/javatutors/touchevents2.shtml
function swipedetect(el, callback){
  var touchsurface = el,
  swipedir,
  startX,
  startY,
  distX,
  distY,
  threshold = 50, //required min distance traveled to be considered swipe
  restraint = 100, // maximum distance allowed at the same time in perpendicular direction
  allowedTime = 500, // maximum time allowed to travel that distance
  elapsedTime,
  startTime,
  handleswipe = callback || function(swipedir){}

  touchsurface.addEventListener('touchstart', function(e){
      var touchobj = e.changedTouches[0]
      swipedir = 'none'
      dist = 0
      startX = touchobj.pageX
      startY = touchobj.pageY
      startTime = new Date().getTime() // record time when finger first makes contact with surface
      e.preventDefault()
  }, false)

  touchsurface.addEventListener('touchmove', function(e){
      e.preventDefault() // prevent scrolling when inside DIV
  }, false)

  touchsurface.addEventListener('touchend', function(e){
      var touchobj = e.changedTouches[0]
      distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
      distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
      elapsedTime = new Date().getTime() - startTime // get time elapsed
      if (elapsedTime <= allowedTime){ // first condition for awipe met
          if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
              swipedir = (distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
          }
          else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
              swipedir = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
          }
      }
      handleswipe(swipedir)
      e.preventDefault()
  }, false)
}

var el = document.getElementById('game')
swipedetect(el, function(swipedir){
  pressed['ArrowUp'] = false;
  pressed['ArrowDown'] = false;
  pressed['ArrowLeft'] = false;
  pressed['ArrowRight'] = false;
  switch (swipedir) {
    case 'left': pressed['ArrowLeft'] = true; break;
    case 'right': pressed['ArrowRight'] = true; break;
    case 'up': pressed['ArrowUp'] = true; break;
    case 'down': pressed['ArrowDown'] = true; break;
  }
})