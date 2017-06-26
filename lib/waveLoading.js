(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.waveLoading = factory());
}(this, (function () { 'use strict';

var waveLoading = function () {
    "use strict";

    var canvas, ctx;
    var timer      = null;
    var haveInited = false;
    var waveBehind, waveFront;
    var oldInitArgument;

    // 全局常量声明，初始化在init中进行
    var WIDTH, HEIGHT;
    var LINE_OFFSET, R;
    var COLOR, TEXT_COLOR, BACKGROUND_COLOR;
    var GLOBAL_ALPHA, LINE_WIDTH;
    var CALLBACK;
    var SHOW_TEXT, TEXT_SIZE, FONT_FAMILY, FONT_WEIGHT;
    var SPEED;
    var PEAK;

    /**
     * 初始化参数
     * @param {object} options
     */
    function init(options) {
        haveInited      = true;
        oldInitArgument = options;
        options         = options ? options : {};

        canvas           = options.target ? (typeof options.target === 'string' ? document.querySelector(options.target) : options.target) : document.querySelector('canvas');
        ctx              = canvas.getContext('2d');
        WIDTH            = canvas.width;
        HEIGHT           = canvas.height;
        LINE_OFFSET      = 0.5;
        R                = Math.min(WIDTH, HEIGHT) / 2;
        COLOR            = options.color ? options.color : 'rgba(40, 230, 200, 1)';
        BACKGROUND_COLOR = options.bgColor ? options.bgColor : 'white';
        GLOBAL_ALPHA     = options.alpha ? options.alpha : 1;
        LINE_WIDTH       = options.lineWidth ? options.lineWidth : 1;
        CALLBACK         = options.callback ? options.callback : function () {};
        SHOW_TEXT        = !!options.showText;
        TEXT_SIZE        = options.textSize ? options.textSize + ' ' : '16px ';
        TEXT_COLOR       = options.textColor ? options.textColor : COLOR;
        FONT_FAMILY      = options.fontFamily ? ' ' + options.fontFamily : ' Helvetica, Tahoma, Arial, STXihei, "华文细黑", "Microsoft YaHei", "微软雅黑", sans-serif';
        FONT_WEIGHT      = options.fontWeight ? options.fontWeight + ' ' : 'lighter ';
        SPEED            = options.speed ? options.speed : 1;
        PEAK             = options.peak ? options.peak : 18;

        ctx.strokeStyle = COLOR;
        ctx.lineWidth   = LINE_WIDTH;
        ctx.translate(WIDTH / 2, HEIGHT / 2);

        // 背景波浪
        waveBehind = wave({
            alpha  : 0.4,
            yOffset: -4,
            speed  : 0.07 * SPEED,
            peak   : PEAK
        });

        // 前景波浪
        waveFront = wave({
            alpha  : 1,
            yOffset: 0,
            speed  : 0.06 * SPEED,
            peak   : PEAK
        });
    }

    var progress = function () {
        var _progress = 0;

        function set(num) {
            if (num >= 0 && num <= 101) {
                _progress = num;
            }
        }

        function get() {
            return _progress;
        }

        function reset() {
            set(0);
        }

        function isCompleted() {
            return _progress >= 100;
        }

        return {
            set        : set,
            get        : get,
            reset      : reset,
            isCompleted: isCompleted
        }
    }();

    function draw() {
        if (!haveInited) {
            return;
        }

        ctx.clearRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);

        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 1;
        waveBehind.render();
        waveFront.render();
        drawText();

        if (!progress.isCompleted()) {
            timer = requestAnimationFrame(draw);
        } else {
            finalDraw();
        }
    }

    /**
     * 进度完成后的绘制
     * 接管前景波浪和背景波浪的进度控制
     * 使其快速上升填满容器然后停止动画
     */
    function finalDraw() {
        var tempProcess = progress.get();
        var MAX_PROCESS = 120;
        var STEP        = 0.8;

        (function tempLoop() {
            ctx.clearRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
            // 接管进度
            waveFront.setOffset(tempProcess);
            waveBehind.setOffset(tempProcess);
            waveFront.render();
            waveBehind.render();
            drawText();

            if (tempProcess < MAX_PROCESS) {
                tempProcess += STEP;
                timer = requestAnimationFrame(tempLoop);
            } else {
                // 下面代码会导致结束时闪一下，暂不知原因
                // 在波浪的render中，整个while循环结束时再stroke，要比每画一根线都stroke颜色要浅一些，可能与此有关，深色深浅瞬间变化
                //  ctx.arc(0, 0, R, 0, Math.PI * 2);
                //  ctx.fillStyle = COLOR;
                //  ctx.fill();
                //  ctx.stroke();
                //  drawText();

                // 重置与进度相关的属性，便于可能的再次绘制
                progress.reset();
                waveBehind.resetOffset();
                waveFront.resetOffset();
                // 执行结束时的回调函数
                CALLBACK.call(null);
            }
        })();
    }

    /**
     * 绘制进度提示字样（百分比）
     */
    function drawText() {
        if (!SHOW_TEXT) {
            return;
        }

        var THRESHOLD   = 55;
        var tempProcess = progress.get();
        tempProcess     = tempProcess > 100 ? 100 : tempProcess;
        ctx.save();
        ctx.font         = FONT_WEIGHT + TEXT_SIZE + FONT_FAMILY;
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'center';
        ctx.fillStyle    = tempProcess > THRESHOLD ? BACKGROUND_COLOR : TEXT_COLOR;
        ctx.fillText(tempProcess.toFixed(1) + '%', 0, 0);
        ctx.restore();
    }

    function dist(x1, y1, x2, y2) {
        x2 = x2 ? x2 : 0;
        y2 = y2 ? y2 : 0;
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    /**
     * 单个基础波浪动画生成函数
     */
    function wave(options) {
        options            = options ? options : {};
        var xPos           = -R;
        var yPos           = 0;
        var xStep          = 1;
        var angleStep      = 0.025;
        var angle          = 0;
        var alpha          = options.alpha ? options.alpha * GLOBAL_ALPHA : 1;
        var peak           = options.peak ? options.peak : 18;
        var yOffset        = options.yOffset ? options.yOffset : 0;
        var angleIncrement = options.speed ? options.speed : 0.06;

        var getAngle = function () {
            var count = Math.PI / 2;
            return function () {
                count += angleIncrement;
                return count;
            }
        }();

        /**
         * 偏移量处理
         */
        var offset = function () {
            var count;
            var basicOffset = 5;
            var isTrusteed  = false;
            var trusteedNum = 0;

            function calc() {
                var tempProcess = isTrusteed ? trusteedNum : progress.get();
                count           = R - (2 * R) * tempProcess / 100 + yOffset + basicOffset;
            }

            function get() {
                calc();
                return count;
            }

            function trustee(num) {
                isTrusteed  = true;
                trusteedNum = num;
            }

            function reset() {
                isTrusteed  = false;
                trusteedNum = 0;
            }

            return {
                get    : get,
                reset  : reset,
                trustee: trustee
            }
        }();

        function render() {
            ctx.save();
            ctx.globalAlpha = alpha;

            angle = getAngle();
            xPos  = -R;
            yPos  = 0;

            ctx.beginPath();

            while (xPos < R) {
                var tempOffset = offset.get();
                var yEnd       = Math.sqrt(Math.pow(R, 2) - Math.pow(xPos, 2));
                var nextXPos   = xPos + xStep;
                var nextYPos   = Math.sin(angle) * peak + tempOffset;
                var nextAngle  = angle + angleStep;

                // 解决canvas线宽（lineWidth）引起的坐标不准问题，引入LINE_OFFSET，偏移0.5个像素
                ctx.moveTo(xPos - LINE_OFFSET, yPos);
                ctx.lineTo(xPos - LINE_OFFSET, yEnd);

                xPos  = nextXPos;
                yPos  = dist(nextXPos, nextYPos) < R ? nextYPos : yEnd * (tempOffset > 0 ? 1 : -1);
                angle = nextAngle;
            }

            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        return {
            render     : render,
            setOffset  : offset.trustee,
            resetOffset: offset.reset
        }
    }

    return {
        init       : init,
        draw       : draw,
        setProgress: progress.set
    }
}();

return waveLoading;

})));
