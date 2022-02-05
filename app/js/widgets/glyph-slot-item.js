const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class GlyphSlotItem extends ui.Widget {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {
        super._Init();
    }

    _Render() {
        super._Render();
    }

    _OnPaintChange() {

        super._OnPaintChange();
        if (this._isPainted) {
            this.style.opacity = 1;
            this._UpdateInfos();
        } else {
            this.style.opacity = 0;
        }
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

    }

    _OnDataUpdated(p_data) {

        super._OnDataUpdated(p_data);

    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphSlotItem;
ui.Register(`mkfont-glyph-slot`, GlyphSlotItem);