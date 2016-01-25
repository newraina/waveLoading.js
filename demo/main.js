"use strict";

var range   = document.querySelector('.process-passed');
var message = document.querySelector('.message');

waveLoading.init({
    showText: true,
    callback: function () {
        console.log('进度条走完啦！');
        removeClass(message, 'hide');
    }
});

waveLoading.draw();

var progress = 0;
(function loading() {
    waveLoading.setProgress(progress);
    progress += 0.2;
    range.style.width = progress * 2 + 'px';
    if (progress <= 101) {
        requestAnimationFrame(loading);
    }
})();

function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}
