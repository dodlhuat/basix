export class Editor {
    constructor() {
        this.editable = document.getElementById('editable');
        this.code = document.getElementById('code');
        this.preview = document.getElementById('preview');
        this.isCodeView = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCodeView();
        this.updatePreview();

        // Start hidden
        this.code.style.display = 'block';
    }

    bindEvents() {
        // Buttons with data-cmd
        document.querySelectorAll('[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                const val = btn.dataset.value || null;
                this.exec(cmd, val);
                this.editable.focus();
            });
        });

        // Link
        document.getElementById('linkBtn').addEventListener('click', () => {
            const url = prompt('URL eingeben (mit http:// oder https://)', 'https://');
            if (url) this.exec('createLink', url);
        });

        // Image via file
        const imageFile = document.getElementById('imageFile');
        document.getElementById('imageBtn').addEventListener('click', () => imageFile.click());
        imageFile.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => this.exec('insertImage', reader.result);
            reader.readAsDataURL(f);
        });

        // Clean formatting
        document.getElementById('cleanBtn').addEventListener('click', () => {
            const sel = window.getSelection();
            if (sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const text = range.toString();
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            this.updateCodeView();
            this.updatePreview();
        });

        // Undo/Redo
        document.getElementById('undoBtn').addEventListener('click', () => this.exec('undo'));
        document.getElementById('redoBtn').addEventListener('click', () => this.exec('redo'));

        // Toggle code view
        document.getElementById('toggleCodeBtn').addEventListener('click', () => {
            this.isCodeView = !this.isCodeView;
            if (this.isCodeView) {
                this.updateCodeView();
                this.code.style.display = 'block';
            } else {
                this.code.style.display = 'none';
            }
        });

        // Apply code to editor
        document.getElementById('applyCodeBtn').addEventListener('click', () => {
            this.editable.innerHTML = this.sanitizeHTML(this.code.value);
            this.updatePreview();
        });

        // Sanitize button
        document.getElementById('sanitizeBtn').addEventListener('click', () => {
            this.code.value = this.sanitizeHTML(this.code.value);
            this.editable.innerHTML = this.code.value;
            this.updatePreview();
        });

        // Minify
        document.getElementById('minifyBtn').addEventListener('click', () => {
            this.code.value = this.code.value.replace(/\n/g, '').replace(/>\s+</g, '><').trim();
        });

        // Save HTML to file
        document.getElementById('saveBtn').addEventListener('click', () => {
            const blob = new Blob(['<!doctype html>\n<html lang="de">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Export</title></head>\n<body>\n' + this.sanitizeHTML(this.editable.innerHTML) + '\n</body>\n</html>'], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'document.html';
            a.click();
            URL.revokeObjectURL(a.href);
        });

        // Clear content
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Inhalt wirklich löschen?')) {
                this.editable.innerHTML = '';
                this.updateCodeView();
                this.updatePreview();
            }
        });

        // Sync editable -> code & preview on input
        this.editable.addEventListener('input', () => {
            this.updateCodeView();
            this.updatePreview();
        });

        // Paste handling: remove styles on paste
        this.editable.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
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
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const url = prompt('URL eingeben', 'https://');
                if (url) this.exec('createLink', url);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                document.getElementById('saveBtn').click();
            }
        });

        // Keep buttons' active state in sync
        this.editable.addEventListener('keyup', () => this.refreshState());
        this.editable.addEventListener('mouseup', () => this.refreshState());
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
        if (command === 'formatBlock' && value) {
            document.execCommand('formatBlock', false, '<' + value + '>');
        } else {
            document.execCommand(command, false, value);
        }
        this.updateCodeView();
        this.updatePreview();
    }

    refreshState() {
        document.querySelectorAll('[data-cmd]').forEach(btn => {
            const cmd = btn.dataset.cmd;
            let on = false;
            try {
                on = document.queryCommandState(cmd);
            } catch (e) {
            }
            btn.classList.toggle('active', on);
        });
    }
}
