define(function (require, exports, module) {
    var supportDnD = 'draggable' in document.createElement('span'),
        _defaults = {
            mode: 'simulate', //拖动运行模式
            restrict: true //拖动限制方式
        },
        _callbacks = {
            dragstart: function () {},
            drag: function () {},
            dragenter: function () {},
            dragleave: function () {},
            dragover: function () {},
            drop: function () {},
            dragend: function () {}
        };

    var util = {
        disableSelect: function () {
            var bd = document.body;
            cssText = document.body.style.cssText;
            bd.style.cssText = cssText + '-webkit-user-select:none;-moz-user-select:none;user-select:none;';
            bd.onselectstart = function () {
                return false;
            }
        },
        enableSelect: function () {
            var bd = document.body;
            bd.style.cssText = cssText;
            bd.onselectstart = function () {
                
            }
        }
    };
    
    var outline = (function(){
        var bw = 3,
            _image = false,
            frag = document.createDocumentFragment(),
            isSetCapture = 'setCapture' in document.documentElement,
            div = $('<div style="display:none;position:absolute;left:0;top:0;filter:alpha(opacity=20);opacity:0.2;cursor:move;z-index:8000;"><div style="border:' + bw + 'px solid #000;background-color:#fff;"></div></div>'),
            border = $(div[0].firstChild);
        
        div.appendTo(document.body);
        return {
            setDefaultIcon: function(el){
                if (_image) return;

                div.html('');
                border.appendTo(div);
                border.css({
                    width: el.outerWidth() - bw * 2 + 'px',
                    height: el.outerHeight() - bw * 2 + 'px'
                });
                div.show();
                this.setCapture();
            },
            setDragImage: function (ev, img, x, y) {
                _image = true;
                x = ev.offsetX - x;
                y = ev.offsetY - y;
                $(img).css({
                    'position': 'relative',
                    'left': x,
                    'top': y
                });
                frag.appendChild(border[0]);
                div.html('');
                div[0].appendChild(img);

                div.show();
                this.setCapture();
            },
            setPosition: function(offset, options){
                offset = dragAndDrop.verifyBoundary(offset, options);
                div.css({
                    left: offset.left + 'px',
                    top: offset.top + 'px'
                });
                
            },
            hide: function(options){
                var offset;
                this.releaseCapture();
                if (options && !options._drop && options.dropElement) {
                    offset = options.dragTarget.offset();
                    div.animate(offset, {
                        duration: 400,
                        complete: function () {
                            div.hide();
                        }
                    });
                } else {
                    div.hide();
                }
                _image = false;
            },
            setCapture: function () {
                //解决ie，快速拖动或者移出边界后或者移动到iframe上，无法捕获事件的bug
                isSetCapture && div[0].setCapture();
            },
            releaseCapture: function () {
                isSetCapture && div[0].releaseCapture();
            }
        }; 
    })();

    var dragAndDrop = {
        init: function (options, isSimulate) {
            options = $.extend({}, _defaults, options);
            options.callbacks = $.extend({}, _callbacks, options.callbacks);

            options.dragElement = $(options.dragElement);
            options.dragTarget = $(options.dragTarget);
            options.dropElement = $(options.dropElement);
            if (options.dragElement.length === 0 ) return;
            if (options.dragTarget.length === 0 ) {
                options.dragTarget = options.dragElement;
            }
            if (options.dropElement.length === 0) {
                options.dropElement = null;
            }

            dragAndDrop.adapterMode(options);
        },
        adapterMode: function (options) {
            switch (options.mode) {
                case 'native':
                    options.dragElement.attr('draggable', 'true');
                    supportDnD && this.nativeDnD(options);
                    break;
                case 'auto':
                    options.dragElement.attr('draggable', 'true');
                    if (supportDnD) {
                        this.nativeDnD(options);
                    } else {
                        this.simulateDnD(options);
                    }
                    break;
                default: //默认运行模式 'simulate'
                    this.simulateDnD(options);
                    break;
            }
        },
        nativeDnD: function (options) { //原生HTML5 DnD接口
            var self = this,
                callbacks = options.callbacks,
                elDrag = options.dragElement[0],
                elDrop;

            if (options.dropElement) {
                elDrop = options.dropElement[0];
            }

            options.dragElement.on('dragstart', function (ev) {
                //记录初始鼠标相对拖动元素的相对位置
                options.offset = {
                    left: ev.originalEvent.offsetX,
                    top: ev.originalEvent.offsetY
                };
                self.fixEvent(ev, options);
                callbacks.dragstart.call(elDrag, ev);
            }).on('drag', function (ev) {
                self.fixEvent(ev, options);
                callbacks.drag.call(elDrag, ev);
            }).on('dragend', function (ev) {
                self.fixEvent(ev, options);
                callbacks.dragend.call(elDrag, ev);
            });

            if (options.dropElement) {
                options.dropElement.on('dragenter', function (ev) {
                    self.fixEvent(ev, options);
                    callbacks.dragenter.call(elDrop, ev);
                }).on('dragover', function (ev) {
                    self.fixEvent(ev, options);
                    ev.preventDefault && ev.preventDefault();
                    callbacks.dragover.call(elDrop, ev);
                }).on('dragleave', function (ev) {
                    self.fixEvent(ev, options);
                    callbacks.dragleave.call(elDrop, ev);
                }).on('drop', function (ev) {
                    self.fixEvent(ev, options);
                    ev.stopPropagation && ev.stopPropagation();
                    ev.preventDefault && ev.preventDefault();
                    callbacks.drop.call(elDrop, ev);

                    return false;
                });
            }
        },
        fixEvent: function (ev, options) { //jQuery 暂时不支持dataTransfer
            ev.dataTransfer = ev.originalEvent.dataTransfer;
            //在html5的原生DnD事件中，jQuery.event对象没有鼠标位置属性
            if (supportDnD) {
                ev.clientX = ev.originalEvent.clientX;
                ev.clientY = ev.originalEvent.clientY;
            }
        }
    };

    //if (!!supportDnD) {
        $.extend(dragAndDrop, {
            simulateDnD: function(options) { //模拟HTML5 DnD接口
                var self = this;

                options.draggable = false; //标识是否正在拖动
                options._mouseenter = false; //模拟mouseenter和mouseleave时用到
                options.offset = {left:0, top:0}; //鼠标相对拖动目标的坐标
                options._offsetParent = options.dragTarget.offsetParent(); //拖动元素的定位元素

                options.dragElement.mousedown(function(ev){
                    self.fixEvent(ev, options);
                    self.startDrag(ev, options);
                    ev.preventDefault();
                });
                $(document).mouseup(function(ev){
                    if (!options.draggable) return;
                    self.fixEvent(ev, options);
                    self.stopDrag(ev, options);
                }).mousemove(function(ev){
                    if (!options.draggable) return;
                    self.fixEvent(ev, options);

                    if (ev.which > 0) { //判断当前鼠标状态
                        self.tween(ev, options);
                        self.simulateEvents(ev, options);
                    } else {
                        self.stopDrag(ev, options);
                    }
                });
            },
            createDataTransfer: function (ev) { //模拟dataTransfer对象
                return {
                    _data: {},
                    setData: function (type, data) {
                        this._data[type] = data;
                    },
                    getData: function (type) {
                        return this._data[type];
                    },
                    clearData: function (type) {
                        type = '' + type;
                        if (type) {
                            delete this._data[type];
                        } else {
                            this._data = {};
                        }
                    },
                    setDragImage: function (img, x, y) {
                        x = parseInt(x, 10) || 0;
                        y = parseInt(y, 10) || 0;

                        outline.setDragImage(ev, img, x, y);
                    }
                };
            },
            isPointInElement: function (ev, options) { //模拟实现document.elementFromPoint
                var ret = false,
                    doc = $(document),
                    mx = ev.clientX,
                    my = ev.clientY,
                    el = options.dropElement,
                    offset = el.offset(),
                    w = el.outerWidth(),
                    h = el.outerHeight(),
                    rx = mx + doc.scrollLeft() - offset.left,
                    ry = my + doc.scrollTop() - offset.top;

                // return document.elementFromPoint(x, y) === el;
                // IE中获取到的是当前(x,y)上z-index最大的元素

                if (rx > 0 && ry > 0 && rx < w && ry < h) {
                    ret = true;
                }

                return ret;
            },
            simulateEvents: function (ev, options) { //模拟事件
                this.simulateDrag(ev, options);

                if (!options.dropElement) return;
                if (this.isPointInElement(ev, options)) {
                    if (options._mouseenter == false) {
                        options._mouseenter = true;
                        this.simulateDragEnter(ev, options);        
                    }
                    this.simulateDragOver(ev, options);
                } else {
                    if (options._mouseenter == true) {
                        options._mouseenter = false;
                        this.simulateDragLeave(ev, options);
                    }
                }

            },
            simulateDragStart: function (ev, options) {
                options._drop = false;
                ev.dataTransfer = options.dataTransfer = this.createDataTransfer(ev);
                options.callbacks.dragstart.call(options.dragTarget[0], ev);
            },
            simulateDrag: function (ev, options) {
                ev.dataTransfer = options.dataTransfer;
                options.callbacks.drag.call(options.dragTarget[0], ev);
            },
            simulateDragEnter: function (ev, options) {
                ev.dataTransfer = options.dataTransfer;
                options.callbacks.dragenter.call(options.dropElement[0], ev);
            },
            simulateDragOver: function (ev, options) {
                ev.dataTransfer = options.dataTransfer;
                options.callbacks.dragover.call(options.dropElement[0], ev);
            },
            simulateDragLeave: function (ev, options) {
                ev.dataTransfer = options.dataTransfer;
                options.callbacks.dragleave.call(options.dropElement[0], ev);
            },
            simulateDrop: function (ev, options) {
                options._drop = true;
                ev.dataTransfer = options.dataTransfer;
                ev.stopPropagation && ev.stopPropagation();
                options.callbacks.drop.call(options.dropElement[0], ev);
            },
            simulateDragEnd: function (ev, options) {
                var offset = options.offset,
                    rel = options._offsetParent.offset();
                    pos = this.verifyBoundary({
                        width: offset.width,
                        height: offset.height,
                        left: ev.clientX - offset.left,
                        top: ev.clientY - offset.top
                    }, options);


                ev.dataTransfer = options.dataTransfer;
                //firefox 不支持offsetX和offsetY
                if (ev.offsetX === undefined) {
                    ev.offsetX = offset.left;
                    ev.offsetY = offset.top;
                }
                /*
                 * 有些情况下没有引入reset.css。body有margin值，影响定位计算
                 */
                if (options._offsetParent[0].tagName.toLowerCase() === 'body') {
                    rel.left = 0;
                    rel.top = 0;
                }
                pos.left = pos.left - rel.left - this.getBorderWidth(options._offsetParent, 'left');
                pos.top = pos.top - rel.top - this.getBorderWidth(options._offsetParent, 'top');
                options.callbacks.dragend.call(options.dragTarget[0], ev, pos);
            },
            startDrag: function (ev, options) {
                options.offset = this.getOffset(ev, options);
                options.draggable = true;
                this.simulateDragStart(ev, options);

                outline.setPosition({
                    width: options.offset.width,
                    height: options.offset.height,
                    left: ev.clientX - options.offset.left,
                    top: ev.clientY - options.offset.top
                }, options);
                outline.setDefaultIcon(options.dragTarget);  
            },
            getOffset: function (ev, options) { //获取偏移
                var el = options.dragTarget,
                    o = el.offset(),
                    ret = {
                        width: el.outerWidth(),
                        height: el.outerHeight()
                    };

                ret.left = ev.clientX - o.left;
                ret.top = ev.clientY - o.top;
                return ret;
            },
            tween: function(ev, options){ //过渡效果
                var offset = options.offset;
                outline.setPosition({
                    width: offset.width,
                    height: offset.height,
                    left: ev.clientX - offset.left,
                    top: ev.clientY - offset.top
                }, options);
            },
            stopDrag: function(ev, options){
                if (options.dropElement && this.isPointInElement(ev, options)) {
                    this.simulateDrop(ev, options);
                }

                if (options._mouseenter) {
                    options._mouseenter = false;
                    this.simulateDragLeave(ev, options);
                }
                this.simulateDragEnd(ev, options);
                
                outline.hide(options);
                options.draggable = false;

            },
            getBorderWidth: function (el, direction) {
                return parseInt(el.css('border-' + direction + '-width'), 10) || 0;
            },
            verifyBoundary: function (offset, options) {
                var rel = options._offsetParent,
                    _width, _height, _top, _left, _right, _bottom, _offset;

                if (options.restrict && rel[0].tagName.toLowerCase() !== 'body') {
                    _offset = rel.offset();
                    _width = rel.outerWidth();
                    _height = rel.outerHeight();
                    _top = _offset.top + this.getBorderWidth(rel, 'top');
                    _left = _offset.left + this.getBorderWidth(rel, 'left');
                    _right = _offset.left + _width - offset.width - this.getBorderWidth(rel, 'right');
                    _bottom = _offset.top + _height - offset.height - this.getBorderWidth(rel, 'bottom');
                } else {
                    _width = $(window).width();
                    _height = $(window).height();
                    _top = $(window).scrollTop();
                    _left = $(window).scrollLeft();
                    _right = _width + _left - offset.width;
                    _bottom = _height + _top - offset.height;
                }
                                        
                offset.left = offset.left >= _left ? offset.left : _left;
                offset.left = offset.left <= _right ? offset.left : _right;
                offset.top = offset.top >= _top ? offset.top : _top;
                offset.top = offset.top <= _bottom ? offset.top : _bottom;
                
                return offset;
            }
        });
    //}


    module.exports = {
        enableDrag: function (options) {
            dragAndDrop.init(options);
        }
    };
});
