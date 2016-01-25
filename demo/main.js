"use strict";

var container       = document.querySelector('.container');
var canvas          = container.querySelector('canvas');
var processArea     = container.querySelector('.process');
var processPassed   = container.querySelector('.process-passed');
var message         = container.querySelector('.message');
var autoPlayControl = container.querySelector('.control');
var processControl  = container.querySelector('.process-btn');
var shade           = container.querySelector('.shade');

var progress   = 0;
var maxProcess = 101;
var step       = 0.2;
var stoped     = false;

waveLoading.init({
    showText: true,
    callback: function () {
        console.log('进度条走完啦！');
        removeClass(message, 'hide');
        stoped = true;
        addClass(shade, 'hide');
    }
});

waveLoading.draw();

autoPlayControl.addEventListener('click', autoPlay);
processControl.addEventListener('mousedown', function () {
    document.addEventListener('mousemove', handleMouseMove);
});

document.addEventListener('mouseup', function () {
    var width = parseFloat(processPassed.style.width);
    if (width > 200) {
        processPassed.style.width = 200 + 'px';
    } else if (width < 0) {
        processPassed.style.width = 0;
    }
    document.removeEventListener('mousemove', handleMouseMove, false);
});

function autoPlay() {
    if (stoped) {
        waveLoading.draw();
        stoped = false;
    }
    if (message.className.indexOf('hide') < 0) {
        addClass(message, 'hide');
    }

    // 遮罩层，防止自动演示期间的用户操作
    removeClass(shade, 'hide');

    (function loading() {
        waveLoading.setProgress(progress);
        progress += step;
        processPassed.style.width = (progress > 100 ? 100 : progress) * 2 + 'px';
        if (progress <= maxProcess) {
            requestAnimationFrame(loading);
        } else {
            progress = 0;
        }
    })();
}

function handleMouseMove() {
    if (stoped) {
        waveLoading.draw();
        stoped = false;
    }
    var evt   = arguments[0];
    var oX    = evt.clientX - getPos(processArea).x;
    var width = parseFloat(processPassed.style.width);
    width     = !!width ? width : 0;
    if (width > -1 && width <= 200) {
        processPassed.style.width = oX + 'px';
        waveLoading.setProgress(oX / 2);
    }
}

/**
 * 获取给定元素相对于窗口的距离
 * @param {HTMLElement} element
 * @returns {{x: number, y: number}}
 */
function getPos(element) {
    var pos          = {x: 0, y: 0};
    var offsetParent = element.offsetParent;
    while (offsetParent) {
        pos.x += element.offsetLeft;
        pos.y += element.offsetTop;
        element      = element.offsetParent;
        offsetParent = element.offsetParent;
    }
    return pos;
}

function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}

function addClass(el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
}
