import {utils} from "./utils.js";
import {Select} from "./select.js";
import {Scrollbar} from "./scrollbar.js";
import {Modal} from "./modal.js";
import {PushMenu} from "./push-menu.js";
import {Toast} from "./toast.js";
import {Datepicker} from "./datepicker.js";
import {tree} from "./tree.js";
import {Theme} from "./theme.js";
import {Table} from "./table.js";

utils.ready(function () {
    Scrollbar.initAll('.scroll-container');
    Theme.init();
    Table.initAll();

    new Select('#single-select');
    new Select('#multi-select');
    new Select('.table-controls .input');

    const elements = document.querySelectorAll('.show-modal');
    if (elements !== undefined) {
        document.querySelector('.show-modal').addEventListener('click', function () {
            const buttons = '<div class="buttons">\<button class="button-light">Close</button>&nbsp;<button>Save Changes</button></div>';
            let modal = new Modal('bluffi', '<strong>blaffi</strong>', buttons);
            modal.show();

            console.warn('buttons have no bound listeners');
        })
    }

    document.querySelector('.show-toast').addEventListener('click', function () {
        let toast = new Toast('some content', 'some header', 'success', true)
        toast.show(3000);
    });

    PushMenu.init();
    utils.showCode();
    Datepicker.initAll();

    const data = [
        {
            "name": "Eins",
            "content": [
                "<span class=\"icon icon-article icon-spacer\"></span> filename.txt",
                "146kb",
                "Rev1.0",
                "2024-01-01 12.27:02"
            ],
            "children": []
        },
        {
            "name": "Zwei",
            "content": [
                "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
            ],
            "children": [
                {
                    "name": "Zwei.Eins",
                    "content": [],
                    "children": []
                },
                {
                    "name": "Zwei.Zwei",
                    "content": [],
                    "children": [
                        {
                            "name": "Zwei.Zwei.Null",
                            "content": [],
                            "children": []
                        },
                        {
                            "name": "Zwei.Zwei.Eins",
                            "content": [],
                            "children": []
                        },
                    ]
                }
            ]
        },
        {
            "name": "Drei",
            "content": [],
            "children": []
        }
    ];
    tree.init('.built-tree', data);

});