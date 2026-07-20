type SupportedLanguage = 'javascript' | 'js' | 'html' | 'css';
declare class CodeViewer {
    private container;
    private code;
    private language;
    private listeners;
    constructor(elementOrSelector: string | HTMLElement, code: string, language?: SupportedLanguage);
    private highlight;
    private escape;
    private highlightJavaScript;
    private highlightHTML;
    private highlightCSS;
    private copyCode;
    private render;
    destroy(): void;
}
export { CodeViewer };
export type { SupportedLanguage };
