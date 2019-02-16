import Tool from './tool'
import Paint from './paint'
import html2canvas from 'html2canvas'
import FileSaver from 'file-saver'
import './less/page-screenshot.less'

enum EDirection {
    TOP, BOOTM, LEFT, RIGHT, LEFT_TOP, LEFT_BOTTOM, RIGHT_TOP, RIGHT_BOTTOM
}

enum ECursor {
    EW_RESIZE = "ew-resize",
    NW_RESIZE = "nw-resize",
    NE_RESIZE = "ne-resize",
    NS_RESIZE = "ns-resize",
}

interface Point {
    x: number
    y: number
    direction: EDirection
    cursor: ECursor
}

interface ClipInfo {
    x: number
    y: number
    w: number
    h: number
}

export declare interface Option {
    dotRadius?: number
    borderColor?: string
    saveFileName?: string
    zIndex?: number
    /**若返回true则该HTMLElement元素不会被渲染 */
    ignoreElements?: (el: HTMLElement) => boolean
}


export default class PageScreenshot {
    private options: Option = {
        dotRadius: 3,
        borderColor: "red",
        saveFileName: "截图",
        zIndex: 5000,
        ignoreElements: () => false
    }

    private bodyCanvas?: HTMLCanvasElement
    private loadingDom = document.createElement("div")

    private maskCanvas = document.createElement("canvas")
    private maskCtx = this.maskCanvas.getContext("2d")!
    private tools: Tool
    private paint: Paint

    private startPoint = { x: 0, y: 0 }
    private clipInfo?: ClipInfo
    /**裁剪区域的8个点 */
    private points?: Array<Point>
    private isClipDrag = false
    private isDotDrag = false
    private dotDirection?: EDirection | boolean

    constructor(options?: Option) {
        this.options = { ...this.options, ...options };
        const { zIndex } = this.options;
        this.tools = new Tool(zIndex!);
        this.paint = new Paint(zIndex!);
        this.loadingDom.className = "page-screenshot-spinner";
        this.loadingDom.style.zIndex = zIndex + "";
        this.loadingDom.setAttribute("data-html2canvas-ignore", "true");
        this.loadingDom.innerHTML = `
        <div class="spinner">
            <div class="spinner-container container1">
                <div class="circle1"></div>
                <div class="circle2"></div>
                <div class="circle3"></div>
                <div class="circle4"></div>
            </div>
            <div class="spinner-container container2">
                <div class="circle1"></div>
                <div class="circle2"></div>
                <div class="circle3"></div>
                <div class="circle4"></div>
            </div>
            <div class="spinner-container container3">
                <div class="circle1"></div>
                <div class="circle2"></div>
                <div class="circle3"></div>
                <div class="circle4"></div>
            </div>
        </div>`;
        this.initMask();
    }

    private initMask() {
        const { innerWidth, innerHeight } = window;
        this.maskCanvas.style.position = 'fixed';
        this.maskCanvas.style.top = "0px";
        this.maskCanvas.style.left = "0px";
        this.maskCanvas.style.right = "0px";
        this.maskCanvas.style.bottom = "0px";
        this.maskCanvas.style.zIndex = this.options.zIndex + "";
        this.maskCanvas.width = innerWidth;
        this.maskCanvas.height = innerHeight;
    }

    private addEventListener() {
        this.maskCanvas.addEventListener("mousedown", this.onMousedown.bind(this));
        this.maskCanvas.addEventListener("mousemove", this.onMousemove.bind(this));
        window.addEventListener("mouseup", this.onMouseup.bind(this));
        this.maskCanvas.oncontextmenu = e => {//鼠标右键
            this.end();
            return false;
        };

        this.tools.onSave(async () => {
            let { blob } = await this.drawClip();
            FileSaver.saveAs(blob, this.options.saveFileName + ".jpg");
        });

        this.tools.onUndo(() => {
            this.paint.undo();
            if (this.paint.getStackSize() == 0) {
                this.paint.removeFromBody();
                this.tools.reset();
            }
        });

        this.tools.onItemClick(item => {
            this.calculateToolsPosition();
            if (item) {
                let { size, color } = item.option!;
                this.paint.setPaintType({ size, color, type: item.type });
                this.paint.addToBody();
                if ("text" == item.type) {
                    this.paint.updateTextareaStatus(item.option);
                } else {
                    this.paint.showTextarea(false);
                }
            } else {
                if (this.paint.getStackSize() == 0) this.paint.removeFromBody();
            }
        });
    }

    private removeEventListener() {
        this.maskCanvas.removeEventListener("mousedown", this.onMousedown);
        this.maskCanvas.removeEventListener("mousemove", this.onMousemove);
        this.maskCanvas.removeEventListener("mouseup", this.onMouseup);
    }

    private onMousedown({ clientX: x, clientY: y }: MouseEvent) {
        //此时还没有生成裁剪区域
        if (!this.points) {
            this.isClipDrag = true;
            this.startPoint = { x, y };
            return;
        }

        const point = this.mouseInPoints(x, y);
        //此时裁剪区域已生成，并且鼠标移动到里八个点中某点上
        if (point) {
            this.isDotDrag = true;
            this.startPoint = { x, y };
            this.dotDirection = true == point ? point : point.direction;
            return;
        }
    }

    private onMousemove({ clientX, clientY }: MouseEvent) {
        //拖拽裁剪区域
        if (this.isClipDrag) {
            let { x, y } = this.startPoint;
            this.clipInfo = {
                x: Math.min(x, clientX),
                y: Math.min(y, clientY),
                w: Math.abs(clientX - x),
                h: Math.abs(clientY - y)
            };
            this.drawMask();
            return;
        }

        if (!this.clipInfo) return;

        const point = this.mouseInPoints(clientX, clientY);
        if (true == point) {
            //此时鼠标落在裁剪区域内部
            this.maskCanvas.style.cursor = "move";
        } else if (point && point.cursor) {
            //此时裁剪区域已生成，处理八个点
            this.maskCanvas.style.cursor = point.cursor;
        } else {
            this.maskCanvas.style.cursor = "default";
        }

        //拖拽八个点中某一点
        if (this.isDotDrag) {
            let { x, y } = this.startPoint;
            //true==1 :true
            if (true === this.dotDirection) {//平移裁剪区域
                const { w, h } = this.clipInfo;
                const { clientHeight } = document.documentElement;
                const { clientWidth } = document.documentElement;
                let dx = this.clipInfo.x + (clientX - x);
                let dy = this.clipInfo.y + (clientY - y);
                if (dx < 0) dx = 0;
                if (dy < 0) dy = 0;
                if (dx + w > clientWidth) dx = clientWidth - w;
                if (dy + h > clientHeight) dy = clientHeight - h;
                this.clipInfo.x = dx;
                this.clipInfo.y = dy;
            } else if (EDirection.LEFT_TOP == this.dotDirection) {
                this.clipInfo.x += (clientX - x);
                this.clipInfo.y += (clientY - y);
                this.clipInfo.w -= (clientX - x);
                this.clipInfo.h -= (clientY - y);
            } else if (EDirection.TOP == this.dotDirection) {
                this.clipInfo.y += (clientY - y);
                this.clipInfo.h -= (clientY - y);
            } else if (EDirection.RIGHT_TOP == this.dotDirection) {
                this.clipInfo.y += (clientY - y);
                this.clipInfo.w += (clientX - x);
                this.clipInfo.h -= (clientY - y);
            } else if (EDirection.RIGHT == this.dotDirection) {
                this.clipInfo.w += (clientX - x);
            } else if (EDirection.RIGHT_BOTTOM == this.dotDirection) {
                this.clipInfo.w += (clientX - x);
                this.clipInfo.h += (clientY - y);
            } else if (EDirection.BOOTM == this.dotDirection) {
                this.clipInfo.h += (clientY - y);
            } else if (EDirection.LEFT_BOTTOM == this.dotDirection) {
                this.clipInfo.x += (clientX - x);
                this.clipInfo.w -= (clientX - x);
                this.clipInfo.h += (clientY - y);
            } else if (EDirection.LEFT == this.dotDirection) {
                this.clipInfo.x += (clientX - x);
                this.clipInfo.w -= (clientX - x);
            }
            this.startPoint = { x: clientX, y: clientY };
            this.drawMask();
            this.calculateToolsPosition();
            return;
        }
    }

    private onMouseup() {
        if (!this.isClipDrag && !this.isDotDrag) return;
        this.isClipDrag = false;
        this.isDotDrag = false;

        //修正clipInfo的x,y,w,h
        if (this.clipInfo) {
            let { w, h } = this.clipInfo;
            if (w < 0) {
                this.clipInfo.x -= Math.abs(w);
                this.clipInfo.w = Math.abs(w);
            }
            if (h < 0) {
                this.clipInfo.y -= Math.abs(h);
                this.clipInfo.h = Math.abs(h);
            }
            this.drawMask();
            this.tools.show();
            this.calculateToolsPosition();
            this.calculatePaintPosition();
        }
    }

    /**计算tools位置 */
    private calculateToolsPosition() {
        let { x, y, w, h } = this.clipInfo!;
        const toolsSize = this.tools.size();
        const { dotRadius = 3 } = this.options;
        const { clientHeight } = document.documentElement;
        let top = y + h + dotRadius;//先显示到裁剪区下面
        let direction: "top" | "bottom" = "bottom";
        if (top + toolsSize.th + toolsSize.toh > clientHeight) {//若工具栏超出下边界
            top = y - dotRadius - toolsSize.th;//就显示到裁剪区上面
            direction = "top";
            if (top - toolsSize.toh < 0) {//工具栏超出上边界
                top = y + h - dotRadius - toolsSize.th;
            }
        }

        let left = x + w - toolsSize.width - dotRadius;//先显示裁剪区最右方
        if (left < 0) {//若工具栏超出左边界
            left = 0;//就显示在边界
        }
        this.tools.setPosition(direction, { left, top });
    }

    /**计算paint位置 */
    private calculatePaintPosition() {
        let { x, y, w, h } = this.clipInfo!;
        this.paint.updateCanvasPosition(x, y, w, h);
    }

    /**
     * 如果返回一个点，表示此时鼠标落在八个点中的某个点，如果返回true，表示鼠标此时在裁剪区域内部
     */
    private mouseInPoints(clientX: number, clientY: number): Point | boolean {
        if (!this.points) throw new Error("points为空！");
        let { dotRadius = 3 } = this.options;
        //当绘画涂鸦区存在绘画时，不允许改变裁剪区域
        if (this.clipInfo && this.paint.getStackSize() == 0) {
            let { x, y, w, h } = this.clipInfo;
            let current = this.points.find(({ x, y }) => clientX > x - dotRadius && clientX < x + dotRadius && clientY < y + dotRadius && clientY > y - dotRadius);
            if (!current) {//鼠标没有落在八个点上，判断是否在裁剪区域内部
                return clientX > x && clientX < x + w && clientY > y && clientY < y + h;
            }
            return current;
        }
        return false;
    }

    private drawMask() {
        const ctx = this.maskCtx;
        const { innerWidth, innerHeight } = window;
        const { dotRadius = 3, borderColor = "red" } = this.options;
        const background = "rgba(0,0,0,.4)";

        ctx.clearRect(0, 0, innerWidth, innerHeight);

        //外面一层遮罩
        ctx.beginPath();
        ctx.save();
        ctx.rect(0, 0, innerWidth, innerHeight);
        ctx.fillStyle = background;
        ctx.fill();
        ctx.restore();

        //裁剪区域
        if (!this.clipInfo) return;
        const { x, y, w, h } = this.clipInfo;
        ctx.beginPath();
        ctx.save();
        ctx.clearRect(x, y, w, h);
        ctx.rect(x, y, w, h);
        ctx.strokeStyle = borderColor;
        ctx.stroke();
        ctx.restore();

        this.points = [
            { direction: EDirection.LEFT_TOP, cursor: ECursor.NW_RESIZE, x, y },//左上
            { direction: EDirection.TOP, cursor: ECursor.NS_RESIZE, x: x + w * 0.5, y },//上
            { direction: EDirection.RIGHT_TOP, cursor: ECursor.NE_RESIZE, x: x + w, y },//右上
            { direction: EDirection.LEFT, cursor: ECursor.EW_RESIZE, x, y: y + h * 0.5 },//左
            { direction: EDirection.LEFT_BOTTOM, cursor: ECursor.NE_RESIZE, x, y: y + h },//左下
            { direction: EDirection.RIGHT, cursor: ECursor.EW_RESIZE, x: x + w, y: y + h * 0.5 },//右
            { direction: EDirection.BOOTM, cursor: ECursor.NS_RESIZE, x: x + w * 0.5, y: y + h },//下
            { direction: EDirection.RIGHT_BOTTOM, cursor: ECursor.NW_RESIZE, x: x + w, y: y + h },//右下
        ];
        for (let { x, y } of this.points) {
            ctx.beginPath();
            ctx.save();
            ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = borderColor;
            ctx.fill();
            ctx.restore();
        }
    }

    /**获取页面缩放比例 */
    private detectZoom() {
        let ratio = 1;
        let screen: any = window.screen;
        let ua = navigator.userAgent.toLowerCase();
        if (window.devicePixelRatio !== undefined) {
            ratio = window.devicePixelRatio;
        }
        else if (~ua.indexOf('msie')) {
            if (screen.deviceXDPI && screen.logicalXDPI) {
                ratio = screen.deviceXDPI / screen.logicalXDPI;
            }
        }
        else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
            ratio = window.outerWidth / window.innerWidth;
        }
        return ratio;
    };

    private getScrollPosition() {
        let scrollTop = 0;
        let scrollLeft = 0;
        if (document.documentElement && document.documentElement.scrollTop) {
            scrollTop = document.documentElement.scrollTop;
        } else if (document.body) {
            scrollTop = document.body.scrollTop;
        }
        if (document.documentElement && document.documentElement.scrollLeft) {
            scrollLeft = document.documentElement.scrollLeft;
        } else if (document.body) {
            scrollLeft = document.body.scrollLeft;
        }
        return { scrollTop, scrollLeft };
    }

    private async drawClip(): Promise<{ dataURL: string, blob: Blob, canvas: HTMLCanvasElement }> {
        if (!this.bodyCanvas || !this.clipInfo) throw new Error("bodyCanvas or clipInfo is not undefined");
        const clipCanvas = document.createElement("canvas");
        const { x, y, w, h } = this.clipInfo;
        const { scrollLeft, scrollTop } = this.getScrollPosition();

        let ratio = this.detectZoom();
        clipCanvas.width = w * ratio;
        clipCanvas.height = h * ratio;

        const ctx = clipCanvas.getContext("2d")!;
        ctx.beginPath();
        ctx.save();

        ctx.drawImage(this.bodyCanvas, -(x + scrollLeft) * ratio, -(y + scrollTop) * ratio);
        ctx.drawImage(this.paint.getCanvas(), 0, 0, w * ratio, h * ratio);
        ctx.restore();

        return new Promise((resolve, reject) => {
            clipCanvas.toBlob(blob => {
                if (!blob) reject("截图失败！");
                resolve({ dataURL: clipCanvas.toDataURL(), blob: blob!, canvas: clipCanvas });
            }, "image/jpeg", 0.95);
        })
    }

    private end() {
        document.body.style.userSelect = "auto";
        document.body.removeChild(this.maskCanvas);
        document.body.removeChild(this.bodyCanvas!);
        this.tools.hide();
        this.tools.removeFromBody();
        this.paint.removeFromBody();
        this.removeEventListener();
        //状态清零
        this.clipInfo = undefined;
        this.dotDirection = undefined;
        this.points = undefined;
    }

    private async generateBodySnapshot() {
        document.body.appendChild(this.loadingDom);
        const { innerHeight } = window;
        const oldHeight = document.body.style.height;
        if (document.body.offsetHeight < innerHeight) {
            document.body.style.height = `${innerHeight}px`;
        }
        let { ignoreElements } = this.options;
        this.bodyCanvas = await html2canvas(document.body, { logging: false, ignoreElements, type: 'view' });
        document.body.style.height = oldHeight;//还原body高度
        document.body.removeChild(this.loadingDom);
        if (!this.bodyCanvas) throw new Error("生成body快照失败！");
        this.bodyCanvas.style.position = "absolute";
        this.bodyCanvas.style.top = "0px";
        this.bodyCanvas.style.left = "0px";
        document.body.appendChild(this.bodyCanvas);
    }

    /**
     * 调用此方法，生成网页快照
     * 当用户点击工具栏的取消按钮时，返回Promise<false>对象，点击确认按钮时，返回Promise<{ dataURL: string, blob: Blob, canvas: HTMLCanvasElement }>对象。
     */
    public async screenshot(): Promise<{ dataURL: string, blob: Blob, canvas: HTMLCanvasElement } | false> {
        document.body.style.userSelect = "none";
        await this.generateBodySnapshot();
        this.maskCanvas.style.cursor = "crosshair";
        document.body.appendChild(this.maskCanvas);
        this.addEventListener();
        this.tools.addToBody();
        this.drawMask();

        return new Promise(resolve => {
            this.tools.onOk(async () => {
                resolve(await this.drawClip())
                this.end();
            });

            this.tools.onCancel(() => {
                resolve(false);
                this.end();
            });
        })
    }
}

(window as any).PageScreenshot = PageScreenshot;