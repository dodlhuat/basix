interface EditorOptions {
    /** Hides the entire side panel (code/preview) permanently. Safe to use
     *  without [data-editor="code"], [data-editor="preview"], or [data-editor="side-panel"] in the DOM. */
    simple?: boolean;
    /** Root container element or CSS selector. Required when using multiple editors on one page. */
    root?: string | HTMLElement;
}
/** Rich-text editor built on contenteditable with undo/redo and code/preview panels. */
declare class Editor {
    private readonly root;
    private readonly editable;
    private readonly code;
    private readonly preview;
    private readonly sidePanel;
    private readonly wordCount;
    private undoStack;
    private redoStack;
    private abortController;
    constructor(options?: EditorOptions);
    private q;
    private qAll;
    private bindToolbar;
    private bindActions;
    private bindKeyboard;
    private bindEditable;
    private bindTabs;
    private onContentChange;
    private syncViews;
    private updateWordCount;
    private saveState;
    private undo;
    private redo;
    private exec;
    private insertText;
    private insertImage;
    private toggleInlineStyle;
    private createLink;
    private formatBlock;
    private insertList;
    private setAlignment;
    private setForeColor;
    private downloadHTML;
    private refreshActiveState;
    destroy(): void;
}
export { Editor };
