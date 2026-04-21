import { escapeHtml } from './utils.js';
class MasonryGallery {
    constructor(containerId, options) {
        this.columns = [];
        this.isFetching = false;
        this.resizeObserver = null;
        this.abortController = null;
        this.reloaded = 0;
        this.handleScroll = () => {
            if (this.isFetching)
                return;
            const rect = this.container.getBoundingClientRect();
            if (rect.bottom > 0 && rect.bottom <= window.innerHeight + this.options.scrollThreshold) {
                this.loadMoreImages();
            }
        };
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = container;
        this.loader = document.querySelector(options.loaderSelector || ".loader");
        this.options = {
            minColumnWidth: options.minColumnWidth ?? 250,
            scrollThreshold: options.scrollThreshold ?? 100,
            reload: 2,
            fetchFunction: options.fetchFunction,
        };
        this.init();
    }
    init() {
        this.setupLayout();
        this.loadMoreImages();
        this.addEventListeners();
    }
    setupLayout() {
        const containerWidth = this.container.getBoundingClientRect().width;
        const numColumns = Math.max(1, Math.floor(containerWidth / this.options.minColumnWidth));
        if (this.columns.length !== numColumns) {
            this.container.innerHTML = "";
            this.columns = [];
            for (let i = 0; i < numColumns; i++) {
                const col = document.createElement("div");
                col.className = "masonry-column";
                this.container.appendChild(col);
                this.columns.push(col);
            }
        }
    }
    addEventListeners() {
        let resizeTimeout;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.reLayout();
            }, 200);
        });
        this.abortController = new AbortController();
        window.addEventListener("scroll", this.handleScroll, {
            passive: true,
            signal: this.abortController.signal,
        });
    }
    reLayout() {
        const items = [];
        this.columns.forEach((col) => {
            Array.from(col.children).forEach((child) => {
                items.push(child);
            });
            col.innerHTML = "";
        });
        const availableWidth = Math.min(1200, window.innerWidth - 40);
        const numColumns = Math.max(1, Math.floor(availableWidth / this.options.minColumnWidth));
        if (this.columns.length !== numColumns) {
            this.container.innerHTML = "";
            this.columns = [];
            for (let i = 0; i < numColumns; i++) {
                const col = document.createElement("div");
                col.className = "masonry-column";
                this.container.appendChild(col);
                this.columns.push(col);
            }
        }
        items.forEach((item) => {
            this.addToShortestColumn(item);
        });
    }
    async loadMoreImages(isAutoFill = false) {
        if (!isAutoFill)
            this.reloaded++;
        if (this.options.reload > 0 && this.reloaded > this.options.reload) {
            console.warn("Maximum reload limit reached.");
            return;
        }
        if (this.isFetching)
            return;
        this.isFetching = true;
        this.toggleLoader(true);
        try {
            const newImages = await this.options.fetchFunction();
            this.renderImages(newImages);
        }
        catch (error) {
            throw new Error("Error loading images: " + error);
        }
        finally {
            this.isFetching = false;
            this.toggleLoader(false);
            // If the rendered content doesn't fill the viewport, auto-load the next
            // batch without waiting for a scroll event (multi-column layout is shorter)
            requestAnimationFrame(() => {
                const rect = this.container.getBoundingClientRect();
                if (rect.bottom <= window.innerHeight + this.options.scrollThreshold) {
                    this.loadMoreImages(true);
                }
            });
        }
    }
    toggleLoader(show) {
        if (this.loader) {
            this.loader.classList.toggle("hidden", !show);
        }
    }
    renderImages(imageDataList) {
        // Sort columns by current height so we start filling from the shortest.
        // Then round-robin across them — this avoids the problem where unloaded
        // images (0 height) cause offsetHeight-based distribution to pile all
        // new items into a single column.
        const sorted = [...this.columns].sort((a, b) => a.offsetHeight - b.offsetHeight);
        imageDataList.forEach((data, index) => {
            const item = this.createCard(data);
            const col = sorted[index % sorted.length];
            col.appendChild(item);
            requestAnimationFrame(() => {
                const img = item.querySelector("img");
                if (img) {
                    img.addEventListener("load", () => img.classList.add("loaded"), {
                        once: true,
                    });
                    if (img.complete) {
                        img.classList.add("loaded");
                    }
                }
            });
        });
    }
    createCard(data) {
        const div = document.createElement("div");
        div.className = "masonry-item";
        div.innerHTML = `
      <img src="${escapeHtml(data.src)}" alt="${escapeHtml(data.title)}" loading="lazy">
      <div class="masonry-item-info">
        <h3 class="masonry-item-title">${escapeHtml(data.title)}</h3>
        <p class="masonry-item-desc">${escapeHtml(data.desc)}</p>
      </div>
    `;
        return div;
    }
    addToShortestColumn(element) {
        if (this.columns.length === 0)
            return;
        let shortestCol = this.columns[0];
        let minHeight = shortestCol.offsetHeight;
        for (let i = 1; i < this.columns.length; i++) {
            const h = this.columns[i].offsetHeight;
            if (h < minHeight) {
                minHeight = h;
                shortestCol = this.columns[i];
            }
        }
        shortestCol.appendChild(element);
    }
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}
export { MasonryGallery };
