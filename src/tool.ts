interface ToolItem {
    type: string
    title?: string
    dom: HTMLElement
    option?: {
        size: number
        color: string
    }
}

interface ColorItem {
    color: string
    dom: HTMLElement
}

interface SizeItem {
    size: number
    dom: HTMLElement
}

enum CommonSize {
    SMALL = 1, MIDDLE = 2, LARGE = 3
}

enum TextSize {
    SMALL = 14, MIDDLE = 18, LARGE = 22
}

/**工具栏 */
export default class Tool {
    private tools = document.createElement("div")
    private toolOption = document.createElement("div")
    /**工具栏位于在裁剪区域的那个方向 */
    private direction?: "top" | "bottom"
    private children: Array<ToolItem> = [
        { type: "rect", title: "矩形工具", dom: document.createElement("div"), option: { size: CommonSize.MIDDLE, color: "black" } },
        { type: "ellipse", title: "椭圆工具", dom: document.createElement("div"), option: { size: CommonSize.MIDDLE, color: "black" } },
        { type: "arrow", title: "箭头工具", dom: document.createElement("div"), option: { size: CommonSize.MIDDLE, color: "black" } },
        { type: "brush", title: "画笔工具", dom: document.createElement("div"), option: { size: CommonSize.MIDDLE, color: "black" } },
        { type: "text", title: "文字工具", dom: document.createElement("div"), option: { size: TextSize.MIDDLE, color: "black" } },
        { type: "undo", title: "撤销", dom: document.createElement("div") },
        { type: "divider", dom: document.createElement("div") },
        { type: "save", title: "保存", dom: document.createElement("div") },
        { type: "cancel", title: "取消", dom: document.createElement("div") },
        { type: "ok", title: "确认", dom: document.createElement("div") }
    ]

    private commonSizes: Array<SizeItem> = [
        { size: CommonSize.SMALL, dom: document.createElement("div") },
        { size: CommonSize.MIDDLE, dom: document.createElement("div") },
        { size: CommonSize.LARGE, dom: document.createElement("div") },
    ]
    private textSizes: Array<SizeItem> = [
        { size: TextSize.SMALL, dom: document.createElement("div") },
        { size: TextSize.MIDDLE, dom: document.createElement("div") },
        { size: TextSize.LARGE, dom: document.createElement("div") },
    ]
    private colors: Array<ColorItem> = [
        { color: "black", dom: document.createElement("div") },
        { color: "white", dom: document.createElement("div") },
        { color: "red", dom: document.createElement("div") },
        { color: "green", dom: document.createElement("div") },
        { color: "blue", dom: document.createElement("div") },
        { color: "yellow", dom: document.createElement("div") },
        { color: "brown", dom: document.createElement("div") },
        { color: "purple", dom: document.createElement("div") },
    ]

    private currentTool?: ToolItem
    private currentColor?: ColorItem
    private currentSize?: SizeItem

    private callbackItem?: (item?: ToolItem) => any
    private callbackOk?: () => any
    private callbackCancel?: () => any
    private callbackSave?: () => any
    private callbackUndo?: () => any

    constructor(zIndex: number) {
        this.initTools(zIndex);
    }

    private initTools(zIndex: number) {
        this.tools.className = "page-screenshot-tools hide";
        this.tools.style.top = "0px";
        this.tools.style.left = "0px";
        this.tools.style.zIndex = (zIndex + 100) + "";

        //工具栏
        this.children.forEach(item => {
            const { type, title, dom, option } = item;
            if (type != 'divider') {
                dom.className = `item ${type}`;
                // dom.title = title;
                dom.innerHTML = `<i class="psfont icon-${type}"></i>`;
                dom.addEventListener("click", () => {
                    if ("ok" == type) {
                        this.callbackOk && this.callbackOk();
                        return;
                    }
                    if ("cancel" == type) {
                        this.callbackCancel && this.callbackCancel();
                        return;
                    }
                    if ("save" == type) {
                        this.callbackSave && this.callbackSave();
                        return;
                    }
                    if ("undo" == type) {
                        this.callbackUndo && this.callbackUndo();
                        return;
                    }
                    if (this.currentTool) {
                        this.currentTool.dom.className = `item ${this.currentTool.type}`;
                    }
                    if (this.currentTool !== item) {
                        dom.className = `item ${type} active`;
                        this.currentTool = item;
                        if (option) this.showToolOption(option.size, option!.color, "text" == item.type ? "text" : "common");
                        this.callbackItem && this.callbackItem(item);
                    } else {
                        this.currentTool = undefined;
                        this.hideToolOption();
                        this.callbackItem && this.callbackItem();
                    }
                });
            } else {
                dom.className = `${type}`;
            }
            this.tools.appendChild(dom);
        });

        //工具栏选项
        this.commonSizes.forEach(item => {
            const { dom } = item;
            dom.addEventListener("click", () => {
                if (this.currentSize) {
                    this.currentSize.dom.className = `size`;
                }
                dom.className = "size active";
                this.currentSize = item;
                this.currentTool!.option!.size = item.size;
                this.callbackItem && this.callbackItem(this.currentTool);
            });
            let div = document.createElement("div");
            div.style.height = `${item.size}px`;
            dom.style.display = "none";
            dom.appendChild(div);
            this.toolOption.appendChild(dom);
        });

        this.textSizes.forEach(item => {
            const { dom } = item;
            dom.addEventListener("click", () => {
                if (this.currentSize) {
                    this.currentSize.dom.className = `size`;
                }
                dom.className = "size active";
                this.currentSize = item;
                this.currentTool!.option!.size = item.size;
                this.callbackItem && this.callbackItem(this.currentTool);
            });
            dom.style.fontSize = `${item.size}px`;
            dom.style.display = "none";
            dom.innerText = "A";
            this.toolOption.appendChild(dom);
        });

        let divider = document.createElement("div");
        divider.className = "divider";
        this.toolOption.appendChild(divider);

        this.colors.forEach(item => {
            const { dom } = item;
            dom.addEventListener("click", () => {
                if (this.currentColor) {
                    this.currentColor.dom.className = `color`;
                }
                dom.className = "color active";
                this.currentColor = item;
                this.currentTool!.option!.color = item.color;
                this.callbackItem && this.callbackItem(this.currentTool);
            });
            dom.style.background = item.color;
            this.toolOption.appendChild(dom);
        });
    }

    private showToolOption(size: number, color: string, type: "common" | "text") {
        this.toolOption.className = "page-screenshot-tool-option";

        this.commonSizes.forEach(item => {
            item.dom.style.display = "";
            if ("text" == type) {
                item.dom.style.display = "none";
            } else if (size == item.size) {
                item.dom.className = "size active";
                this.currentSize = item;
            } else {
                item.dom.className = "size";
            }
        });

        this.textSizes.forEach(item => {
            item.dom.style.display = "";
            if ("common" == type) {
                item.dom.style.display = "none";
            } else if (size == item.size) {
                item.dom.className = "size active";
                this.currentSize = item;
            } else {
                item.dom.className = "size";
            }
        });

        this.colors.forEach(item => {
            if (color == item.color) {
                item.dom.className = "color active";
                this.currentColor = item;
            } else {
                item.dom.className = "color";
            }
        });
        this.setToolOptionPosition();
    }

    private hideToolOption() {
        this.toolOption.className = "page-screenshot-tool-option hide";
    }

    private setToolOptionPosition() {
        let th = this.tools.clientHeight;
        let toh = this.toolOption.clientHeight;
        let top = this.tools.offsetTop;
        if (this.direction == "bottom") {
            this.toolOption.style.top = `${th + top + 1}px`;
        } else {
            this.toolOption.style.top = `${top - toh - 1}px`;
        }
    }

    /**状态重置 */
    public reset() {
        this.hideToolOption();
        this.children.forEach(({ dom, type }) => {
            dom.className = `item ${type}`;
        });
        this.currentColor = undefined;
        this.currentSize = undefined;
        this.currentTool = undefined;
    }

    public addToBody() {
        document.body.appendChild(this.tools);
        document.body.appendChild(this.toolOption);
    }

    public removeFromBody() {
        document.body.removeChild(this.tools);
        document.body.removeChild(this.toolOption);
        this.reset();
    }

    public size() {
        let width = this.tools.clientWidth;
        let th = this.tools.offsetHeight;
        let toh = this.toolOption.clientHeight;
        return { width, th, toh };
    }

    public setPosition(direction: "top" | "bottom", { top, left }: { top: number, left: number }) {
        this.tools.style.top = `${top}px`;
        this.tools.style.left = `${left}px`;
        this.toolOption.style.left = `${left}px`;
        this.direction = direction;
        this.setToolOptionPosition();
    }

    public hide() {
        this.tools.className = "page-screenshot-tools hide";
    }

    public show() {
        this.tools.className = "page-screenshot-tools";
    }

    public onItemClick(callback: (item?: ToolItem) => any) {
        this.callbackItem = callback;
    }

    public onOk(callback: () => any) {
        this.callbackOk = callback;
    }

    public onCancel(callback: () => any) {
        this.callbackCancel = callback;
    }

    public onSave(callback: () => any) {
        this.callbackSave = callback;
    }
    public onUndo(callback: () => any) {
        this.callbackUndo = callback;
    }
}