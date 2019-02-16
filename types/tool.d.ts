interface ToolItem {
    type: string;
    title?: string;
    dom: HTMLElement;
    option?: {
        size: number;
        color: string;
    };
}
/**工具栏 */
export default class Tool {
    private tools;
    private toolOption;
    /**工具栏位于在裁剪区域的那个方向 */
    private direction?;
    private children;
    private commonSizes;
    private textSizes;
    private colors;
    private currentTool?;
    private currentColor?;
    private currentSize?;
    private callbackItem?;
    private callbackOk?;
    private callbackCancel?;
    private callbackSave?;
    private callbackUndo?;
    constructor(zIndex: number);
    private initTools;
    private showToolOption;
    private hideToolOption;
    private setToolOptionPosition;
    /**状态重置 */
    reset(): void;
    addToBody(): void;
    removeFromBody(): void;
    size(): {
        width: number;
        th: number;
        toh: number;
    };
    setPosition(direction: "top" | "bottom", { top, left }: {
        top: number;
        left: number;
    }): void;
    hide(): void;
    show(): void;
    onItemClick(callback: (item?: ToolItem) => any): void;
    onOk(callback: () => any): void;
    onCancel(callback: () => any): void;
    onSave(callback: () => any): void;
    onUndo(callback: () => any): void;
}
export {};
