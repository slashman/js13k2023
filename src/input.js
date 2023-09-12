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
var typedBuffer;
window.hordeGlobal.touch = function (key, k2) {
  pressed[key] = true;
  typedBuffer = k2;
}

window.hordeGlobal.touchEnd = function() {
  pressed['ArrowUp'] = false;
  pressed['ArrowDown'] = false;
  pressed['ArrowLeft'] = false;
  pressed['ArrowRight'] = false;
  if (typedCallbacks[typedBuffer]) typedCallbacks[typedBuffer]() ;
}

window.hordeGlobal.touchEnter = function() {
  typedCallbacks['Enter']();
}
