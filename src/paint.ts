import 'canvas-arrow'

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
    /**用来存储涂鸦的过程，使用stack.pop()可实现撤销操作 */
    private stack: Array<StackItem> = []
    private paintType?: PaintType
    private isDrag = false
    private startPoint?: { x: number, y: number }
    private isAddToBody = false

    constructor() {
        this.canvas.style.position = "fixed";
        this.canvas.style.zIndex = "5100";
        this.addEventListener();
    }

    private addEventListener() {
        this.canvas.addEventListener("mousedown", this.onMousedown.bind(this));
        this.canvas.addEventListener("mousemove", this.onMousemove.bind(this));
        window.addEventListener("mouseup", this.onMouseup.bind(this));
    }

    private getStackTop() {
        return this.stack[this.stack.length - 1];
    }

    private onMousedown({ offsetX: x, offsetY: y }: MouseEvent) {
        if (!this.paintType) return;
        this.isDrag = true;
        const cache = document.createElement("canvas");
        const { width, height } = this.canvas;
        cache.width = width;
        cache.height = height;
        const { size, color } = this.paintType;
        this.stack.push({ cache, size, color });
        this.startPoint = { x, y };
    }

    private onMousemove({ offsetX, offsetY }: MouseEvent) {
        let currentStackItem = this.getStackTop();
        if (!this.isDrag || !this.paintType || !currentStackItem || !this.startPoint) return;
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
            ctx.drawArrow(x, y, offsetX, offsetY, width);
            ctx.fill();
        } else if ("brush" == type) {
            ctx.moveTo(x, y);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            this.startPoint = { x: offsetX, y: offsetY };
        }
        ctx.restore();

        this.draw();
    }

    private onMouseup() {
        this.isDrag = false;
    }

    private draw() {
        const ctx = this.canvas.getContext("2d")!;
        const { width, height } = this.canvas;
        ctx.clearRect(0, 0, width, height);
        this.stack.forEach(({ cache }) => {
            ctx.drawImage(cache, 0, 0);
        });
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
        this.isAddToBody = true;
    }

    public removeFromBody() {
        if (!this.isAddToBody) return;
        document.body.removeChild(this.canvas);
        this.stack = [];
        this.draw();
        this.isAddToBody = false;
    }

    public updateCanvasPosition(l: number, t: number, w: number, h: number) {
        if (this.stack.length > 0) throw Error("stack 不为空，不能改变画布尺寸！");
        this.canvas.style.top = `${t}px`;
        this.canvas.style.left = `${l}px`;
        this.canvas.width = w;
        this.canvas.height = h;
    }

    public setPaintType(type?: PaintType) {
        this.paintType = type;
    }

    /**撤销 */
    public undo() {
        this.stack.pop();
        this.draw();
    }
}