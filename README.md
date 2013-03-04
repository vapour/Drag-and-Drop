#Drag and Drop
模拟实现HTML5的Drag and Drop接口，兼容IE6+。并在HTML5拖动接口的基础上进行了简单封装，使接口更加易用友好。

##初始化时参数配置
<table>
        <thead>
            <th>属性</th>
            <th>描述</th>
        </thead>
        <tbody>
            <tr>
                <td>dragElement</td>
                <td>string | jquery对象, 要拖动的元素。必选</td>
            </tr>
            <tr>
                <td>dragTarget</td>
                <td>string | jquery对象, 要拖动的元素。例如我们经常需要在点击标题栏来拖动对话框。这时dragElement就是标题元素，dragTarget就是对话框元素。</td>
            </tr>

            <tr>
                <td>dropElement</td>
                <td>string | jquery对象, 拖动元素要释放的容器元素。</td>
            </tr>
            <tr>
                <td>callbacks</td>
                <td>object, 绑定拖放回调事件的对象。例如dragstart, dragend, drop等事件的回调绑定。</td>
            </tr>
            <tr>
                <td>callbacks.dragstart(ev)</td>
                <td>function，拖曳发生时触发。和mousedonw类似。</td>
            </tr>
            <tr>
                <td>callbacks.drag(ev)</td>
                <td>function，拖曳时触发，在整个拖曳过程中会触发多次。和mousemove类似。</td>
            </tr>
            <tr>
                <td>callbacks.dragenter(ev)</td>
                <td>function，拖曳进入可以释放(drop)的元素上时触发。和mouseenter类似。</td>
            </tr>
            <tr>
                <td>callbacks.dragover(ev)</td>
                <td>function，当鼠标在可以释放的元素上移动时触发。和mouseover类似。</td>
            </tr>
            <tr>
                <td>callbacks.dragleave(ev)</td>
                <td>function，当鼠标离开可以释放的元素时触发。和mouseleave类似。</td>
            </tr>
            <tr>
                <td>callbacks.drop(ev)</td>
                <td>function，当鼠标在可以释放的元素上结束拖动时触发。和mouseup类似。</td>
            </tr>
            <tr>
                <td>callbacks.dragend(ev, pos)</td>
                <td>function，在拖动结束时触发。pos参数为对象，包含了left和top两个属性，可以使用这个参数快速实现拖动。</td>
            </tr>
            <tr>
                <td>mode</td>
                <td>string，运行模式。有三种运行模式。
                    <ul style="padding:5px 0 5px 20px;">
                        <li>simulate：默认运行模式，推荐使用默认模式。在所有浏览器模拟实现HTML5的DnD接口。不使用浏览器原生的DnD接口。因为浏览器原生的DnD接口在不同的html5浏览器存在兼容性问题，不能保证统一的用户体验。要实现跨浏览器的统一用户体验，建议使用这种模式。</li>
                        <li>native：原生模式。仅在支持HTML5 DnD接口的浏览器中执行。IE6-8没有效果。</li>
                        <li>auto：自动模式。在支持DnD接口的浏览器中使用浏览器原生的DnD接口，不支持的浏览器模拟实现类似效果。这种模式现在不推荐使用，还需要完善，以后扩展使用。</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td>restrict</td>
                <td>boolean, 是否允许拖动元素移出它的定位元素(position设置成relative|absolute|fixed的元素)。默认为true不允许。</td>
            </tr>
        </tbody>
    </table>

##dataTransfer
用来在拖曳时传递数据，详情参考<a href="https://developer.mozilla.org/en-US/docs/DragDrop/DataTransfer">MDC规范</a>。在simulate模式使用对象模拟实现了dataTransfer对象，并提供了以下方法
    <table>
        <thead>
            <th>属性</th>
            <th>描述</th>
        </thead>
        <tbody>
            <tr>
                <td>setData(type, data)</td>
                <td>设置传递的数据，DnD接口data只支持字符串。在simulate模式下可以传递任何类型的数据。</td>
            </tr>
            <tr>
                <td>getData(type)</td>
                <td>获取数据。</td>
            </tr>
            <tr>
                <td>clearData(type)</td>
                <td>清空数据。如果type为空，则会清空所有数据。</td>
            </tr>
            <tr>
                <td><a href="#demo-restrict">setDragImage(img, x, y)</a></td>
                <td>拖曳时，会产生一个带边框的矩形，跟随鼠标移动。可以通过setDragImage来把矩形替换成图片。</td>
            </tr>
        </tbody>
    </table>


##代码示例
<pre><code>seajs.use('./dist/dnd.js', function (dnd) {
    dnd.enableDrag({
        dragElement: '#drag6',
        callbacks: {
            dragend: function (ev, pos) {
                $(this).css({
                    left: pos.left,
                    top: pos.top
                });
            }
        }
    });
    dnd.enableDrag({
        dragElement: '#drag7',
        restrict: false, //设置false后，就可以拖动到容器外面
        callbacks: {
            dragend: function (ev, pos) {
                $(this).css({
                    left: pos.left,
                    top: pos.top
                });
            }
        }
    });
    dnd.enableDrag({
        dragElement: '#drag8',
        restrict: false,
        callbacks: {
            dragstart: function (ev) {
                var img = document.createElement('img');
                img.src = 'img/sky.png';
 
                ev.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
            },
            dragend: function (ev, pos) {
                $(this).css({
                    left: pos.left,
                    top: pos.top
                });
            }
        }
    });
});
</code></pre>
