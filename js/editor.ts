export class Editor {
    private readonly editable: HTMLElement;
    private code: HTMLTextAreaElement;
    private preview: HTMLElement;
    private isCodeView: boolean;
    private undoStack: string[] = [];
    private redoStack: string[] = [];

    constructor() {
        this.editable = document.getElementById('editable') as HTMLElement;
        this.code = document.getElementById('code') as HTMLTextAreaElement;
        this.preview = document.getElementById('preview') as HTMLElement;
        this.isCodeView = false;

        this.init();
    }

    private init(): void {
        this.bindEvents();
        this.updateCodeView();
        this.updatePreview();
        this.saveState();

        // Start hidden
        this.code.style.display = 'block';
    }

    private bindEvents(): void {
        // Buttons with data-cmd
        document.querySelectorAll<HTMLElement>('[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                const val = btn.dataset.value || null;
                if (cmd) this.exec(cmd, val);
                this.editable.focus();
            });
        });

        // Link
        const linkBtn = document.getElementById('linkBtn');
        linkBtn?.addEventListener('click', () => {
            const url = prompt('Provide url with https://', 'https://');
            if (url) this.exec('createLink', url);
        });

        // Image via file
        const imageFile = document.getElementById('imageFile') as HTMLInputElement;
        const imageBtn = document.getElementById('imageBtn');
        imageBtn?.addEventListener('click', () => imageFile.click());
        imageFile?.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const f = target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    this.insertImage(reader.result);
                }
            };
            reader.readAsDataURL(f);
        });

        // Clean formatting
        const cleanBtn = document.getElementById('cleanBtn');
        cleanBtn?.addEventListener('click', () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const text = range.toString();
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            this.saveState();
            this.updateCodeView();
            this.updatePreview();
        });

        // Undo/Redo
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        undoBtn?.addEventListener('click', () => this.undo());
        redoBtn?.addEventListener('click', () => this.redo());

        const toggleCodeBtn = document.getElementById('toggleCodeBtn');
        toggleCodeBtn?.addEventListener('click', () => {
            this.isCodeView = !this.isCodeView;
            if (this.isCodeView) {
                this.updateCodeView();
                this.code.style.display = 'block';
            } else {
                this.code.style.display = 'none';
            }
        });

        const applyCodeBtn = document.getElementById('applyCodeBtn');
        applyCodeBtn?.addEventListener('click', () => {
            this.editable.innerHTML = this.sanitizeHTML(this.code.value);
            this.saveState();
            this.updatePreview();
        });

        // Sanitize button
        const sanitizeBtn = document.getElementById('sanitizeBtn');
        sanitizeBtn?.addEventListener('click', () => {
            this.code.value = this.sanitizeHTML(this.code.value);
            this.editable.innerHTML = this.code.value;
            this.saveState();
            this.updatePreview();
        });

        // Minify
        const minifyBtn = document.getElementById('minifyBtn');
        minifyBtn?.addEventListener('click', () => {
            this.code.value = this.code.value.replace(/\n/g, '').replace(/>\s+</g, '><').trim();
        });

        const saveBtn = document.getElementById('saveBtn');
        saveBtn?.addEventListener('click', () => {
            const blob = new Blob([
                '<!doctype html>\n<html lang="de">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Export</title></head>\n<body>\n' +
                this.sanitizeHTML(this.editable.innerHTML) +
                '\n</body>\n</html>'
            ], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'document.html';
            a.click();
            URL.revokeObjectURL(a.href);
        });

        // Clear content
        const clearBtn = document.getElementById('clearBtn');
        clearBtn?.addEventListener('click', () => {
            if (confirm('Do you really want to delete?')) {
                this.editable.innerHTML = '';
                this.saveState();
                this.updateCodeView();
                this.updatePreview();
            }
        });

        // Sync editable -> code & preview on input
        this.editable.addEventListener('input', () => {
            this.saveState();
            this.updateCodeView();
            this.updatePreview();
        });

        // Paste handling: remove styles on paste
        this.editable.addEventListener('paste', (e: ClipboardEvent) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') || '';
            this.insertText(text);
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                this.exec('bold');
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                this.exec('italic');
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                this.exec('underline');
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const url = prompt('Provide URL', 'https://');
                if (url) this.exec('createLink', url);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveBtn?.click();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });

        // Keep buttons' active state in sync
        this.editable.addEventListener('keyup', () => this.refreshState());
        this.editable.addEventListener('mouseup', () => this.refreshState());
    }

    private saveState(): void {
        this.undoStack.push(this.editable.innerHTML);
        if (this.undoStack.length > 100) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    private undo(): void {
        if (this.undoStack.length > 1) {
            const current = this.undoStack.pop()!;
            this.redoStack.push(current);
            this.editable.innerHTML = this.undoStack[this.undoStack.length - 1];
            this.updateCodeView();
            this.updatePreview();
        }
    }

    private redo(): void {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop()!;
            this.undoStack.push(state);
            this.editable.innerHTML = state;
            this.updateCodeView();
            this.updatePreview();
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

        this.saveState();
        this.updateCodeView();
        this.updatePreview();
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

        // Move cursor after image
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        this.saveState();
        this.updateCodeView();
        this.updatePreview();
    }

    private wrapSelection(tagName: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const selectedContent = range.extractContents();
        const wrapper = document.createElement(tagName);
        wrapper.appendChild(selectedContent);
        range.insertNode(wrapper);

        // Restore selection
        range.selectNodeContents(wrapper);
        sel.removeAllRanges();
        sel.addRange(range);

        this.saveState();
        this.updateCodeView();
        this.updatePreview();
    }

    private toggleInlineStyle(tagName: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let currentElement: HTMLElement | null = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
        let isWrapped = false;

        while (currentElement && currentElement !== this.editable) {
            if (currentElement.tagName === tagName.toUpperCase()) {
                isWrapped = true;
                break;
            }
            currentElement = currentElement.parentElement;
        }

        if (isWrapped && currentElement) {
            // Unwrap
            const parent = currentElement.parentNode;
            while (currentElement.firstChild) {
                parent?.insertBefore(currentElement.firstChild, currentElement);
            }
            parent?.removeChild(currentElement);
        } else {
            // Wrap
            this.wrapSelection(tagName);
        }

        this.saveState();
        this.updateCodeView();
        this.updatePreview();
    }

    private createLink(url: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const selectedContent = range.extractContents();
        const link = document.createElement('a');
        link.href = url;
        link.appendChild(selectedContent);
        range.insertNode(link);

        this.saveState();
        this.updateCodeView();
        this.updatePreview();
    }

    private formatBlock(tag: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const blockElement = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container as HTMLElement;

        if (blockElement) {
            const newBlock = document.createElement(tag);
            newBlock.innerHTML = blockElement.innerHTML;
            blockElement.parentNode?.replaceChild(newBlock, blockElement);

            this.saveState();
            this.updateCodeView();
            this.updatePreview();
        }
    }

    private sanitizeHTML(html: string): string {
        html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/\son[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        return html;
    }

    private updateCodeView(): void {
        this.code.value = this.editable.innerHTML.trim();
    }

    private updatePreview(): void {
        this.preview.innerHTML = this.editable.innerHTML;
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
            case 'insertImage':
                if (value) this.insertImage(value);
                break;
            case 'formatBlock':
                if (value) this.formatBlock(value);
                break;
            case 'insertOrderedList':
                this.wrapSelection('ol');
                break;
            case 'insertUnorderedList':
                this.wrapSelection('ul');
                break;
            default:
                console.warn('Command not implemented:', command);
        }
    }

    private refreshState(): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;

        document.querySelectorAll<HTMLElement>('[data-cmd]').forEach(btn => {
            const cmd = btn.dataset.cmd;
            let on = false;

            let current: HTMLElement | null = element;
            while (current && current !== this.editable) {
                const tagName = current.tagName?.toLowerCase();
                if (
                    (cmd === 'bold' && (tagName === 'strong' || tagName === 'b')) ||
                    (cmd === 'italic' && (tagName === 'em' || tagName === 'i')) ||
                    (cmd === 'underline' && tagName === 'u') ||
                    (cmd === 'strikeThrough' && tagName === 's')
                ) {
                    on = true;
                    break;
                }
                current = current.parentElement;
            }

            btn.classList.toggle('active', on);
        });
    }
}