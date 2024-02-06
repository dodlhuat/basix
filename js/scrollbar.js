import {utils} from "./utils.js";

const getAnchorHeight = function (containerHeight, contentHeight) {
    return Math.floor(containerHeight / contentHeight * containerHeight);
}

const convertRemToPixels = function (rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const moveAnchor = function (event) {
    const content = event.currentTarget;
    let topPosition = Math.round((content.scrollTop * content.options.scrollMultiplier) * 100) / 100;
    content.options.anchor.style.top = topPosition + 'px';
    return topPosition;
}

const buildControls = function (container) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'scroll-content';
    contentDiv.innerHTML = container.innerHTML;
    const controls = document.createElement('div');
    controls.className = 'scroll-wrapper';
    controls.innerHTML = '<div class="scroll-bar"><span class="scroll-anchor"></span></div>';
    container.innerHTML = '';
    container.append(contentDiv);

    const content = container.querySelector('.scroll-content');
    if (content.scrollHeight <= container.offsetHeight) {
        return false;
    }
    container.append(controls);
    content.style.height = container.offsetHeight - convertRemToPixels(2) + 'px';
    return content;
}

const scrollbar = {
    init() {
        const selector = '.scrollable';
        document.querySelectorAll(selector).forEach(container => {
            const content = buildControls(container);

            if (!content) return false;

            const anchorHeight = getAnchorHeight(container.offsetHeight, content.scrollHeight);
            const anchor = container.querySelector('.scroll-anchor');
            anchor.style.height = anchorHeight + 'px';

            const scrollBar = container.querySelector('.scroll-bar');
            const scrollBarHeight = scrollBar.offsetHeight;

            const maxScroll = content.scrollHeight - content.offsetHeight;
            const scrollMultiplier = (1 / maxScroll) * (scrollBarHeight - anchorHeight);

            content.options = {
                scrollMultiplier,
                anchor
            }

            content.removeEventListener('scroll', moveAnchor)
            content.addEventListener('scroll', moveAnchor);
        });
        let doIt = 0;
        window.onresize = function () {
            clearTimeout(doIt);
            doIt = setTimeout(scrollbar.resize, 100);
        }
    },
    resize() {
        console.warn('resize event');
    }
}

export {scrollbar}