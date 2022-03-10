/*const nkm = require(`@nkmjs/core`);*/
const u = nkm.utils;
const ui = nkm.ui;

class MainShelf extends nkm.uilib.views.Shelf {
    constructor() { super(); }

    //static __default_navPlacement = ui.FLAGS.RIGHT;

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                
            },
        }, super._Style());
    }


}

module.exports = MainShelf;
ui.Register(`mkfont-main-shelf`, MainShelf);