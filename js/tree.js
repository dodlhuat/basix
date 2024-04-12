// todo: auch einen checkbox tree

const tree = {
    init(selector, data) {
        let tree = '<ul>';
        tree += buildTree(data);
        tree += '</ul>';

        const selector_element = document.querySelector(selector);
        selector_element.classList.add('tree');
        selector_element.innerHTML = tree;

        document.querySelectorAll('.tree .li-content').forEach(function (folder) {
            folder.addEventListener('click', folderClickEvent);
        })
    }
}

const folderClickEvent = function () {
    const li_element = this.closest('li');
    const children = li_element.querySelector('ul');
    const folder = this.querySelector('.icon');
    const folder_content = li_element.querySelector('.folder-content');
    if (children !== null || folder_content !== null) {
        if (children !== null) children.classList.toggle('hidden');
        if (folder_content !== null) folder_content.classList.toggle('hidden');
        folder.classList.toggle('icon-folder');
        folder.classList.toggle('icon-folder_open');
        li_element.classList.toggle('opened')
    }
};

const buildContent = function (data) {
    const div = document.createElement('div');
    div.classList.add('folder-content', 'hidden');

    const spacer = document.createElement('div');
    spacer.classList.add('row', 'spacing-top');

    data.forEach(function (item, index) {
        const element = document.createElement('div');
        // TODO: vertical align center needs to be a setting as it will mess up html content
        element.classList.add('column', 'vertical-align-center');
        element.innerHTML = item;
        spacer.innerHTML += element.outerHTML;
    });

    div.innerHTML = spacer.outerHTML;

    return div.outerHTML;
}

const buildTree = function (data, hidden) {
    let tree = '';
    data.forEach(function (element, index) {
        const li = document.createElement('li');
        li.innerHTML += getFolder(element.name, element.content);
        if (element.children.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'hidden'
            ul.innerHTML += buildTree(element.children);
            li.innerHTML += ul.outerHTML;
        }
        tree += li.outerHTML;
    });
    return tree;
}

const getFolder = function (name, content) {
    let folder = '';
    folder += getFolderIcon();
    folder += getFolderNameElement(name);
    if (content !== undefined) {
        if (Array.isArray(content) && content.length > 0) {
            folder += buildContent(content);
        }
    }

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