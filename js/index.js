import {utils} from "./utils.js";
import {select} from "./select.js";
import {Scrollbar} from "./scrollbar.js";
import {modal} from "./modal.js";
import {menu} from "./push-menu.js";
import {toast} from "./toast.js";
import {datepicker} from "./datepicker.js";
import {tree} from "./tree.js";

utils.ready(function () {
    select.init('#single-select');
    select.init('#multi-select');
    select.listen(document.querySelector('.user.select'))
    Scrollbar.initAll('.scroll-container');

    const elements = document.querySelectorAll('.show-modal');
    if (elements !== undefined) {
        document.querySelector('.show-modal').addEventListener('click', function () {
            const buttons = '<div class="buttons">\<button class="button-light">Close</button>&nbsp;<button>Save Changes</button></div>';
            modal.show('bluffi', '<strong>blaffi</strong>', buttons);
        })
    }

    document.querySelector('.show-toast').addEventListener('click', function () {
        toast.show('some content', 'some header', 'success', true, 3000);
    });


    menu.init();

    utils.showCode();

    datepicker.init();

    console.log(select.value('#single-select'));

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