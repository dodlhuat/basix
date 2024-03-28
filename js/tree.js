// todo: auch einen checkbox tree

const tree = {
    init(selector, data) {
        let tree = '<ul>';
        tree += buildTree(data);
        tree += '</ul>';

        const selector_element = document.querySelector(selector);
        selector_element.classList.add('tree');
        selector_element.innerHTML = tree;

        document.querySelectorAll('.tree li').forEach(function (folder) {
            folder.addEventListener('click', function () {
                console.log('li clicked');
            })
        })
    }
}

const buildTree = function (data, hidden) {
    let tree = '';
    data.forEach(function (element, index) {
        tree += '<li>';
        tree += getFolder(element.name, hidden);
        if (element.children.length > 0) {
            tree += '<ul class="hidden">';
            tree += buildTree(element.children);
            tree += '</ul>';
        }
        tree += '</li>';
    });
    return tree;
}

const getFolder = function (name) {
    let folder = '';
    folder += getFolderIcon();
    folder += getFolderNameElement(name);

    let div = document.createElement('div');
    div.className = 'li-content'
    div.innerHTML = folder
    return div.outerHTML;
}

const getFolderIcon = function (hidden) {
    let span = document.createElement('span');
    span.classList.add('icon', 'icon-folder');
    if (hidden !== undefined && hidden === true) {
        span.classList.add('hidden');
    }
    return span.outerHTML;
}

const getFolderNameElement = function (name) {
    let div = document.createElement('div');
    div.className = 'folder-name';
    div.innerText = name;
    return div.outerHTML;
}

export {tree}