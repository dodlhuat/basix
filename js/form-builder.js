let draggedElement = null;
let action = 'copy';

let formbuilder = {
    init() {
        document.querySelectorAll('.draggable').forEach(function (element) {
            element.removeEventListener("dragstart", dragAction);
            element.addEventListener("dragstart", dragAction);
        });
        initDropzones();
    }
}

const moveAction = function (event) {
    draggedElement = event.target;
    action = 'move';
}
const dragAction = function (event) {
    draggedElement = event.target;
    action = 'copy';
}
const addMoveListeners = function () {
    document.querySelectorAll('.movable').forEach(function (element) {
        element.removeEventListener("dragstart", moveAction);
        element.addEventListener("dragstart", moveAction);
    });
}

const dropEvent = function (event) {
    event.preventDefault();
    let node = draggedElement;
    if (action === 'copy') {
        node = draggedElement.cloneNode(true);
    }
    node.classList.remove('draggable');
    node.classList.add('movable');
    const label = node.querySelector('span.label');
    if (label) {
        label.setAttribute('contenteditable', true);
    }
    const pElement = node.querySelector('p');
    if (pElement) {
        pElement.setAttribute('contenteditable', true);
    }
    event.target.appendChild(node);
    addMoveListeners();
}

const dragOverEvent = function (event) {
    event.preventDefault();
    event.dataTransfer.effectAllowed = action;
}

const initDropzones = function () {
    document.querySelectorAll('.dropzone').forEach(function (dropzone) {
        dropzone.removeEventListener('drop', dropEvent);
        dropzone.addEventListener('drop', dropEvent);
        dropzone.removeEventListener('dragover', dragOverEvent);
        dropzone.addEventListener('dragover', dragOverEvent);
    });
}

export {formbuilder}