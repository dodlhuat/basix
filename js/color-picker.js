import { ListenerGroup } from './listeners.js';
class ColorPicker {
    container;
    onChange;
    canvas;
    ctx;
    cursor;
    hueSlider;
    hexInput;
    rInput;
    gInput;
    bInput;
    preview;
    hue = 0;
    saturation = 100;
    brightness = 100;
    isDragging = false;
    listeners = new ListenerGroup();
    resizeObserver;
    constructor(elementOrSelector, options = {}) {
        const el = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
        if (!el)
            throw new Error(`ColorPicker: element not found for "${elementOrSelector}"`);
        this.container = el;
        this.onChange = options.onChange;
        this.build();
        this.bindEvents();
        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(this.canvas.parentElement);
        this.resizeCanvas();
        if (options.value) {
            this.setValue(options.value);
        }
        else {
            this.updateFromHSB();
        }
    }
    build() {
        this.container.classList.add('color-picker');
        this.container.innerHTML = `
            <div class="color-picker__field">
                <canvas class="color-picker__canvas"></canvas>
                <div class="color-picker__cursor" aria-hidden="true"></div>
            </div>
            <div class="color-picker__controls">
                <div class="color-picker__hue-track">
                    <input type="range" class="color-picker__hue-slider" min="0" max="360" value="0" aria-label="Hue">
                </div>
                <div class="color-picker__preview" aria-hidden="true"></div>
            </div>
            <div class="color-picker__inputs">
                <div class="color-picker__input-group color-picker__input-group--hex">
                    <label>HEX</label>
                    <input type="text" class="color-picker__hex" value="#FF0000" spellcheck="false" autocomplete="off" maxlength="7">
                </div>
                <div class="color-picker__input-group">
                    <label>R</label>
                    <input type="number" class="color-picker__r" min="0" max="255" value="255">
                </div>
                <div class="color-picker__input-group">
                    <label>G</label>
                    <input type="number" class="color-picker__g" min="0" max="255" value="0">
                </div>
                <div class="color-picker__input-group">
                    <label>B</label>
                    <input type="number" class="color-picker__b" min="0" max="255" value="0">
                </div>
            </div>
        `;
        const canvas = this.container.querySelector('.color-picker__canvas');
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx)
            throw new Error('ColorPicker: canvas context unavailable');
        this.canvas = canvas;
        this.ctx = ctx;
        this.cursor = this.container.querySelector('.color-picker__cursor');
        this.hueSlider = this.container.querySelector('.color-picker__hue-slider');
        this.hexInput = this.container.querySelector('.color-picker__hex');
        this.rInput = this.container.querySelector('.color-picker__r');
        this.gInput = this.container.querySelector('.color-picker__g');
        this.bInput = this.container.querySelector('.color-picker__b');
        this.preview = this.container.querySelector('.color-picker__preview');
    }
    bindEvents() {
        const sig = { signal: this.listeners.signal };
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            this.isDragging = true;
            this.handleFieldInteraction(e);
        }, sig);
        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isDragging)
                return;
            this.handleFieldInteraction(e);
        }, sig);
        for (const type of ['pointerup', 'pointercancel']) {
            this.canvas.addEventListener(type, () => {
                this.isDragging = false;
            }, sig);
        }
        this.hueSlider.addEventListener('input', () => {
            this.hue = +this.hueSlider.value;
            this.drawField();
            this.updateFromHSB();
        }, sig);
        this.hexInput.addEventListener('change', () => this.handleHexInput(), sig);
        this.rInput.addEventListener('change', () => this.handleRGBInput(), sig);
        this.gInput.addEventListener('change', () => this.handleRGBInput(), sig);
        this.bInput.addEventListener('change', () => this.handleRGBInput(), sig);
    }
    resizeCanvas() {
        const w = this.canvas.offsetWidth;
        const h = this.canvas.offsetHeight;
        if (w === 0 || h === 0)
            return;
        if (this.canvas.width === w && this.canvas.height === h)
            return;
        this.canvas.width = w;
        this.canvas.height = h;
        this.drawField();
        this.updateCursor();
    }
    drawField() {
        const { width, height } = this.canvas;
        if (width === 0 || height === 0)
            return;
        const gradH = this.ctx.createLinearGradient(0, 0, width, 0);
        gradH.addColorStop(0, '#fff');
        gradH.addColorStop(1, `hsl(${this.hue}, 100%, 50%)`);
        this.ctx.fillStyle = gradH;
        this.ctx.fillRect(0, 0, width, height);
        const gradV = this.ctx.createLinearGradient(0, 0, 0, height);
        gradV.addColorStop(0, 'rgba(0,0,0,0)');
        gradV.addColorStop(1, '#000');
        this.ctx.fillStyle = gradV;
        this.ctx.fillRect(0, 0, width, height);
    }
    handleFieldInteraction(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        this.saturation = (x / rect.width) * 100;
        this.brightness = 100 - (y / rect.height) * 100;
        this.updateCursor(rect);
        this.updateFromHSB();
    }
    updateCursor(rect) {
        const r = rect ?? this.canvas.getBoundingClientRect();
        const x = (this.saturation / 100) * r.width;
        const y = (1 - this.brightness / 100) * r.height;
        this.cursor.style.left = `${x}px`;
        this.cursor.style.top = `${y}px`;
        this.cursor.classList.toggle('color-picker__cursor--dark', this.brightness > 50 && this.saturation < 80);
    }
    updateFromHSB() {
        const rgb = this.hsbToRgb(this.hue, this.saturation, this.brightness);
        const hex = this.rgbToHex(rgb);
        this.syncInputs(rgb, hex);
        this.syncPreview(rgb);
        this.onChange?.(hex, rgb);
    }
    syncInputs(rgb, hex) {
        this.hexInput.value = hex;
        this.rInput.value = String(rgb.r);
        this.gInput.value = String(rgb.g);
        this.bInput.value = String(rgb.b);
    }
    syncPreview(rgb) {
        this.preview.style.backgroundColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }
    handleHexInput() {
        const hex = this.hexInput.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(hex)) {
            this.setFromRGB(this.hexToRgb(hex));
        }
        else {
            this.hexInput.value = this.rgbToHex(this.hsbToRgb(this.hue, this.saturation, this.brightness));
        }
    }
    handleRGBInput() {
        const clamp = (v) => Math.max(0, Math.min(255, isNaN(v) ? 0 : v));
        this.setFromRGB({
            r: clamp(+this.rInput.value),
            g: clamp(+this.gInput.value),
            b: clamp(+this.bInput.value),
        });
    }
    setFromRGB(rgb) {
        const { h, s, v } = this.rgbToHsb(rgb);
        this.hue = h;
        this.saturation = s;
        this.brightness = v;
        this.hueSlider.value = String(this.hue);
        this.drawField();
        this.updateCursor();
        this.updateFromHSB();
    }
    getValue() {
        return this.rgbToHex(this.hsbToRgb(this.hue, this.saturation, this.brightness));
    }
    setValue(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex))
            return;
        this.setFromRGB(this.hexToRgb(hex));
    }
    destroy() {
        this.listeners.destroy();
        this.resizeObserver.disconnect();
        this.container.classList.remove('color-picker');
        this.container.innerHTML = '';
    }
    hsbToRgb(h, s, v) {
        s /= 100;
        v /= 100;
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) {
            r = c;
            g = x;
            b = 0;
        }
        else if (h < 120) {
            r = x;
            g = c;
            b = 0;
        }
        else if (h < 180) {
            r = 0;
            g = c;
            b = x;
        }
        else if (h < 240) {
            r = 0;
            g = x;
            b = c;
        }
        else if (h < 300) {
            r = x;
            g = 0;
            b = c;
        }
        else {
            r = c;
            g = 0;
            b = x;
        }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
        };
    }
    rgbToHsb({ r, g, b }) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d !== 0) {
            if (max === r)
                h = ((g - b) / d) % 6;
            else if (max === g)
                h = (b - r) / d + 2;
            else
                h = (r - g) / d + 4;
        }
        h = Math.round(h * 60);
        if (h < 0)
            h += 360;
        return {
            h,
            s: max === 0 ? 0 : Math.round((d / max) * 100),
            v: Math.round(max * 100),
        };
    }
    rgbToHex({ r, g, b }) {
        return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
    }
    hexToRgb(hex) {
        const m = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    }
}
export { ColorPicker };
