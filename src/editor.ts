import { sanitizeHtml } from './utils.js';

interface EditorOptions {
    /** Hides the entire side panel (code/preview) permanently. Safe to use
     *  without [data-editor="code"], [data-editor="preview"], or [data-editor="side-panel"] in the DOM. */
    simple?: boolean;
    /** Root container element or CSS selector. Required when using multiple editors on one page. */
    root?: string | HTMLElement;
}

/** Rich-text editor built on contenteditable with undo/redo and code/preview panels. */
class Editor {
    private readonly root: HTMLElement;
    private readonly editable: HTMLElement;
    private readonly code: HTMLTextAreaElement | null;
    private readonly preview: HTMLElement | null;
    private readonly sidePanel: HTMLElement | null;
    private readonly wordCount: HTMLElement | null;
    private undoStack: string[] = [];
    private redoStack: string[] = [];
    private abortController = new AbortController();

    public constructor(options: EditorOptions = {}) {
        if (options.root instanceof HTMLElement) {
            this.root = options.root;
        } else if (typeof options.root === 'string') {
            const el = document.querySelector<HTMLElement>(options.root);
            if (!el) throw new Error(`Editor: root "${options.root}" not found`);
            this.root = el;
        } else {
            this.root = document.body;
        }

        const editable = this.q<HTMLElement>('[data-editor="editable"]');
        if (!editable) throw new Error('Editor: [data-editor="editable"] element not found');

        this.editable = editable;
        this.wordCount = this.q<HTMLElement>('[data-editor="wordcount"]');

        if (options.simple) {
            this.code = null;
            this.preview = null;
            this.sidePanel = this.q<HTMLElement>('[data-editor="side-panel"]');
            this.sidePanel?.classList.add('hidden');
        } else {
            const code = this.q<HTMLTextAreaElement>('[data-editor="code"]');
            const preview = this.q<HTMLElement>('[data-editor="preview"]');
            const sidePanel = this.q<HTMLElement>('[data-editor="side-panel"]');

            if (!code || !preview || !sidePanel) {
                throw new Error('Editor: [data-editor="code"], [data-editor="preview"] and [data-editor="side-panel"] are required unless simple: true');
            }

            this.code = code;
            this.preview = preview;
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

    private q<T extends Element>(selector: string): T | null {
        return this.root.querySelector<T>(selector);
    }

    private qAll<T extends Element>(selector: string): NodeListOf<T> {
        return this.root.querySelectorAll<T>(selector);
    }

    private bindToolbar(): void {
        const sig = { signal: this.abortController.signal };
        this.qAll<HTMLElement>('[data-cmd]').forEach((btn) => {
            btn.addEventListener(
                'click',
                () => {
                    const cmd = btn.dataset.cmd!;
                    const val = btn.dataset.value ?? null;
                    this.exec(cmd, val);
                    this.editable.focus();
                },
                sig,
            );
        });
    }

    private bindActions(): void {
        const sig = { signal: this.abortController.signal };
        this.q('[data-editor-action="link"]')?.addEventListener(
            'click',
            () => {
                const url = prompt('Enter URL:', 'https://');
                if (url) this.exec('createLink', url);
            },
            sig,
        );

        const imageFile = this.q<HTMLInputElement>('[data-editor="image-file"]');
        this.q('[data-editor-action="image"]')?.addEventListener('click', () => imageFile?.click(), sig);
        imageFile?.addEventListener(
            'change',
            () => {
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
            },
            sig,
        );

        this.q('[data-editor-action="clean"]')?.addEventListener(
            'click',
            () => {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const range = sel.getRangeAt(0);
                const text = range.toString();
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                this.onContentChange();
            },
            sig,
        );

        this.q('[data-editor-action="undo"]')?.addEventListener('click', () => this.undo(), sig);
        this.q('[data-editor-action="redo"]')?.addEventListener('click', () => this.redo(), sig);

        this.q('[data-editor-action="toggle-code"]')?.addEventListener(
            'click',
            () => {
                this.sidePanel?.classList.toggle('hidden');
                this.syncViews();
            },
            sig,
        );

        if (this.code) {
            const code = this.code;
            this.q('[data-editor-action="apply-code"]')?.addEventListener(
                'click',
                () => {
                    this.editable.innerHTML = sanitizeHtml(code.value);
                    this.onContentChange();
                },
                sig,
            );
            this.q('[data-editor-action="sanitize-code"]')?.addEventListener(
                'click',
                () => {
                    code.value = sanitizeHtml(code.value);
                    this.editable.innerHTML = code.value;
                    this.onContentChange();
                },
                sig,
            );
            this.q('[data-editor-action="minify-code"]')?.addEventListener(
                'click',
                () => {
                    code.value = code.value.replace(/\n/g, '').replace(/>\s+</g, '><').trim();
                },
                sig,
            );
        }

        this.q('[data-editor-action="save"]')?.addEventListener('click', () => this.downloadHTML(), sig);

        this.q('[data-editor-action="clear"]')?.addEventListener(
            'click',
            () => {
                if (confirm('Clear all content?')) {
                    this.editable.innerHTML = '';
                    this.onContentChange();
                }
            },
            sig,
        );
    }

    private bindKeyboard(): void {
        window.addEventListener(
            'keydown',
            (e: KeyboardEvent) => {
                if (!this.root.contains(document.activeElement)) return;

                const mod = e.ctrlKey || e.metaKey;
                if (!mod) return;

                const key = e.key.toLowerCase();

                if (key === 'b') {
                    e.preventDefault();
                    this.exec('bold');
                } else if (key === 'i') {
                    e.preventDefault();
                    this.exec('italic');
                } else if (key === 'u') {
                    e.preventDefault();
                    this.exec('underline');
                } else if (key === 'k') {
                    e.preventDefault();
                    const url = prompt('Enter URL:', 'https://');
                    if (url) this.exec('createLink', url);
                } else if (key === 's') {
                    e.preventDefault();
                    this.q<HTMLButtonElement>('[data-editor-action="save"]')?.click();
                } else if (key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    this.redo();
                }
            },
            { signal: this.abortController.signal },
        );
    }

    private bindEditable(): void {
        const sig = { signal: this.abortController.signal };
        this.editable.addEventListener('input', () => this.onContentChange(), sig);

        this.editable.addEventListener(
            'paste',
            (e: ClipboardEvent) => {
                e.preventDefault();
                const text = e.clipboardData?.getData('text/plain') ?? '';
                this.insertText(text);
            },
            sig,
        );

        this.editable.addEventListener('keyup', () => this.refreshActiveState(), sig);
        this.editable.addEventListener('mouseup', () => this.refreshActiveState(), sig);
    }

    private bindTabs(): void {
        const sig = { signal: this.abortController.signal };
        this.qAll<HTMLElement>('.side-tab[data-tab]').forEach((tab) => {
            tab.addEventListener(
                'click',
                () => {
                    const target = tab.dataset.tab!;

                    this.qAll('.side-tab').forEach((t) => t.classList.remove('active'));
                    this.qAll('.side-panel').forEach((p) => p.classList.remove('active'));

                    tab.classList.add('active');
                    this.q(`[data-editor="${target}"]`)?.classList.add('active');
                },
                sig,
            );
        });
    }

    private onContentChange(): void {
        this.saveState();
        this.syncViews();
    }

    private syncViews(): void {
        if (this.code) this.code.value = this.editable.innerHTML.trim();
        if (this.preview) this.preview.innerHTML = sanitizeHtml(this.editable.innerHTML);
        this.updateWordCount();
    }

    private updateWordCount(): void {
        if (!this.wordCount) return;
        const text = this.editable.innerText;
        const words = text
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
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
            case 'bold':
                this.toggleInlineStyle('strong');
                break;
            case 'italic':
                this.toggleInlineStyle('em');
                break;
            case 'underline':
                this.toggleInlineStyle('u');
                break;
            case 'strikeThrough':
                this.toggleInlineStyle('s');
                break;
            case 'createLink':
                if (value) this.createLink(value);
                break;
            case 'formatBlock':
                if (value) this.formatBlock(value);
                break;
            case 'insertUnorderedList':
                this.insertList('ul');
                break;
            case 'insertOrderedList':
                this.insertList('ol');
                break;
            case 'justifyLeft':
            case 'justifyCenter':
            case 'justifyRight':
                this.setAlignment(command);
                break;
            case 'foreColor':
                if (value) this.setForeColor(value);
                break;
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
        let current: HTMLElement | null = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

        const upperTag = tagName.toUpperCase();
        let wrapper: HTMLElement | null = null;
        while (current && current !== this.editable) {
            if (current.tagName === upperTag) {
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
        let blockElement: HTMLElement | null = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

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
        const lines = text ? text.split('\n').filter((l) => l.trim()) : [''];

        for (const line of lines) {
            const li = document.createElement('li');
            li.textContent = line.trim() || '​';
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
            justifyLeft: 'left',
            justifyCenter: 'center',
            justifyRight: 'right',
        };
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const container = sel.getRangeAt(0).commonAncestorContainer;
        let block: HTMLElement | null = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
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

    private downloadHTML(): void {
        const content = sanitizeHtml(this.editable.innerHTML);
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
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

        this.qAll<HTMLElement>('[data-cmd]').forEach((btn) => {
            const cmd = btn.dataset.cmd;
            let active = false;

            let current: HTMLElement | null = element;
            while (current && current !== this.editable) {
                const tag = current.tagName.toLowerCase();
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
