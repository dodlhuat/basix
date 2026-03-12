class Editor {
    private readonly editable: HTMLElement;
    private readonly code: HTMLTextAreaElement;
    private readonly preview: HTMLElement;
    private readonly sidePanel: HTMLElement;
    private readonly wordCount: HTMLElement | null;
    private undoStack: string[] = [];
    private redoStack: string[] = [];

    constructor() {
        const editable = document.getElementById('editable');
        const code = document.getElementById('code') as HTMLTextAreaElement;
        const preview = document.getElementById('preview');
        const sidePanel = document.getElementById('sidePanel');
        const wordCount = document.getElementById('wordCount');

        if (!editable || !code || !preview || !sidePanel) {
            throw new Error('Editor: Required elements not found');
        }

        this.editable = editable;
        this.code = code;
        this.preview = preview;
        this.sidePanel = sidePanel;
        this.wordCount = wordCount;

        this.bindToolbar();
        this.bindActions();
        this.bindKeyboard();
        this.bindEditable();
        this.bindTabs();
        this.syncViews();
        this.saveState();

        // Start with side panel hidden
        this.sidePanel.classList.add('hidden');
    }

    private bindToolbar(): void {
        document.querySelectorAll<HTMLElement>('[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd!;
                const val = btn.dataset.value ?? null;
                this.exec(cmd, val);
                this.editable.focus();
            });
        });
    }

    private bindActions(): void {
        document.getElementById('linkBtn')?.addEventListener('click', () => {
            const url = prompt('Enter URL:', 'https://');
            if (url) this.exec('createLink', url);
        });

        const imageFile = document.getElementById('imageFile') as HTMLInputElement;
        document.getElementById('imageBtn')?.addEventListener('click', () => imageFile.click());
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
        });

        document.getElementById('cleanBtn')?.addEventListener('click', () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const text = range.toString();
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            this.onContentChange();
        });

        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());

        document.getElementById('toggleCodeBtn')?.addEventListener('click', () => {
            this.sidePanel.classList.toggle('hidden');
            this.syncViews();
        });

        // Code action buttons — matched by position within .code-actions
        const codeActions = document.querySelectorAll<HTMLButtonElement>('.code-actions button');
        codeActions[0]?.addEventListener('click', () => {
            this.editable.innerHTML = this.sanitizeHTML(this.code.value);
            this.onContentChange();
        });
        codeActions[1]?.addEventListener('click', () => {
            this.code.value = this.sanitizeHTML(this.code.value);
            this.editable.innerHTML = this.code.value;
            this.onContentChange();
        });
        codeActions[2]?.addEventListener('click', () => {
            this.code.value = this.code.value
                .replace(/\n/g, '')
                .replace(/>\s+</g, '><')
                .trim();
        });

        const saveBtn = document.getElementById('saveBtn');
        saveBtn?.addEventListener('click', () => this.downloadHTML());

        document.getElementById('clearBtn')?.addEventListener('click', () => {
            if (confirm('Clear all content?')) {
                this.editable.innerHTML = '';
                this.onContentChange();
            }
        });
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
        });
    }

    private bindEditable(): void {
        this.editable.addEventListener('input', () => this.onContentChange());

        this.editable.addEventListener('paste', (e: ClipboardEvent) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') ?? '';
            this.insertText(text);
        });

        this.editable.addEventListener('keyup', () => this.refreshActiveState());
        this.editable.addEventListener('mouseup', () => this.refreshActiveState());
    }

    private bindTabs(): void {
        document.querySelectorAll<HTMLElement>('.side-tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab!;

                document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(targetId)?.classList.add('active');
            });
        });
    }

    private onContentChange(): void {
        this.saveState();
        this.syncViews();
    }

    private syncViews(): void {
        this.code.value = this.editable.innerHTML.trim();
        this.preview.innerHTML = this.editable.innerHTML;
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
}

export { Editor };