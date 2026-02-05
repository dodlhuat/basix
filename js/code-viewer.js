class CodeViewer {
    constructor(elementOrSelector, code, language = 'javascript') {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        if (!element) {
            throw new Error(`CodeViewer: Element not found for selector "${elementOrSelector}"`);
        }
        this.container = element;
        this.code = code;
        this.language = language.toLowerCase();
        this.render();
    }
    highlight(code) {
        switch (this.language) {
            case 'javascript':
            case 'js':
                return this.highlightJavaScript(code);
            case 'html':
                return this.highlightHTML(code);
            case 'css':
                return this.highlightCSS(code);
            default:
                return this.escape(code);
        }
    }
    escape(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    highlightJavaScript(code) {
        const strings = [];
        code = code.replace(/`(?:[^`\\]|\\[\s\S])*`/g, (match) => {
            strings.push(match);
            return `###STRING${strings.length - 1}###`;
        });
        code = code.replace(/"(?:[^"\\]|\\[\s\S])*"/g, (match) => {
            strings.push(match);
            return `###STRING${strings.length - 1}###`;
        });
        code = code.replace(/'(?:[^'\\]|\\[\s\S])*'/g, (match) => {
            strings.push(match);
            return `###STRING${strings.length - 1}###`;
        });
        const comments = [];
        code = code.replace(/(\/\/.*$)/gm, (match) => {
            comments.push(match);
            return `###COMMENT${comments.length - 1}###`;
        });
        code = code.replace(/(\/\*[\s\S]*?\*\/)/g, (match) => {
            comments.push(match);
            return `###COMMENT${comments.length - 1}###`;
        });
        code = this.escape(code);
        const keywords = 'const|let|var|function|class|if|else|for|while|return|new|this|super|extends|import|export|from|default|async|await|try|catch|throw|switch|case|break|continue';
        code = code.replace(new RegExp(`\\b(${keywords})\\b`, 'g'), '<span class="keyword">$1</span>');
        code = code.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
        strings.forEach((str, i) => {
            code = code.replace(`###STRING${i}###`, '<span class="string">' + this.escape(str) + '</span>');
        });
        comments.forEach((comment, i) => {
            code = code.replace(`###COMMENT${i}###`, '<span class="comment">' + this.escape(comment) + '</span>');
        });
        return code;
    }
    highlightHTML(code) {
        code = this.escape(code);
        code = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '###COMMENT_START###$1###COMMENT_END###');
        code = code.replace(/(&lt;\/?)([a-zA-Z0-9]+)([^&]*?)(&gt;)/g, (match, open, tagName, attrs, close) => {
            attrs = attrs.replace(/\s+([a-zA-Z-]+)(=?)(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;)?/g, (m, attrName, eq, attrValue) => {
                let result = ' <span class="attribute">' + attrName + '</span>';
                if (eq)
                    result += eq;
                if (attrValue)
                    result += '<span class="string">' + attrValue + '</span>';
                return result;
            });
            return open + '<span class="tag">' + tagName + '</span>' + attrs + '<span class="punctuation">' + close + '</span>';
        });
        code = code.replace(/###COMMENT_START###(.*?)###COMMENT_END###/g, '<span class="comment">$1</span>');
        return code;
    }
    highlightCSS(code) {
        code = this.escape(code);
        const comments = [];
        code = code.replace(/(\/\*[\s\S]*?\*\/)/g, (match) => {
            comments.push(match);
            return `###COMMENT${comments.length - 1}###`;
        });
        const strings = [];
        code = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (match) => {
            strings.push(match);
            return `###STRING${strings.length - 1}###`;
        });
        code = code.replace(/^([^{]+)(?={)/gm, (match) => {
            return '<span class="selector">' + match.trim() + '</span>';
        });
        code = code.replace(/([a-z-]+)(\s*):/gi, '<span class="property">$1</span>$2:');
        code = code.replace(/:\s*([0-9.]+(?:px|em|rem|%|vh|vw|s|ms)?)/g, ': <span class="number">$1</span>');
        strings.forEach((str, i) => {
            code = code.replace(`###STRING${i}###`, '<span class="string">' + str + '</span>');
        });
        comments.forEach((comment, i) => {
            code = code.replace(`###COMMENT${i}###`, '<span class="comment">' + comment + '</span>');
        });
        return code;
    }
    async copyCode() {
        try {
            await navigator.clipboard.writeText(this.code);
            const btn = this.container.querySelector('.copy-button');
            if (!btn)
                return;
            btn.textContent = 'copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = 'Copy';
                btn.classList.remove('copied');
            }, 2000);
        }
        catch (err) {
            console.error('Error:', err);
        }
    }
    render() {
        const highlighted = this.highlight(this.code);
        this.container.innerHTML = `
                    <div class="code-display">
                        <div class="code-header">
                            <span class="code-language">${this.language}</span>
                            <button class="copy-button">Copy</button>
                        </div>
                        <div class="code-content">
                            <pre>${highlighted}</pre>
                        </div>
                    </div>
                `;
        const copyButton = this.container.querySelector('.copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', () => this.copyCode());
        }
    }
}
export { CodeViewer };
