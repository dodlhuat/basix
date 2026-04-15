interface EditorOptions {
    /** Hides the entire side panel (code/preview) permanently. Safe to use
     *  without #code, #preview, or #sidePanel in the DOM. */
    simple?: boolean;
}

class Editor {
    private readonly editable: HTMLElement;
    private readonly code: HTMLTextAreaElement | null;
    private readonly preview: HTMLElement | null;
    private readonly sidePanel: HTMLElement | null;
    private readonly wordCount: HTMLElement | null;
    private undoStack: string[] = [];
    private redoStack: string[] = [];
    private abortController = new AbortController();

    constructor(options: EditorOptions = {}) {
        const editable = document.getElementById('editable');

        if (!editable) {
            throw new Error('Editor: #editable element not found');
        }

        this.editable  = editable;
        this.wordCount = document.getElementById('wordCount');

        if (options.simple) {
            this.code      = null;
            this.preview   = null;
            this.sidePanel = document.getElementById('sidePanel');
            this.sidePanel?.classList.add('hidden');
        } else {
            const code      = document.getElementById('code') as HTMLTextAreaElement;
            const preview   = document.getElementById('preview');
            const sidePanel = document.getElementById('sidePanel');

            if (!code || !preview || !sidePanel) {
                throw new Error('Editor: #code, #preview and #sidePanel are required unless simple: true');
            }

            this.code      = code;
            this.preview   = preview;
            this.sidePanel = sidePanel;
            this.sidePanel.classList.add('hidden');
        }

        this.bindToolbar();
        this.bindActions();
        this.bindKeyboard();
        this.bindEditable();
        this.bindTabs();
        this.syncViews();
        this.saveState();
    }

    private bindToolbar(): void {
        const sig = { signal: this.abortController.signal };
        document.querySelectorAll<HTMLElement>('[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd!;
                const val = btn.dataset.value ?? null;
                this.exec(cmd, val);
                this.editable.focus();
            }, sig);
        });
    }

    private bindActions(): void {
        const sig = { signal: this.abortController.signal };
        document.getElementById('linkBtn')?.addEventListener('click', () => {
            const url = prompt('Enter URL:', 'https://');
            if (url) this.exec('createLink', url);
        }, sig);

        const imageFile = document.getElementById('imageFile') as HTMLInputElement;
        document.getElementById('imageBtn')?.addEventListener('click', () => imageFile.click(), sig);
        imageFile?.addEventListener('change', () => {
            const file = imageFile.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    this.insertImage(reader.result);
                }
            };
            reader.readAsDataURL(file);
            imageFile.value = '';
        }, sig);

        document.getElementById('cleanBtn')?.addEventListener('click', () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const text = range.toString();
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            this.onContentChange();
        }, sig);

        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo(), sig);
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo(), sig);

        document.getElementById('toggleCodeBtn')?.addEventListener('click', () => {
            this.sidePanel?.classList.toggle('hidden');
            this.syncViews();
        }, sig);

        // Code action buttons — matched by position within .code-actions
        if (this.code) {
            const code = this.code;
            const codeActions = document.querySelectorAll<HTMLButtonElement>('.code-actions button');
            codeActions[0]?.addEventListener('click', () => {
                this.editable.innerHTML = this.sanitizeHTML(code.value);
                this.onContentChange();
            }, sig);
            codeActions[1]?.addEventListener('click', () => {
                code.value = this.sanitizeHTML(code.value);
                this.editable.innerHTML = code.value;
                this.onContentChange();
            }, sig);
            codeActions[2]?.addEventListener('click', () => {
                code.value = code.value
                    .replace(/\n/g, '')
                    .replace(/>\s+</g, '><')
                    .trim();
            }, sig);
        }

        const saveBtn = document.getElementById('saveBtn');
        saveBtn?.addEventListener('click', () => this.downloadHTML(), sig);

        document.getElementById('clearBtn')?.addEventListener('click', () => {
            if (confirm('Clear all content?')) {
                this.editable.innerHTML = '';
                this.onContentChange();
            }
        }, sig);
    }

    private bindKeyboard(): void {
        const saveBtn = document.getElementById('saveBtn');

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            const key = e.key.toLowerCase();

            if (key === 'b') { e.preventDefault(); this.exec('bold'); }
            else if (key === 'i') { e.preventDefault(); this.exec('italic'); }
            else if (key === 'u') { e.preventDefault(); this.exec('underline'); }
            else if (key === 'k') {
                e.preventDefault();
                const url = prompt('Enter URL:', 'https://');
                if (url) this.exec('createLink', url);
            }
            else if (key === 's') { e.preventDefault(); saveBtn?.click(); }
            else if (key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
            else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); }
        }, { signal: this.abortController.signal });
    }

    private bindEditable(): void {
        const sig = { signal: this.abortController.signal };
        this.editable.addEventListener('input', () => this.onContentChange(), sig);

        this.editable.addEventListener('paste', (e: ClipboardEvent) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') ?? '';
            this.insertText(text);
        }, sig);

        this.editable.addEventListener('keyup', () => this.refreshActiveState(), sig);
        this.editable.addEventListener('mouseup', () => this.refreshActiveState(), sig);
    }

    private bindTabs(): void {
        const sig = { signal: this.abortController.signal };
        document.querySelectorAll<HTMLElement>('.side-tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab!;

                document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(targetId)?.classList.add('active');
            }, sig);
        });
    }

    private onContentChange(): void {
        this.saveState();
        this.syncViews();
    }

    private syncViews(): void {
        if (this.code)    this.code.value          = this.editable.innerHTML.trim();
        if (this.preview) this.preview.innerHTML   = this.sanitizeHTML(this.editable.innerHTML);
        this.updateWordCount();
    }

    private updateWordCount(): void {
        if (!this.wordCount) return;
        const text = this.editable.innerText || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const count = words.length;
        this.wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    }

    private saveState(): void {
        this.undoStack.push(this.editable.innerHTML);
        if (this.undoStack.length > 100) this.undoStack.shift();
        this.redoStack = [];
    }

    private undo(): void {
        if (this.undoStack.length <= 1) return;
        this.redoStack.push(this.undoStack.pop()!);
        this.editable.innerHTML = this.undoStack[this.undoStack.length - 1];
        this.syncViews();
    }

    private redo(): void {
        if (this.redoStack.length === 0) return;
        const state = this.redoStack.pop()!;
        this.undoStack.push(state);
        this.editable.innerHTML = state;
        this.syncViews();
    }

    private exec(command: string, value: string | null = null): void {
        switch (command) {
            case 'bold': this.toggleInlineStyle('strong'); break;
            case 'italic': this.toggleInlineStyle('em'); break;
            case 'underline': this.toggleInlineStyle('u'); break;
            case 'strikeThrough': this.toggleInlineStyle('s'); break;
            case 'createLink': if (value) this.createLink(value); break;
            case 'formatBlock': if (value) this.formatBlock(value); break;
            case 'insertUnorderedList': this.insertList('ul'); break;
            case 'insertOrderedList': this.insertList('ol'); break;
            case 'justifyLeft':
            case 'justifyCenter':
            case 'justifyRight': this.setAlignment(command); break;
            case 'foreColor': if (value) this.setForeColor(value); break;
        }
    }

    private insertText(text: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        this.onContentChange();
    }

    private insertImage(dataUrl: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.maxWidth = '100%';
        range.deleteContents();
        range.insertNode(img);

        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        this.onContentChange();
    }

    private toggleInlineStyle(tagName: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let current: HTMLElement | null = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as HTMLElement;

        let wrapper: HTMLElement | null = null;
        while (current && current !== this.editable) {
            if (current.tagName === tagName.toUpperCase()) {
                wrapper = current;
                break;
            }
            current = current.parentElement;
        }

        if (wrapper) {
            const parent = wrapper.parentNode;
            while (wrapper.firstChild) {
                parent?.insertBefore(wrapper.firstChild, wrapper);
            }
            parent?.removeChild(wrapper);
        } else {
            const contents = range.extractContents();
            const el = document.createElement(tagName);
            el.appendChild(contents);
            range.insertNode(el);
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        this.onContentChange();
    }

    private createLink(url: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const contents = range.extractContents();
        const link = document.createElement('a');
        link.href = url;
        link.appendChild(contents);
        range.insertNode(link);

        this.onContentChange();
    }

    private formatBlock(tag: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let blockElement: HTMLElement | null = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as HTMLElement;

        while (blockElement && blockElement !== this.editable && blockElement.parentElement !== this.editable) {
            blockElement = blockElement.parentElement;
        }

        if (blockElement && blockElement !== this.editable) {
            const newBlock = document.createElement(tag);
            newBlock.innerHTML = blockElement.innerHTML;
            blockElement.parentNode?.replaceChild(newBlock, blockElement);
            this.onContentChange();
        }
    }

    private insertList(listTag: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const text = range.toString();

        const list = document.createElement(listTag);
        const lines = text ? text.split('\n').filter(l => l.trim()) : [''];

        for (const line of lines) {
            const li = document.createElement('li');
            li.textContent = line.trim() || '\u200B';
            list.appendChild(li);
        }

        range.deleteContents();
        range.insertNode(list);

        const lastLi = list.lastElementChild;
        if (lastLi) {
            range.setStart(lastLi, lastLi.childNodes.length);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        this.onContentChange();
    }

    private setAlignment(cmd: string): void {
        const align: Record<string, string> = {
            justifyLeft: 'left', justifyCenter: 'center', justifyRight: 'right',
        };
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const container = sel.getRangeAt(0).commonAncestorContainer;
        let block: HTMLElement | null = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as HTMLElement;
        while (block && block !== this.editable && block.parentElement !== this.editable) {
            block = block.parentElement;
        }
        if (block && block !== this.editable) {
            block.style.textAlign = align[cmd];
            this.onContentChange();
        }
    }

    private setForeColor(color: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (range.collapsed) return;
        const span = document.createElement('span');
        span.style.color = color;
        span.appendChild(range.extractContents());
        range.insertNode(span);
        range.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(range);
        this.onContentChange();
    }

    private sanitizeHTML(html: string): string {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        doc.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());

        doc.querySelectorAll('*').forEach(el => {
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
                    el.removeAttribute(attr.name);
                }
            }
        });

        return doc.body.innerHTML;
    }

    private downloadHTML(): void {
        const content = this.sanitizeHTML(this.editable.innerHTML);
        const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Export</title></head>
<body>
${content}
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'document.html';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    private refreshActiveState(): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as HTMLElement;

        document.querySelectorAll<HTMLElement>('[data-cmd]').forEach(btn => {
            const cmd = btn.dataset.cmd;
            let active = false;

            let current: HTMLElement | null = element;
            while (current && current !== this.editable) {
                const tag = current.tagName?.toLowerCase();
                if (
                    (cmd === 'bold' && (tag === 'strong' || tag === 'b')) ||
                    (cmd === 'italic' && (tag === 'em' || tag === 'i')) ||
                    (cmd === 'underline' && tag === 'u') ||
                    (cmd === 'strikeThrough' && tag === 's')
                ) {
                    active = true;
                    break;
                }
                current = current.parentElement;
            }

            btn.classList.toggle('active', active);
        });
    }

    public destroy(): void {
        this.abortController.abort();
    }
}

export { Editor };