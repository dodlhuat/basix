/**
 * LazyLoader - A class to lazy load content into elements when they scroll into view.
 *
 * how to use:
 * const lazyLoader = new LazyLoader({
 *                 selector: '.lazy-section',
 *                 rootMargin: '0px 0px 100px 0px', // Load 100px before element is visible
 *                 threshold: 0.1,
 *                 simulatedDelay: 2000, // 2 second delay to see the spinner
 *                 onLoad: (el) => console.log('Loaded content for', el),
 *                 onError: (err, el) => console.error('Failed to load', el)
 *             });
 *
 *  in html:
 *  <div class="lazy-section" data-src="content/reviews.html"></div>
 */
class LazyLoader {
    /**
     * @param {Object} options - Configuration options
     * @param {string} options.selector - CSS selector for elements to observe (default: '.lazy-load')
     * @param {string} options.attribute - Attribute containing the URL to load (default: 'data-src')
     * @param {string} options.rootMargin - IntersectionObserver rootMargin (default: '0px 0px 200px 0px')
     * @param {number} options.threshold - IntersectionObserver threshold (default: 0.1)
     * @param {Function} options.onError - Callback function when loading fails
     * @param {Function} options.onLoad - Callback function when loading succeeds
     */
    constructor(options = {}) {
        this.selector = options.selector || '.lazy-load';
        this.attribute = options.attribute || 'data-src';
        this.rootMargin = options.rootMargin || '0px 0px 200px 0px';
        this.threshold = options.threshold || 0.1;
        this.onError = options.onError || null;
        this.onLoad = options.onLoad || null;
        this.simulatedDelay = options.simulatedDelay || 0; // Delay in ms for testing
        this.init();
    }

    init() {
        this.elements = document.querySelectorAll(this.selector);

        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            this.setupScrollListener();
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: this.rootMargin,
            threshold: this.threshold
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadContent(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        this.elements.forEach(el => observer.observe(el));
    }

    setupScrollListener() {
        // Fallback for older browsers
        const checkVisible = () => {
            this.elements.forEach(el => {
                if (el.getAttribute(this.attribute)) {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    // Check if element is close to viewport (using approx 200px buffer like rootMargin)
                    if (rect.top <= windowHeight + 200) {
                        this.loadContent(el);
                    }
                }
            });
        };

        window.addEventListener('scroll', checkVisible);
        window.addEventListener('resize', checkVisible);
        // Initial check
        checkVisible();
    }

    async loadContent(element) {
        const url = element.getAttribute(this.attribute);
        if (!url) return;

        // Remove attribute so we don't try to load again if using scroll fallback
        element.removeAttribute(this.attribute);
        element.classList.add('loading');

        try {
            // Simulate network delay if configured
            if (this.simulatedDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, this.simulatedDelay));
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();

            element.innerHTML = html;
            element.classList.remove('loading');
            element.classList.add('loaded'); // Animation hook

            if (this.onLoad) this.onLoad(element);

        } catch (error) {
            console.error('LazyLoad Error:', error);
            element.classList.remove('loading');
            element.classList.add('error');
            element.innerHTML = '<div class="error-msg">Failed to load content.</div>';

            if (this.onError) this.onError(error, element);
        }
    }
}
