let dragged_element = null;
let action = 'copy';
let row_count = 1;

let formbuilder = {
    init() {
        document.querySelectorAll('.draggable').forEach(function (element) {
            element.removeEventListener("dragstart", dragAction);
            element.addEventListener("dragstart", dragAction);
        });
        initDropzones();
    },
    addRow() {
        document.querySelector('.form-content').innerHTML += buildRowElement();
    },
    addColumn() {

    },
    removeRow() {

    },
    removeColumn() {

    },
    load(file_name) {
        load(file_name).then((data) => {
            console.log(data);
        });
    }
}

const moveAction = function (event) {
    dragged_element = event.target;
    action = 'move';
}
const dragAction = function (event) {
    dragged_element = event.target;
    action = 'copy';
}
const addMoveListeners = function () {
    document.querySelectorAll('.movable').forEach(function (element) {
        element.removeEventListener("dragstart", moveAction);
        element.addEventListener("dragstart", moveAction);
    });
}

const load = async function (file_name) {
    const url = new URL(file_name,
        document.currentScript && document.currentScript.src || location.href)
    // fetch and parse template as string
    let template = await fetch(url)
    template = await template.text()
    template = new DOMParser().parseFromString(template, 'text/html')
        .querySelector('template')
    if (!template) throw new TypeError('No template element found')
    return template.innerHTML.trim()
}

const buildRowElement = function () {
    const row = document.createElement('div');
    row_count++;
    row.setAttribute('data-row-id', String(row_count));
    row.className = 'row';
    const col = document.createElement('div');
    col.className = 'column';
    const dropzone = document.createElement('div');
    dropzone.className = 'dropzone';
    col.innerHTML = dropzone.outerHTML;
    row.innerHTML = col.outerHTML;
    return row.outerHTML;
}

const dropEvent = function (event) {
    event.preventDefault();
    let node = dragged_element;
    if (action === 'copy') {
        node = dragged_element.cloneNode(true);
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