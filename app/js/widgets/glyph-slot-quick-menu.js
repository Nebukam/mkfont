const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

class GlyphSlotQuickmenu extends ui.WidgetBar {
    constructor() { super(); }

    static __defaultOrientation = ui.FLAGS.VERTICAL;

    _Init() {
        super._Init();
    }

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
                    trigger: { fn: () => { this.editor.cmdImportEmpty.Execute(this._SecureData()); } },
                    member: { owner: this, id: `_newBtn` }
                },/*
                {
                    icon: `edit`, htitle: `Edit using default SVG editor`,
                    variant: ui.FLAGS.MINIMAL,
                    group: `read`, member: { owner: this, id: `_editInPlaceBtn` }
                },
                {
                    icon: `clipboard-write`, htitle: `Copy glyph to clipboard`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => {
                            //mkfCmds.ExportToClipboard.emitter = this;
                            mkfCmds.ExportToClipboard.Execute(this._data);
                        }
                    },
                    member: { owner: this, id: `_writeToClipboardBtn` }
                },*/
                {
                    icon: `remove`, htitle: `Delete Glyph from font`,
                    flavor: nkm.com.FLAGS.ERROR, //variant: ui.FLAGS.FRAME,
                    trigger: {
                        fn: () => {
                            mkfCmds.DeleteGlyph.emitter = this;
                            mkfCmds.DeleteGlyph.Execute(this._SecureData());
                        }
                    },
                    member: { owner: this, id: `_deleteGlyphBtn` }
                },
                {
                    icon: `text-unicode`, htitle: `Copy unicode Hex to clipboard`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => {
                            mkfCmds.ExportUniHexSingleToClipboard.Execute(this._data.glyph.unicodeInfos);
                        }
                    },
                    member: { owner: this, id: `_copyUniBtn` }
                }
            ]
        };
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'transition': `opacity 0.25s ease`,
                'background-color': 'rgba(19, 19, 19, 0.8)',
                'border-radius': `4px`,
                'padding': `3px`,
            },
        }, super._Style());
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