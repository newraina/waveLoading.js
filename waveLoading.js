/**
 * setRenderTarget: 指定canvas元素，参数可以是选择器或者元素本身，如果未设定，会从文档中选择第一个canvas元素作为绘制目标
 * draw： 开始绘制动画
 * @type {{setRenderTarget, draw}}
 */
var waveLoading = function () {
    "use strict";

    var canvas, ctx;
    var timer      = null;
    var haveInited = false;

    // 全局常量声明，初始化在init中进行
    var WIDTH, HEIGHT;
    var R_OFFSET, R;
    var COLOR, TEXT_COLOR, BACKGROUND_COLOR;
    var GLOBAL_ALPHA, LINE_WIDTH;
    var CALLBACK;
    var SHOW_TEXT;

    function init(options) {
        haveInited = true;
        options    = options ? options : {};

        canvas           = options.target ? (typeof options.target === 'string' ? document.querySelector(options.target) : options.target) : document.querySelector('canvas');
        ctx              = canvas.getContext('2d');
        WIDTH            = canvas.width;
        HEIGHT           = canvas.height;
        R_OFFSET         = 0.5;
        R                = Math.min(WIDTH, HEIGHT) / 2 - R_OFFSET;
        COLOR            = options.color ? options.color : 'rgba(40, 230, 200, 1)';
        GLOBAL_ALPHA     = options.alpha ? options.alpha : 1;
        LINE_WIDTH       = options.lineWidth ? options.lineWidth : 1;
        TEXT_COLOR       = options.textColor ? options.textColor : COLOR;
        BACKGROUND_COLOR = options.bgColor ? options.bgColor : 'white';
        CALLBACK         = options.callback ? options.callback : function () {
        };
        SHOW_TEXT        = !!options.showText;

        ctx.strokeStyle = COLOR;
        ctx.lineWidth   = LINE_WIDTH;
        ctx.translate(WIDTH / 2, HEIGHT / 2);
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

        function isCompleted() {
            return _progress >= 100;
        }

        return {
            set        : set,
            get        : get,
            isCompleted: isCompleted
        }
    }();

    // 背景波浪
    var waveBehind = wave({
        alpha  : 0.4,
        yOffset: -4,
        speed  : 0.07
    });

    // 前景波浪
    var waveFront = wave({
        alpha  : 1,
        yOffset: 0,
        speed  : 0.06
    });

    function draw() {
        if (!haveInited) {
            return;
        }

        ctx.clearRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);

        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = LINE_WIDTH;
        waveBehind.render();
        waveFront.render();
        drawText();

        if (!progress.isCompleted()) {
            timer = requestAnimationFrame(draw);
        } else {
            finalDraw();
        }
    }

    function finalDraw() {
        /*
         * 进度完成后的绘制
         * 接管前景波浪和背景波浪的进度控制
         * 使其快速上升填满容器然后停止动画
         */
        var tempProcess = progress.get();
        var MAX_PROCESS = 120;
        var STEP        = 0.8;

        (function tempLoop() {
            ctx.clearRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
            waveFront.setOffset(tempProcess);
            waveBehind.setOffset(tempProcess);
            waveFront.render();
            waveBehind.render();
            drawText();

            if (tempProcess < MAX_PROCESS) {
                tempProcess += STEP;
                timer = requestAnimationFrame(tempLoop);
            } else {
                ctx.arc(0, 0, R, 0, Math.PI * 2);
                ctx.fillStyle = COLOR;
                ctx.fill();
                drawText();

                // 执行结束时的回调函数
                CALLBACK.call(null);
            }
        })()
    }

    function drawText() {
        /**
         * 绘制进度提示字样（百分比）
         */
        if (!SHOW_TEXT) {
            return;
        }

        var THRESHOLD   = 55;
        var tempProcess = progress.get();
        tempProcess     = tempProcess > 100 ? 100 : tempProcess;
        ctx.save();
        ctx.font         = 'lighter 16px Helvetica, Tahoma, Arial, STXihei, "华文细黑", "Microsoft YaHei", "微软雅黑", sans-serif';
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

    function wave(options) {
        /**
         * 单个基础波浪动画生成函数
         * @type {{}}
         */
        options = options ? options : {};
        var alpha          = options.alpha ? options.alpha : GLOBAL_ALPHA,
            xPos           = -100,
            yPos           = 0,
            xStep          = 1,
            angleStep      = 0.025,
            peak           = options.peak ? options.peak : 18, // 正弦波峰值
            angle,
            yOffset        = options.yOffset ? options.yOffset : 0,
            angleIncrement = options.speed ? options.speed : 0.06;

        var getAngle = function () {
            var count = Math.PI / 2;
            return function () {
                count += angleIncrement;
                return count;
            }
        }();

        var offset = function () {
            /*
             * 偏移量处理
             *
             */
            var count;
            var completed   = false;
            var basicOffset = 5;
            var isTrusteed  = false;
            var trusteedNum = 0;

            function calc() {
                var tempProcess = isTrusteed ? trusteedNum : progress.get();

                count = R - (2 * R) * tempProcess / 100 + yOffset + basicOffset;
                if (count >= 100) {
                    completed = true;
                }
            }

            function get() {
                calc();
                return count;
            }

            function trustee(num) {
                isTrusteed  = true;
                trusteedNum = num;
            }

            return {
                get    : get,
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

                ctx.moveTo(xPos, yPos);
                ctx.lineTo(xPos, yEnd);

                xPos  = nextXPos;
                yPos  = dist(nextXPos, nextYPos) < R ? nextYPos : yEnd * (tempOffset > 0 ? 1 : -1);
                angle = nextAngle;
            }

            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        return {
            render   : render,
            setOffset: offset.trustee
        }
    }

    return {
        init       : init,
        draw       : draw,
        setProgress: progress.set
    }
}();
