class ImageGallery {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Gallery container not found');
            return;
        }

        this.options = {
            batchSize: options.batchSize || 12,
            threshold: options.threshold || 200,
        };

        this.page = 1;
        this.isLoading = false;

        this.init();
    }

    init() {
        this.grid = document.createElement('div');
        this.grid.className = 'gallery-grid';
        this.container.appendChild(this.grid);

        this.loader = document.createElement('div');
        this.loader.className = 'gallery-loader';
        this.loader.innerHTML = '<div class="spinner"></div>';
        this.container.appendChild(this.loader);

        // Setup Overlay
        this.createOverlay();

        this.setupObserver();
        this.bindEvents();
        this.loadMore();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'gallery-overlay';

        this.overlay.innerHTML = `
            <div class="gallery-overlay-inner">
                <button class="gallery-close" aria-label="Close">&times;</button>
                <img src="" alt="" class="gallery-overlay-image">
            </div>
        `;

        document.body.appendChild(this.overlay);
        this.overlayImage = this.overlay.querySelector('.gallery-overlay-image');
        this.closeButton = this.overlay.querySelector('.gallery-close');
    }

    bindEvents() {
        // Event delegation for opening images
        this.grid.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const img = item.querySelector('img');
                if (img) {
                    this.openOverlay(img.src);
                }
            }
        });

        // Close events
        this.closeButton.addEventListener('click', () => this.closeOverlay());

        // Close on clicking outside image
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay || e.target.classList.contains('gallery-overlay-inner')) {
                this.closeOverlay();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.closeOverlay();
            }
        });
    }

    openOverlay(src) {
        this.overlayImage.src = src;
        this.overlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    closeOverlay() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        // Clear src after transition to prevent stale image flash on next open (timeout matches CSS transition)
        setTimeout(() => {
            if (!this.overlay.classList.contains('active')) {
                this.overlayImage.src = '';
            }
        }, 300);
    }

    setupObserver() {
        const options = {
            root: null,
            rootMargin: `0px 0px ${this.options.threshold}px 0px`,
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, options);

        this.observer.observe(this.loader);
    }

    async loadMore() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.loader.classList.add('visible');

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const images = this.generateImages(this.options.batchSize);
            this.render(images);
            this.page++;
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            this.isLoading = false;
            this.loader.classList.remove('visible');
        }
    }

    generateImages(count) {
        const images = [];
        for (let i = 0; i < count; i++) {
            const id = Math.floor(Math.random() * 1000) + 1;
            images.push({
                url: `https://picsum.photos/id/${id}/800/800`, // Slightly larger for better lightbox quality
                alt: `Image ${id}`
            });
        }
        return images;
    }

    render(images) {
        images.forEach(imgData => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = imgData.alt;
            img.className = 'gallery-image';
            img.loading = 'lazy';

            img.style.opacity = '0';
            img.onload = () => img.style.opacity = '1';

            item.appendChild(img);
            this.grid.appendChild(item);
        });
    }
}
