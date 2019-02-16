<img src="https://raw.githubusercontent.com/destiny-wenlun/page-screenshot/master/img/demo.gif" width="100%"/>

# page-screenshot
> page-screenshot是一个基于html2canvas开发的一款网页屏幕截屏插件。支持用户在截图结果上进行涂鸦操作。可用于用户截图反馈。


# 安装 & 使用
+ 1.npm 模块开发：请先执行命令：npm install -S page-screenshot
```javascript
import PageScreenshot from 'page-screenshot'
import "page-screenshot/lib/page-screenshot.css";//重要

let ps = new PageScreenshot({
    ignoreElements: el => {
        return "screenshotBtn" == el.id;//截屏时，不要渲染id为screenshotBtn的按钮
    }
});
document.querySelector("#screenshotBtn").addEventListener("click", async () => {
    let res = await ps.screenshot();
    //返回结果如果是false，表示用户取消了截图，返回{dataURL,blob,canvas}，则是截图后的结果
    if(res){
        let dataURL = res.dataURL;//base64 
        let blob = res.blob;//Blob
        let canvas = res.canvas;//HTMLCanvasElement
        ...
    }
});
```

* 2.浏览器 browser：请引用dist下的page-screenshot.css和page-screenshot.js
```html
<html>
    <head>
        <link rel="stylesheet" href="dist/page-screenshot.css" />
        <script type="text/javascript" src="dist/page-screenshot.js"></script>
    </head>
    <body>
        <button id="screenshotBtn">截图</button>
        ...
        <script type="text/javascript">
            var ps = new PageScreenshot({
                ignoreElements: function (el) {
                    return "screenshotBtn" == el.id;//截屏时，不要渲染id为screenshotBtn的按钮
                }
            });
            document.querySelector("#screenshotBtn").addEventListener("click", async function () {
                var res = await ps.screenshot();
                //返回结果如果是false，表示用户取消了截图，返回{dataURL,blob,canvas}，则是截图后的结果
                if(res){
                    var dataURL = res.dataURL;//base64 
                    var blob = res.blob;//Blob
                    var canvas = res.canvas;//HTMLCanvasElement
                    ...
                }
            });
        </script>
    </body>
</html>
```

# 方法 & 参数
* 构造方法 PageScreenshot(options) 

**options:**  

|选项|说明|默认值|
|-|-|-|
|dotRadius|裁剪区域8个点的大小|3|
|borderColor|裁剪区域的边框颜色|"red"|
|saveFileName|保存的文件名字|"截图"|
|zIndex|裁剪区域的z-index|5000|
|ignoreElements|此方法会回调所有需要渲染的dom元素，若返回true，就会忽略改dom。通常应忽略“点击截屏的那个按钮”|(el)=>false|

+ screenshot()
> screenshot方法是一个异步方法，调用此方法可截屏，会返回一个Promise对象，返回值有2种，false表示用户点击了取消，若用户点击了确认，那么会返回{dataURL,blob,canvas}。其中dataURL是截图的base64，blob是图片2进制，canvas则是截图生成的HTMLCanvasElement元素。



