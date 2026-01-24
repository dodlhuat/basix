interface CarouselOptions {
    loop?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
}
export declare class Carousel {
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
}
export {};
//# sourceMappingURL=carousel.d.ts.map