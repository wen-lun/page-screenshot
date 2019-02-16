import 'canvas-arrow';
import 'canvas-multiline';
interface PaintType {
    type: string;
    size: number;
    color: string;
}
/**涂鸦绘画 */
export default class Paint {
    /**用来显示绘画的画布 */
    private canvas;
    /**文字工具用到 */
    private textarea;
    /**用来存储涂鸦的过程，使用stack.pop()可实现撤销操作 */
    private stack;
    private paintType?;
    private isDrag;
    private startPoint?;
    private isAddToBody;
    private isShowTextarea;
    private static FONT_FAMILY;
    constructor(zIndex: number);
    private addEventListener;
    private getStackTop;
    private onMousedown;
    private onMousemove;
    private onMouseup;
    /**动态更新文本框宽高 */
    private updateTextareaWH;
    private draw;
    showTextarea(show: boolean): void;
    updateTextareaStatus({ size, color }: any): void;
    getStackSize(): number;
    getCanvas(): HTMLCanvasElement;
    addToBody(): void;
    removeFromBody(): void;
    updateCanvasPosition(l: number, t: number, w: number, h: number): void;
    setPaintType(paintType?: PaintType): void;
    /**撤销 */
    undo(): void;
}
export {};
