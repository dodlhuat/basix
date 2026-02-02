interface ImageData {
  src: string;
  title: string;
  desc: string;
}

interface MasonryGalleryOptions {
  minColumnWidth?: number;
  scrollThreshold?: number;
  loaderSelector?: string;
  reload?: number;
  fetchFunction?: Promise<ImageData[]>;
}

class MasonryGallery {
  private container: HTMLElement;
  private readonly loader: HTMLElement | null;
  private options: Required<Omit<MasonryGalleryOptions, "loaderSelector">>;
  private columns: HTMLDivElement[] = [];
  private isFetching: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private abortController: AbortController | null = null;
  private reloaded = 0;

  constructor(containerId: string, options: MasonryGalleryOptions = {}) {
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
      fetchFunction: options.fetchFunction ?? this.fetchMockImages(),
    };

    this.init();
  }

  private init(): void {
    this.setupLayout();
    this.loadMoreImages();
    this.addEventListeners();
  }

  private setupLayout(): void {
    const containerWidth = this.container.getBoundingClientRect().width;
    const numColumns = Math.max(
      1,
      Math.floor(containerWidth / this.options.minColumnWidth),
    );

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

  private addEventListeners(): void {
    let resizeTimeout: number;
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

  private reLayout(): void {
    const items: HTMLElement[] = [];
    this.columns.forEach((col) => {
      Array.from(col.children).forEach((child) => {
        items.push(child as HTMLElement);
      });
      col.innerHTML = "";
    });

    const availableWidth = Math.min(1200, window.innerWidth - 40);
    const numColumns = Math.max(
      1,
      Math.floor(availableWidth / this.options.minColumnWidth),
    );

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

  private handleScroll = (): void => {
    if (this.isFetching) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (
      scrollTop + clientHeight >=
      scrollHeight - this.options.scrollThreshold
    ) {
      this.loadMoreImages();
    }
  };

  private async loadMoreImages(): Promise<void> {
    this.reloaded++;
    if (this.options.reload > 0 && this.reloaded > this.options.reload) {
      console.warn("Maximum reload limit reached.");
      return;
    }
    if (this.isFetching) return;

    this.isFetching = true;
    this.toggleLoader(true);

    try {
      const newImages = await this.options.fetchFunction;
      this.renderImages(newImages);
    } catch (error) {
      throw new Error("Error loading images: " + error);
    } finally {
      this.isFetching = false;
      this.toggleLoader(false);
    }
  }

  private toggleLoader(show: boolean): void {
    if (this.loader) {
      this.loader.classList.toggle("hidden", !show);
    }
  }

  private fetchMockImages(): Promise<ImageData[]> {
    throw Error("Method not implemented.");
  }

  private renderImages(imageDataList: ImageData[]): void {
    imageDataList.forEach((data) => {
      const item = this.createCard(data);
      this.addToShortestColumn(item);

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

  private createCard(data: ImageData): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "masonry-item";

    div.innerHTML = `
      <img src="${this.escapeHtml(data.src)}" alt="${this.escapeHtml(data.title)}" loading="lazy">
      <div class="masonry-item-info">
        <h3 class="masonry-item-title">${this.escapeHtml(data.title)}</h3>
        <p class="masonry-item-desc">${this.escapeHtml(data.desc)}</p>
      </div>
    `;

    return div;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private addToShortestColumn(element: HTMLElement): void {
    if (this.columns.length === 0) return;

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

  public destroy(): void {
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

export { MasonryGallery, ImageData };
