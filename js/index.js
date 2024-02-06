import {utils} from "./utils.js";
import {select} from "./select.js";
import {scrollbar} from "./scrollbar.js";
import {modal} from "./modal.js";

utils.ready(function () {
    const single_selectpicker = select.init('#single-select');
    const multi_selectpicker = select.init('#multi-select');
    scrollbar.init('.scrollbar');

    const elements = utils.getElement('.show-modal');
    if (elements.length > 0) {
        utils.getElement('.show-modal').addEventListener('click', function () {
            const buttons = '<div class="buttons">\<button class="button-light">Close</button><button>Save Changes</button></div>';
            modal.show('bluffi', 'blaffi', buttons);
        })
    }

});