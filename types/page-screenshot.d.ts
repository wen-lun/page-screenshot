import './less/page-screenshot.less';
export declare interface Option {
    dotRadius?: number;
    borderColor?: string;
    saveFileName?: string;
    zIndex?: number;
    /**若返回true则该HTMLElement元素不会被渲染 */
    ignoreElements?: (el: HTMLElement) => boolean;
}
export default class PageScreenshot {
    private options;
    private bodyCanvas?;
    private loadingDom;
    private maskCanvas;
    private maskCtx;
    private tools;
    private paint;
    private startPoint;
    private clipInfo?;
    /**裁剪区域的8个点 */
    private points?;
    private isClipDrag;
    private isDotDrag;
    private dotDirection?;
    constructor(options?: Option);
    private initMask;
    private addEventListener;
    private removeEventListener;
    private onMousedown;
    private onMousemove;
    private onMouseup;
    /**计算tools位置 */
    private calculateToolsPosition;
    /**计算paint位置 */
    private calculatePaintPosition;
    /**
     * 如果返回一个点，表示此时鼠标落在八个点中的某个点，如果返回true，表示鼠标此时在裁剪区域内部
     */
    private mouseInPoints;
    private drawMask;
    /**获取页面缩放比例 */
    private detectZoom;
    private getScrollPosition;
    private drawClip;
    private end;
    private generateBodySnapshot;
    /**
     * 调用此方法，生成网页快照
     * 当用户点击工具栏的取消按钮时，返回Promise<false>对象，点击确认按钮时，返回Promise<{ dataURL: string, blob: Blob, canvas: HTMLCanvasElement }>对象。
     */
    screenshot(): Promise<{
        dataURL: string;
        blob: Blob;
        canvas: HTMLCanvasElement;
    } | false>;
}
