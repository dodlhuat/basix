interface CarouselOptions {
    loop?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
}

export class Carousel {
    private root: HTMLElement;
    private options: CarouselOptions;
    private track!: HTMLUListElement;
    private slides!: HTMLElement[];
    private slideWidth!: number;
    private currentIndex!: number;
    private prevButton!: HTMLButtonElement;
    private nextButton!: HTMLButtonElement;
    private dotsNav!: HTMLDivElement;
    private dots!: HTMLButtonElement[];

    constructor(elementOrSelector: string | HTMLElement, options: CarouselOptions = {}) {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector<HTMLElement>(elementOrSelector)
            : elementOrSelector;

        this.options = {
            loop: options.loop ?? false,
            autoPlay: options.autoPlay ?? false,
            autoPlayInterval: options.autoPlayInterval ?? 3000
        };

        if (!element) {
            console.error('element not found');
            this.root = document.createElement('div');
            return;
        }

        this.root = element;

        this.init();
    }

    private init(): void {
        this.setupDOM();
        this.slides = Array.from(this.track.children) as HTMLElement[];
        this.slideWidth = this.slides[0].getBoundingClientRect().width;
        this.currentIndex = 0;
        this.bindEvents();
        this.updateDots(0);
        if (this.options.autoPlay) {
            this.startAutoPlay();
        }
    }

    private setupDOM(): void {
        const slides = Array.from(this.root.children) as HTMLElement[];
        const container = document.createElement('div');
        container.classList.add('carousel-track-container');

        this.track = document.createElement('ul');
        this.track.classList.add('carousel-track');

        slides.forEach(slide => {
            slide.classList.add('carousel-slide');
            this.track.appendChild(slide);
        });

        container.appendChild(this.track);
        this.root.appendChild(container);

        this.prevButton = document.createElement('button');
        this.prevButton.classList.add('carousel-button', 'carousel-button--left');
        this.prevButton.innerHTML = '<span class="icon-navigate_before icon"></span>';
        this.prevButton.setAttribute('aria-label', 'Previous Slide');

        this.nextButton = document.createElement('button');
        this.nextButton.classList.add('carousel-button', 'carousel-button--right');
        this.nextButton.innerHTML = '<span class="icon-navigate_next icon"></span>';
        this.nextButton.setAttribute('aria-label', 'Next Slide');

        this.root.appendChild(this.prevButton);
        this.root.appendChild(this.nextButton);

        this.dotsNav = document.createElement('div');
        this.dotsNav.classList.add('carousel-nav');

        this.dots = [];
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel-indicator');
            dot.setAttribute('aria-label', `Slide ${index + 1}`);
            this.dotsNav.appendChild(dot);
            this.dots.push(dot);
        });

        this.root.appendChild(this.dotsNav);
    }

    private bindEvents(): void {
        this.nextButton.addEventListener('click', () => this.moveToNextSlide());
        this.prevButton.addEventListener('click', () => this.moveToPrevSlide());

        this.dotsNav.addEventListener('click', (e: MouseEvent) => {
            const targetDot = (e.target as HTMLElement).closest('button');
            if (!targetDot) return;

            const targetIndex = this.dots.findIndex(dot => dot === targetDot);
            this.moveToSlide(targetIndex);
        });

        window.addEventListener('resize', () => {
            this.slideWidth = this.slides[0].getBoundingClientRect().width;
            this.moveToSlide(this.currentIndex, false);
        });

        this.addTouchSupport();
    }

    private moveToSlide(targetIndex: number, animate: boolean = true): void {
        if (targetIndex < 0) {
            if (this.options.loop) targetIndex = this.slides.length - 1;
            else targetIndex = 0;
        } else if (targetIndex >= this.slides.length) {
            if (this.options.loop) targetIndex = 0;
            else targetIndex = this.slides.length - 1;
        }

        const amountToMove = -1 * (this.slideWidth * targetIndex);
        this.track.style.transform = `translateX(${amountToMove}px)`;

        this.updateDots(targetIndex);
        this.currentIndex = targetIndex;
    }

    private moveToNextSlide(): void {
        this.moveToSlide(this.currentIndex + 1);
    }

    private moveToPrevSlide(): void {
        this.moveToSlide(this.currentIndex - 1);
    }

    private updateDots(targetIndex: number): void {
        this.dots.forEach(dot => dot.classList.remove('current-slide'));
        this.dots[targetIndex].classList.add('current-slide');
    }

    private addTouchSupport(): void {
        let startX = 0;
        let isDragging = false;

        this.track.addEventListener('touchstart', (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        this.track.addEventListener('touchend', (e: TouchEvent) => {
            if (!isDragging) return;
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) {
                if (diffX > 0) this.moveToNextSlide();
                else this.moveToPrevSlide();
            }
            isDragging = false;
        });
    }

    private startAutoPlay(): void {
        setInterval(() => {
            this.moveToNextSlide();
        }, this.options.autoPlayInterval);
    }
}