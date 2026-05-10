interface EditorOptions {
    /** Hides the entire side panel (code/preview) permanently. Safe to use
     *  without #code, #preview, or #sidePanel in the DOM. */
    simple?: boolean;
}
declare class Editor {
    private readonly editable;
    private readonly code;
    private readonly preview;
    private readonly sidePanel;
    private readonly wordCount;
    private undoStack;
    private redoStack;
    private abortController;
    constructor(options?: EditorOptions);
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
    private sanitizeHTML;
    private downloadHTML;
    private refreshActiveState;
    destroy(): void;
}
export { Editor };
