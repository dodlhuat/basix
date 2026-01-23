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

        if (lang === 'javascript' || lang === 'js') {
            // Keywords
            highlighted = highlighted.replace(/\b(const|let|var|function|class|return|if|else|for|while|import|export|from|async|await|new|this)\b/g, '<span class="cv-keyword">$1</span>');
            // Functions
            highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="cv-function">$1</span>');
            // Strings
            highlighted = highlighted.replace(/'([^']*)'/g, '<span class="cv-string">\'$1\'</span>');
            highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="cv-string">"$1"</span>');
            // Comments
            highlighted = highlighted.replace(/(\/\/.*)/g, '<span class="cv-comment">$1</span>');
        } else if (lang === 'css') {
            // Selectors (start of line or after })
            highlighted = highlighted.replace(/([#.]?[\w-]+)(?=\s*\{)/g, '<span class="cv-selector">$1</span>');
            // Properties
            highlighted = highlighted.replace(/([\w-]+)(?=\s*:)/g, '<span class="cv-attribute">$1</span>');
            // Values (not perfect)
            highlighted = highlighted.replace(/:\s*([^;]+);/g, ': <span class="cv-number">$1</span>;');
        } else if (lang === 'html') {
            // Tags
            highlighted = highlighted.replace(/&lt;(\/?[a-z0-9]+)(?![^&]*;)/gi, '&lt;<span class="cv-tag">$1</span>');
            // Attributes
            highlighted = highlighted.replace(/\s([a-z-]+)=/gi, ' <span class="cv-attribute">$1</span>=');
            // Attribute values
            highlighted = highlighted.replace(/="([^"]*)"/g, '="<span class="cv-string">$1</span>"');
            // Comments
            highlighted = highlighted.replace(/(&lt;!--.*?--&gt;)/s, '<span class="cv-comment">$1</span>');
        }

        return highlighted;
    }
}