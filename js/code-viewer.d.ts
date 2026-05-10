type SupportedLanguage = 'javascript' | 'js' | 'html' | 'css';
declare class CodeViewer {
    private container;
    private code;
    private language;
    constructor(elementOrSelector: string | HTMLElement, code: string, language?: SupportedLanguage);
    private highlight;
    private escape;
    private highlightJavaScript;
    private highlightHTML;
    private highlightCSS;
    private copyCode;
    private render;
}
export { CodeViewer };
export type { SupportedLanguage };
