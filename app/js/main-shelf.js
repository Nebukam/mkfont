const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const base = nkm.uilib.views.Shelf;
class MainShelf extends base {
    constructor() { super(); }

    //static __default_navPlacement = ui.FLAGS.RIGHT;

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                
            },
        }, base._Style());
    }


}

module.exports = MainShelf;
ui.Register(`mkfont-main-shelf`, MainShelf);