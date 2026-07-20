import { sanitizeHtml } from './utils.js';
import { ListenerGroup } from './listeners.js';
class Editor {
    root;
    editable;
    code;
    preview;
    sidePanel;
    wordCount;
    undoStack = [];
    redoStack = [];
    listeners = new ListenerGroup();
    constructor(options = {}) {
        if (options.root instanceof HTMLElement) {
            this.root = options.root;
        }
        else if (typeof options.root === 'string') {
            const el = document.querySelector(options.root);
            if (!el)
                throw new Error(`Editor: root "${options.root}" not found`);
            this.root = el;
        }
        else {
            this.root = document.body;
        }
        const editable = this.q('[data-editor="editable"]');
        if (!editable)
            throw new Error('Editor: [data-editor="editable"] element not found');
        this.editable = editable;
        this.wordCount = this.q('[data-editor="wordcount"]');
        if (options.simple) {
            this.code = null;
            this.preview = null;
            this.sidePanel = this.q('[data-editor="side-panel"]');
            this.sidePanel?.classList.add('hidden');
        }
        else {
            const code = this.q('[data-editor="code"]');
            const preview = this.q('[data-editor="preview"]');
            const sidePanel = this.q('[data-editor="side-panel"]');
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
    q(selector) {
        return this.root.querySelector(selector);
    }
    qAll(selector) {
        return this.root.querySelectorAll(selector);
    }
    bindToolbar() {
        const sig = { signal: this.listeners.signal };
        this.qAll('[data-cmd]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                const val = btn.dataset.value ?? null;
                this.exec(cmd, val);
                this.editable.focus();
            }, sig);
        });
    }
    bindActions() {
        const sig = { signal: this.listeners.signal };
        this.q('[data-editor-action="link"]')?.addEventListener('click', () => {
            const url = prompt('Enter URL:', 'https://');
            if (url)
                this.exec('createLink', url);
        }, sig);
        const imageFile = this.q('[data-editor="image-file"]');
        this.q('[data-editor-action="image"]')?.addEventListener('click', () => imageFile?.click(), sig);
        imageFile?.addEventListener('change', () => {
            const file = imageFile.files?.[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    this.insertImage(reader.result);
                }
            };
            reader.readAsDataURL(file);
            imageFile.value = '';
        }, sig);
        this.q('[data-editor-action="clean"]')?.addEventListener('click', () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0)
                return;
            const range = sel.getRangeAt(0);
            const text = range.toString();
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            this.onContentChange();
        }, sig);
        this.q('[data-editor-action="undo"]')?.addEventListener('click', () => this.undo(), sig);
        this.q('[data-editor-action="redo"]')?.addEventListener('click', () => this.redo(), sig);
        this.q('[data-editor-action="toggle-code"]')?.addEventListener('click', () => {
            this.sidePanel?.classList.toggle('hidden');
            this.syncViews();
        }, sig);
        if (this.code) {
            const code = this.code;
            this.q('[data-editor-action="apply-code"]')?.addEventListener('click', () => {
                this.editable.innerHTML = sanitizeHtml(code.value);
                this.onContentChange();
            }, sig);
            this.q('[data-editor-action="sanitize-code"]')?.addEventListener('click', () => {
                code.value = sanitizeHtml(code.value);
                this.editable.innerHTML = code.value;
                this.onContentChange();
            }, sig);
            this.q('[data-editor-action="minify-code"]')?.addEventListener('click', () => {
                code.value = code.value.replace(/\n/g, '').replace(/>\s+</g, '><').trim();
            }, sig);
        }
        this.q('[data-editor-action="save"]')?.addEventListener('click', () => this.downloadHTML(), sig);
        this.q('[data-editor-action="clear"]')?.addEventListener('click', () => {
            if (confirm('Clear all content?')) {
                this.editable.innerHTML = '';
                this.onContentChange();
            }
        }, sig);
    }
    bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (!this.root.contains(document.activeElement))
                return;
            const mod = e.ctrlKey || e.metaKey;
            if (!mod)
                return;
            const key = e.key.toLowerCase();
            if (key === 'b') {
                e.preventDefault();
                this.exec('bold');
            }
            else if (key === 'i') {
                e.preventDefault();
                this.exec('italic');
            }
            else if (key === 'u') {
                e.preventDefault();
                this.exec('underline');
            }
            else if (key === 'k') {
                e.preventDefault();
                const url = prompt('Enter URL:', 'https://');
                if (url)
                    this.exec('createLink', url);
            }
            else if (key === 's') {
                e.preventDefault();
                this.q('[data-editor-action="save"]')?.click();
            }
            else if (key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            else if (key === 'y' || (key === 'z' && e.shiftKey)) {
                e.preventDefault();
                this.redo();
            }
        }, { signal: this.listeners.signal });
    }
    bindEditable() {
        const sig = { signal: this.listeners.signal };
        this.editable.addEventListener('input', () => this.onContentChange(), sig);
        this.editable.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') ?? '';
            this.insertText(text);
        }, sig);
        this.editable.addEventListener('keyup', () => this.refreshActiveState(), sig);
        this.editable.addEventListener('mouseup', () => this.refreshActiveState(), sig);
    }
    bindTabs() {
        const sig = { signal: this.listeners.signal };
        this.qAll('.side-tab[data-tab]').forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                this.qAll('.side-tab').forEach((t) => t.classList.remove('active'));
                this.qAll('.side-panel').forEach((p) => p.classList.remove('active'));
                tab.classList.add('active');
                this.q(`[data-editor="${target}"]`)?.classList.add('active');
            }, sig);
        });
    }
    onContentChange() {
        this.saveState();
        this.syncViews();
    }
    syncViews() {
        if (this.code)
            this.code.value = this.editable.innerHTML.trim();
        if (this.preview)
            this.preview.innerHTML = sanitizeHtml(this.editable.innerHTML);
        this.updateWordCount();
    }
    updateWordCount() {
        if (!this.wordCount)
            return;
        const text = this.editable.innerText;
        const words = text
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
        const count = words.length;
        this.wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    }
    saveState() {
        this.undoStack.push(this.editable.innerHTML);
        if (this.undoStack.length > 100)
            this.undoStack.shift();
        this.redoStack = [];
    }
    undo() {
        if (this.undoStack.length <= 1)
            return;
        this.redoStack.push(this.undoStack.pop());
        this.editable.innerHTML = this.undoStack[this.undoStack.length - 1];
        this.syncViews();
    }
    redo() {
        if (this.redoStack.length === 0)
            return;
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.editable.innerHTML = state;
        this.syncViews();
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
            case 'formatBlock':
                if (value)
                    this.formatBlock(value);
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
                if (value)
                    this.setForeColor(value);
                break;
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
        this.onContentChange();
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
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        this.onContentChange();
    }
    toggleInlineStyle(tagName) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let current = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        const upperTag = tagName.toUpperCase();
        let wrapper = null;
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
        }
        else {
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
    createLink(url) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const contents = range.extractContents();
        const link = document.createElement('a');
        link.href = url;
        link.appendChild(contents);
        range.insertNode(link);
        this.onContentChange();
    }
    formatBlock(tag) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        let blockElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
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
    insertList(listTag) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
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
    setAlignment(cmd) {
        const align = {
            justifyLeft: 'left',
            justifyCenter: 'center',
            justifyRight: 'right',
        };
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const container = sel.getRangeAt(0).commonAncestorContainer;
        let block = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        while (block && block !== this.editable && block.parentElement !== this.editable) {
            block = block.parentElement;
        }
        if (block && block !== this.editable) {
            block.style.textAlign = align[cmd];
            this.onContentChange();
        }
    }
    setForeColor(color) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        if (range.collapsed)
            return;
        const span = document.createElement('span');
        span.style.color = color;
        span.appendChild(range.extractContents());
        range.insertNode(span);
        range.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(range);
        this.onContentChange();
    }
    downloadHTML() {
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
    refreshActiveState() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        this.qAll('[data-cmd]').forEach((btn) => {
            const cmd = btn.dataset.cmd;
            let active = false;
            let current = element;
            while (current && current !== this.editable) {
                const tag = current.tagName.toLowerCase();
                if ((cmd === 'bold' && (tag === 'strong' || tag === 'b')) ||
                    (cmd === 'italic' && (tag === 'em' || tag === 'i')) ||
                    (cmd === 'underline' && tag === 'u') ||
                    (cmd === 'strikeThrough' && tag === 's')) {
                    active = true;
                    break;
                }
                current = current.parentElement;
            }
            btn.classList.toggle('active', active);
        });
    }
    destroy() {
        this.listeners.destroy();
    }
}
export { Editor };
