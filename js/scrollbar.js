import {utils} from "./utils.js";

// TODO: funktion drauß machen damit man mehrere haben kann
/*
das hier einfügen direkt als erstes im container
<div class="scroll-wrapper"><div class="scroll"><span class="anchor"></span></div></div>
 */

const scrollbar = {}

scrollbar.init = function (container) {
    const controls = document.createElement('div');
    controls.className = 'scroll-wrapper';
    controls.innerHTML = '<div class="scroll hidden"><span class="anchor"></span></div>';


    const content = container.children;
    // subtract 1 rem margin
    const containerHeight = container.offsetHeight - convertRemToPixels(1);
    let contentHeight = 0;
    for (let i = 0; i < content.length; i++) {
        contentHeight += content[i].scrollHeight;
    }
    if (contentHeight === 0) {
        contentHeight = container.scrollHeight - convertRemToPixels(1);
    }

    if (containerHeight >= contentHeight) {
        // no scrollbar if not needed
        return;
    }
    container.prepend(controls);

    const anchor = container.querySelector('.anchor');
    anchor.dataset.height = Math.floor(containerHeight / contentHeight * containerHeight);
    anchor.style.height = anchor.dataset.height + 'px';

    let flag_mouseDown = false;
    let oldMousePosition = 0;
    let oldAnchorPosition = 0;

    const scrollBarContainer = container.querySelector('.scroll');
    scrollBarContainer.addEventListener('mousedown', function(e) {
        if (e.target.nodeName === 'DIV') {
            let distance = e.clientY - container.offsetTop - anchor.offsetHeight / 2;
            if (distance < 0) {
                distance = 0;
            } else if (distance + anchor.offsetHeight > containerHeight) {
                distance = containerHeight - anchor.offsetHeight;
            }
            anchor.style.top = distance + 'px';
            moveContent(anchor, containerHeight, contentHeight, content);
        } else if (e.target.nodeName === 'SPAN') {
            flag_mouseDown = true;
            oldMousePosition = e.clientY;
            oldAnchorPosition = anchor.offsetTop;
        }
    });
    scrollBarContainer.addEventListener('mouseup', function(e) {
        flag_mouseDown = false;
        oldMousePosition = e.clientY;
        oldAnchorPosition = anchor.offsetTop;
    });
    scrollBarContainer.addEventListener('mousemove', function(e) {
        if (!flag_mouseDown) {
            return;
        }
        let distance = e.clientY - oldMousePosition;
        oldMousePosition = e.clientY;
        moveAnchor(oldAnchorPosition, distance, anchor, containerHeight, contentHeight, content);
    });
    container.addEventListener("wheel", (event) => {
        let position = parseInt(anchor.dataset.position);
        if (isNaN(position)) {
            position = 1;
        }
        if (event.deltaY > 0) {
            if (position === 0) {
                ++position;
            }
        } else {
            if (anchor.offsetHeight + position === containerHeight) {
                --position;
            }
        }
        if (position > 0 && anchor.offsetHeight + position < containerHeight) {
            event.preventDefault();
        }
        moveAnchor(oldAnchorPosition, event.deltaY / 15, anchor, containerHeight, contentHeight, content);
    });
    container.addEventListener("mouseover", function () {
        // todo: animation oder nur kleiner werden lassen
        scrollBarContainer.classList.remove('hidden')
    });
    container.addEventListener("mouseout", function () {
        scrollBarContainer.classList.add('hidden')
    });
}

utils.ready(function () {
    const selector = '.scrollbar';

    document.querySelectorAll(selector).forEach(element => {
        scrollbar.init(element);
    });
    /*
    const container = utils.getElement(selector)
    const content = utils.getElement(selector + ' > *:not(#scroll)')

    // subtract 1 rem margin
    const containerHeight = container.offsetHeight - convertRemToPixels(1);
    let contentHeight = 0;
    for (let i = 0; i < content.length; i++) {
        contentHeight += content[i].scrollHeight;
    }

    const anchor = utils.getElement(selector + ' .anchor')
    anchor.dataset.height = Math.floor(containerHeight / contentHeight * containerHeight);
    anchor.style.height = anchor.dataset.height + 'px';

    let flag_mouseDown = false;
    let oldMousePosition = 0;
    let oldAnchorPosition = 0;

    const scrollBarContainer = utils.getElement(selector + ' .scroll');
    scrollBarContainer.addEventListener('mousedown', function(e) {
        if (e.target.nodeName === 'DIV') {
            let distance = e.clientY - container.offsetTop - anchor.offsetHeight / 2;
            if (distance < 0) {
                distance = 0;
            } else if (distance + anchor.offsetHeight > containerHeight) {
                distance = containerHeight - anchor.offsetHeight;
            }
            anchor.style.top = distance + 'px';
            moveContent(anchor, containerHeight, contentHeight, content);
        } else if (e.target.nodeName === 'SPAN') {
            flag_mouseDown = true;
            oldMousePosition = e.clientY;
            oldAnchorPosition = anchor.offsetTop;
        }
    });
    scrollBarContainer.addEventListener('mouseup', function(e) {
        flag_mouseDown = false;
        oldMousePosition = e.clientY;
        oldAnchorPosition = anchor.offsetTop;
    });
    scrollBarContainer.addEventListener('mousemove', function(e) {
        if (!flag_mouseDown) {
            return;
        }
        let distance = e.clientY - oldMousePosition;
        oldMousePosition = e.clientY;
        moveAnchor(oldAnchorPosition, distance, anchor, containerHeight, contentHeight, content);
    });

    container.addEventListener("wheel", (event) => {
        let position = parseInt(anchor.dataset.position);
        if (isNaN(position)) {
            position = 1;
        }
        if (event.deltaY > 0) {
            if (position === 0) {
                ++position;
            }
        } else {
            if (anchor.offsetHeight + position === containerHeight) {
                --position;
            }
        }
        if (position > 0 && anchor.offsetHeight + position < containerHeight) {
            event.preventDefault();
        }
        moveAnchor(oldAnchorPosition, event.deltaY / 15, anchor, containerHeight, contentHeight, content);
    });
    */
});

const convertRemToPixels = function(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const moveContent = function(anchor, containerHeight, contentHeight, content) {
    let position = anchor.offsetTop / (containerHeight - anchor.offsetHeight);
    let newPosition = (0 - position * (contentHeight - containerHeight)) + 'px';
    for (let i = 0; i < content.length; i++) {
        content[i].style.marginTop = newPosition;
    }
};

const moveAnchor = function(oldAnchorPosition, distance, anchor, containerHeight, contentHeight, content) {
    oldAnchorPosition = anchor.offsetTop;
    let newPosition = oldAnchorPosition + distance;

    if (newPosition < 0) {
        newPosition = 0;
    } else if (newPosition + anchor.offsetHeight > containerHeight) {
        newPosition = containerHeight - anchor.offsetHeight;
    }
    anchor.style.top = newPosition + 'px';
    anchor.dataset.position = newPosition
    moveContent(anchor, containerHeight, contentHeight, content);
}