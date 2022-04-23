const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const base = ui.WidgetBar;
class GlyphSlotQuickmenu extends base {
    constructor() { super(); }

    static __defaultOrientation = ui.FLAGS.VERTICAL;

    _Init() {
        super._Init();
        this._editor = null;
    }

    get editor() { return this._editor; }
    set editor(p_value) { this._editor = p_value; }

    _PostInit() {
        super._PostInit();
        this.options = {
            //inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            size: ui.FLAGS.SIZE_S,
            handles: [
                {
                    icon: `new`, htitle: `Empty glyph.\nClears existing data, or create an empty glyph in place of an empty unicode slot.`,
                    flavor: ui.FLAGS.CTA, // variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdGlyphClear.Execute(this._SecureData()); } },
                    member: { owner: this, id: `_newBtn` }
                },
                {
                    icon: `remove`, htitle: `Delete Glyph from font`,
                    flavor: nkm.com.FLAGS.ERROR, //variant: ui.FLAGS.FRAME,
                    trigger: { fn: () => { this.editor.cmdGlyphDelete.Execute(this._SecureData()); } },
                    member: { owner: this, id: `_deleteGlyphBtn` }
                },
                {
                    icon: `text-unicode`, htitle: `Copy unicode Hex to clipboard`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { mkfCmds.ExportSingleUniHex.Execute(this._glyphInfos); } },
                    member: { owner: this, id: `_copyUniBtn` }
                }
            ]
        };
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'transition': `opacity 0.25s ease`,
                'background-color': 'rgba(19, 19, 19, 0.8)',
                'border-radius': `4px`,
                'padding': `3px`,
            },
        }, base._Style());
    }

    _Render() {
        super._Render();
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (!this._data) { return; }

        this._deleteGlyphBtn.visible = !this._data.glyph.isNull;
        this._newBtn.visible = (this._data.glyph.isNull && !this._data.Get(mkfData.IDS.EMPTY));
    }

    _SecureData() {
        if (this._data.glyph.isNull) { this._data.glyph.unicodeInfos = this._glyphInfos; }
        return this._data;
    }

    set glyphInfos(p_infos) {
        this._glyphInfos = p_infos;
    }

}

module.exports = GlyphSlotQuickmenu;
ui.Register(`mkfont-glyph-slot-quickmenu`, GlyphSlotQuickmenu);