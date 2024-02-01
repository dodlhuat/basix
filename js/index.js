import {utils} from "./utils.js";
import {select} from "./select.js";

utils.ready(function () {
    const single_selectpicker = select.init('#single-select');
    const multi_selectpicker = select.init('#multi-select');
});