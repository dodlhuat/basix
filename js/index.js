import {utils} from "./utils.js";
import {select} from "./select.js";
import {scrollbar} from "./scrollbar.js";
import {modal} from "./modal.js";
import {menu} from "./push-menu.js";
import {toast} from "./toast.js";

utils.ready(function () {
    select.init('#single-select');
    select.init('#multi-select');

    scrollbar.init('.scrollbar');

    const elements = utils.getElement('.show-modal');
    if (elements !== undefined) {
        utils.getElement('.show-modal').addEventListener('click', function () {
            const buttons = '<div class="buttons">\<button class="button-light">Close</button><button>Save Changes</button></div>';
            modal.show('bluffi', '<strong>blaffi</strong>', buttons);
        })
    }

    utils.getElement('.show-toast').addEventListener('click', function () {
        toast.show('some content', 'some header');
    });


    menu.init();

    console.log(select.value('#single-select'));

});