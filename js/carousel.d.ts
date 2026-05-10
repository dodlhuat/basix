interface CarouselOptions {
    loop?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
}
declare class Carousel {
    private root;
    private options;
    private track;
    private slides;
    private slideWidth;
    private currentIndex;
    private prevButton;
    private nextButton;
    private dotsNav;
    private dots;
    private autoPlayTimer;
    private abortController;
    constructor(elementOrSelector: string | HTMLElement, options?: CarouselOptions);
    private init;
    private setupDOM;
    private bindEvents;
    private moveToSlide;
    private moveToNextSlide;
    private moveToPrevSlide;
    private updateDots;
    private addTouchSupport;
    private startAutoPlay;
    private pauseAutoPlay;
    private resumeAutoPlay;
    destroy(): void;
}
export { Carousel };
export type { CarouselOptions };
