const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

class FontEditorHeader extends ui.Widget {
    constructor() { super(); }

    _Init() {
        super._Init();


    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            }
        }, super._Style());
    }

    _Render(){
        super._Render();
        this._title = new ui.manipulators.Text(ui.dom.El("div", {class:"title"}, this));
        this._title.Set("Headitor");
    }

}

module.exports = FontEditorHeader;
ui.Register(`mkfont-font-editor-header`, FontEditorHeader);