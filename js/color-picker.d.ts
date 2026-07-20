interface ColorRGB {
    r: number;
    g: number;
    b: number;
}
interface ColorPickerOptions {
    value?: string;
    onChange?: (hex: string, rgb: ColorRGB) => void;
}
declare class ColorPicker {
    private readonly container;
    private readonly onChange?;
    private canvas;
    private ctx;
    private cursor;
    private hueSlider;
    private hexInput;
    private rInput;
    private gInput;
    private bInput;
    private preview;
    private hue;
    private saturation;
    private brightness;
    private isDragging;
    private listeners;
    private resizeObserver;
    constructor(elementOrSelector: string | HTMLElement, options?: ColorPickerOptions);
    private build;
    private bindEvents;
    private resizeCanvas;
    private drawField;
    private handleFieldInteraction;
    private updateCursor;
    private updateFromHSB;
    private syncInputs;
    private syncPreview;
    private handleHexInput;
    private handleRGBInput;
    private setFromRGB;
    getValue(): string;
    setValue(hex: string): void;
    destroy(): void;
    private hsbToRgb;
    private rgbToHsb;
    private rgbToHex;
    private hexToRgb;
}
export { ColorPicker };
export type { ColorPickerOptions, ColorRGB };
