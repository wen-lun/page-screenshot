import 'canvas-arrow'
import 'canvas-multiline'

interface StackItem {
    size: number
    color: string
    /**显示到画布上时，不必每次都要重新绘制一次 */
    cache: HTMLCanvasElement
}

interface PaintType {
    type: string
    size: number
    color: string
}

/**涂鸦绘画 */
export default class Paint {

    /**用来显示绘画的画布 */
    private canvas = document.createElement("canvas")
    /**文字工具用到 */
    private textarea = document.createElement("textarea");
    /**用来存储涂鸦的过程，使用stack.pop()可实现撤销操作 */
    private stack: Array<StackItem> = []
    private paintType?: PaintType
    private isDrag = false
    private startPoint?: { x: number, y: number }
    private isAddToBody = false
    private isShowTextarea = false
    private static FONT_FAMILY = "Arial";

    constructor(zIndex: number) {
        this.canvas.style.position = "fixed";
        this.canvas.style.zIndex = (zIndex + 100) + "";
        this.canvas.style.cursor = "crosshair";//十字线
        this.textarea.style.position = "fixed";
        this.textarea.style.zIndex = (zIndex + 200) + "";
        this.textarea.style.display = "none";
        this.textarea.style.resize = "none";
        this.textarea.style.overflow = "hidden";
        this.textarea.style.background = "transparent";
        this.textarea.style.padding = "0px";
        this.textarea.style.fontFamily = Paint.FONT_FAMILY;
        this.textarea.style.outline = "none";
        this.textarea.style.border = "2px dotted #ccc";
        this.textarea.style.lineHeight = "initial";
        this.addEventListener();
    }

    private addEventListener() {
        this.canvas.addEventListener("mousedown", this.onMousedown.bind(this));
        this.canvas.addEventListener("mousemove", this.onMousemove.bind(this));
        window.addEventListener("mouseup", this.onMouseup.bind(this));
        this.textarea.addEventListener("input", this.updateTextareaWH.bind(this));
    }

    private getStackTop() {
        return this.stack[this.stack.length - 1];
    }

    private onMousedown({ offsetX: x, offsetY: y, clientX, clientY }: MouseEvent) {
        if (!this.paintType) return;
        const { size, color, type } = this.paintType;
        const { width, height } = this.canvas;
        if (this.isShowTextarea) {//若已显示textarea，那么应隐藏它，并将其文字显示到画布
            let text = this.textarea.value;
            if (text.trim().length == 0) {
                this.stack.pop();//撤销掉
                this.showTextarea(false);
                return;
            }
            const { cache } = this.getStackTop();
            const { x, y } = this.startPoint!;

            const ctx = cache.getContext("2d")!;
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.font = `${size}px ${Paint.FONT_FAMILY}`;
            ctx.textBaseline = "top";
            ctx.fillMultilineText(text, x + 1, y + 1, width - x - 3, 3);
            ctx.restore();

            this.draw();
            this.showTextarea(false);
            return;
        }


        this.isDrag = true;
        const cache = document.createElement("canvas");
        cache.width = width;
        cache.height = height;
        this.stack.push({ cache, size, color });
        this.startPoint = { x, y };

        if ("text" == type) {//文字工具
            this.showTextarea(true);
            this.textarea.style.left = `${clientX}px`;
            this.textarea.style.top = `${clientY}px`;
            setTimeout(() => {
                this.textarea.focus();
            }, 50);
            this.isDrag = false;
        }
    }

    private onMousemove({ offsetX, offsetY }: MouseEvent) {
        let currentStackItem = this.getStackTop();
        if (this.isShowTextarea || !this.isDrag || !this.paintType || !currentStackItem || !this.startPoint) return;
        const { size, color, type } = this.paintType;
        const { width, height } = this.canvas;

        const ctx = currentStackItem.cache.getContext("2d")!;
        const { x, y } = this.startPoint;
        "brush" != type && ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.save();
        ctx.fillStyle = ctx.strokeStyle = color;
        ctx.lineWidth = size;
        if ("rect" == type) {
            ctx.rect(x, y, offsetX - x, offsetY - y);
            ctx.stroke();
        } else if ("arrow" == type) {
            let width = 3;
            if (2 == size) {
                width = 5;
            } else if (3 == size) {
                width = 7;
            }
            ctx.fillArrow(x, y, offsetX, offsetY, width);
        } else if ("brush" == type) {
            ctx.moveTo(x, y);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            this.startPoint = { x: offsetX, y: offsetY };
        } else if ("ellipse" == type) {
            const dx = Math.abs(offsetX - x);
            const dy = Math.abs(offsetY - y);
            //取x,y距离一半的最大值作为圆的直径
            const d = Math.max(dx, dy);
            ctx.save();
            ctx.scale(dx / d, dy / d);//缩放圆形成椭圆
            //计算起点坐标与终点坐标之间的中点坐标
            const mx = (x + offsetX) * 0.5 / (dx / d);
            const my = (y + offsetY) * 0.5 / (dy / d);
            ctx.arc(mx, my, d * 0.5, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.restore();//先restore,再stroke，不然椭圆的线宽不同
            ctx.stroke();
        }
        ctx.restore();

        this.draw();
    }

    private onMouseup() {
        if (this.isShowTextarea) return;
        this.isDrag = false;
    }

    /**动态更新文本框宽高 */
    private updateTextareaWH() {
        if (!this.paintType) return;
        const value = this.textarea.value;
        const { size } = this.paintType;
        if (value.length == 0) {
            this.textarea.style.width = `${size}px`;
            this.textarea.style.height = `${size + 4}px`;
        } else if (this.startPoint) {
            const ctx = this.canvas.getContext("2d")!;
            ctx.font = `${size}px ${Paint.FONT_FAMILY}`;
            const lines: Array<string> = value.split("\n") || [];
            const widths = lines.map(text => ctx.measureText(text).width);
            //防止文本框的右边超出裁剪区域            
            const width = Math.min(Math.max(...widths) + 10, this.canvas.width - this.startPoint.x - 4);
            this.textarea.style.width = `${width}px`;
            //防止文本框的下边超出裁剪区域
            const height = Math.min(this.textarea.scrollHeight, this.canvas.height - this.startPoint.y - 4);
            this.textarea.style.height = `${height}px`;
        }
    }

    private draw() {
        const ctx = this.canvas.getContext("2d")!;
        const { width, height } = this.canvas;
        ctx.clearRect(0, 0, width, height);
        this.stack.forEach(({ cache }) => {
            ctx.drawImage(cache, 0, 0);
        });
    }

    public showTextarea(show: boolean) {
        this.isShowTextarea = show;
        this.textarea.style.display = show ? "" : "none";
        this.textarea.value = "";
        if (show) this.updateTextareaWH();
    }

    public updateTextareaStatus({ size, color }: any) {
        this.textarea.style.fontSize = `${size}px`;
        this.textarea.style.color = color;
        this.textarea.focus();
        this.updateTextareaWH();
    }

    public getStackSize() {
        return this.stack.length;
    }

    public getCanvas() {
        return this.canvas;
    }

    public addToBody() {
        if (this.isAddToBody) return;
        document.body.appendChild(this.canvas);
        document.body.appendChild(this.textarea);
        this.isAddToBody = true;
    }

    public removeFromBody() {
        if (!this.isAddToBody) return;
        document.body.removeChild(this.canvas);
        document.body.removeChild(this.textarea);
        this.stack = [];
        this.draw();
        this.isAddToBody = false;
        this.showTextarea(false);
    }

    public updateCanvasPosition(l: number, t: number, w: number, h: number) {
        if (this.stack.length > 0) throw Error("stack 不为空，不能改变画布尺寸！");
        this.canvas.style.top = `${t}px`;
        this.canvas.style.left = `${l}px`;
        this.canvas.width = w;
        this.canvas.height = h;
    }

    public setPaintType(paintType?: PaintType) {
        this.paintType = paintType;
    }

    /**撤销 */
    public undo() {
        this.stack.pop();
        this.draw();
    }
}