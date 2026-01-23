export class CodeViewer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.code = options.code || '';
        this.language = options.language || 'javascript';
        this.title = options.title || this.language;

        if (!this.container) {
            console.error('CodeViewer: Container not found');
            return;
        }

        this.render();
    }

    render() {
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'code-viewer';

        const header = document.createElement('div');
        header.className = 'code-viewer-header';

        const langLabel = document.createElement('span');
        langLabel.className = 'code-viewer-lang';
        langLabel.textContent = this.title;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-viewer-copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => this.copyToClipboard(copyBtn);

        header.appendChild(langLabel);
        header.appendChild(copyBtn);

        const pre = document.createElement('pre');
        pre.className = 'code-viewer-content';

        const codeEl = document.createElement('code');
        codeEl.innerHTML = this.highlight(this.code, this.language);

        pre.appendChild(codeEl);

        wrapper.appendChild(header);
        wrapper.appendChild(pre);
        this.container.appendChild(wrapper);
    }

    copyToClipboard(btn) {
        navigator.clipboard.writeText(this.code).then(() => {

            btn.textContent = 'Copied!';

            const feedback = document.createElement('div');
            feedback.className = 'copy-feedback';
            feedback.textContent = 'Copied to clipboard!';
            this.container.querySelector('.code-viewer').appendChild(feedback);

            setTimeout(() => {
                btn.textContent = 'Copy';
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            btn.textContent = 'Error';
            setTimeout(() => btn.textContent = 'Copy', 2000);
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    highlight(code, lang) {
        let highlighted = this.escapeHtml(code);

        const replaceAll = rules => {
            for (const [regex, cls] of rules) {
                highlighted = highlighted.replace(regex, match =>
                    `<span class="${cls}">${match}</span>`
                );
            }
        };

        if (lang === 'js' || lang === 'javascript') {
            replaceAll([
                [/\b(const|let|var|function|class|return|if|else|for|while|import|export|from|async|await|new|this|try|catch|throw)\b/g, 'cv-keyword'],
                [/\b(true|false|null|undefined)\b/g, 'cv-literal'],
                [/\b\d+(\.\d+)?\b/g, 'cv-number'],
                [/(['"`])(?:\\.|(?!\1).)*\1/g, 'cv-string'],
                [/(\/\/.*|\/\*[\s\S]*?\*\/)/g, 'cv-comment'],
                [/\b([a-zA-Z_$][\w$]*)\s*(?=\()/g, 'cv-function']
            ]);

        } else if (lang === 'css') {
            replaceAll([
                [/(\/\*[\s\S]*?\*\/)/g, 'cv-comment'],
                [/([#.][\w-]+)(?=\s*\{)/g, 'cv-selector'],
                [/([\w-]+)(?=\s*:)/g, 'cv-attribute'],
                [/\b\d+(\.\d+)?(px|em|rem|%)?\b/g, 'cv-number']
            ]);

        } else if (lang === 'html') {
            replaceAll([
                [/(&lt;!--[\s\S]*?--&gt;)/g, 'cv-comment'],
                [/&lt;(\/?[a-z0-9-]+)/gi, 'cv-tag'],
                [/\s([a-z-]+)=/gi, 'cv-attribute'],
                [/="([^"]*)"/g, 'cv-string']
            ]);
        }

        return highlighted;
    }

}