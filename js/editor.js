class Editor {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        const editable = document.getElementById('editable');
        const code = document.getElementById('code');
        const preview = document.getElementById('preview');
        if (!editable || !code || !preview) {
            throw new Error('Editor: Required elements not found (#editable, #code, #preview)');
        }
        this.editable = editable;
        this.code = code;
        this.preview = preview;
        this.isCodeView = false;
        this.init();
    }
    init() {
        this.bindEvents();
        this.updateCodeView();
        this.updatePreview();
        this.saveState();
        // Start hidden
        this.code.style.display = 'block';
    }
    bindEvents() {
        // Buttons with data-cmd
        document.querySelectorAll('[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                const val = btn.dataset.value || null;
                if (cmd)
                    this.exec(cmd, val);
                this.editable.focus();
            });
        });
        // Link
        const linkBtn = document.getElementById('linkBtn');
        linkBtn?.addEventListener('click', () => {
            const url = prompt('Provide url with https://', 'https://');
            if (url)
                this.exec('createLink', url);
        });
        // Image via file
        const imageFile = document.getElementById('imageFile');
        const imageBtn = document.getElementById('imageBtn');
        imageBtn?.addEventListener('click', () => imageFile.click());
        imageFile?.addEventListener('change', (e) => {
            const target = e.target;
            const f = target.files?.[0];
            if (!f)
                return;
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
            if (!sel || sel.rangeCount === 0)
                return;
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
            }
            else {
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
        this.editable.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') || '';
            this.insertText(text);
        });
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
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
                if (url)
                    this.exec('createLink', url);
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
    saveState() {
        this.undoStack.push(this.editable.innerHTML);
        if (this.undoStack.length > 100) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }
    undo() {
        if (this.undoStack.length > 1) {
            const current = this.undoStack.pop();
            this.redoStack.push(current);
            this.editable.innerHTML = this.undoStack[this.undoStack.length - 1];
            this.updateCodeView();
            this.updatePreview();
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.undoStack.push(state);
            this.editable.innerHTML = state;
            this.updateCodeView();
            this.updatePreview();
        }
    }
    insertText(text) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
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
    insertImage(dataUrl) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
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
    wrapSelection(tagName) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
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
    toggleInlineStyle(tagName) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let currentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
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
        }
        else {
            // Wrap
            this.wrapSelection(tagName);
        }
        this.saveState();
        this.updateCodeView();
        this.updatePreview();
    }
    createLink(url) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
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
    formatBlock(tag) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const blockElement = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container;
        if (blockElement) {
            const newBlock = document.createElement(tag);
            newBlock.innerHTML = blockElement.innerHTML;
            blockElement.parentNode?.replaceChild(newBlock, blockElement);
            this.saveState();
            this.updateCodeView();
            this.updatePreview();
        }
    }
    sanitizeHTML(html) {
        html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/\son[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        return html;
    }
    updateCodeView() {
        this.code.value = this.editable.innerHTML.trim();
    }
    updatePreview() {
        this.preview.innerHTML = this.editable.innerHTML;
    }
    exec(command, value = null) {
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
                if (value)
                    this.createLink(value);
                break;
            case 'insertImage':
                if (value)
                    this.insertImage(value);
                break;
            case 'formatBlock':
                if (value)
                    this.formatBlock(value);
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
    refreshState() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        document.querySelectorAll('[data-cmd]').forEach(btn => {
            const cmd = btn.dataset.cmd;
            let on = false;
            let current = element;
            while (current && current !== this.editable) {
                const tagName = current.tagName?.toLowerCase();
                if ((cmd === 'bold' && (tagName === 'strong' || tagName === 'b')) ||
                    (cmd === 'italic' && (tagName === 'em' || tagName === 'i')) ||
                    (cmd === 'underline' && tagName === 'u') ||
                    (cmd === 'strikeThrough' && tagName === 's')) {
                    on = true;
                    break;
                }
                current = current.parentElement;
            }
            btn.classList.toggle('active', on);
        });
    }
}
export { Editor };
