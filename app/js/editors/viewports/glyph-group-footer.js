const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfInspectors = require(`../inspectors`);
const mkfOperations = require(`../../operations`);

class GlyphGroupFooter extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        {
            options: {
                propertyId: mkfData.IDS.PREVIEW_SIZE,
                onSubmit: (p_input, p_id, p_value) => {
                    let editor = nkm.datacontrols.FindEditor(p_input);
                    editor.data.Set(p_id, p_value);
                },
                inputOnly: true
            },
            css:`slider`
        },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-height': 'auto',
                'padding': '10px 20px',
                'overflow': 'clip'
            },
            '.title': {
                'margin-bottom': '10px'
            },
            '.control': {

            },
            '.slider': {
                'width':`100px`
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
    }

    _OnEditorChanged(p_oldEditor) {
        this._displayInspector.editor = this._editor;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        //this._title.Set(p_data.Resolve(mkfData.IDS.FAMILY));
    }

}

module.exports = GlyphGroupFooter;
ui.Register(`mkfont-glyph-group-footer`, GlyphGroupFooter);