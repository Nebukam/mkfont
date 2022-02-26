const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../data`);
const GlyphRenderer = require(`./glyph-renderer`);
const GlyphCanvasRenderer = require(`./glyph-canvas-renderer`);

class ControlHeader extends ui.Widget {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {

        this.default_SelectOnActivation = true;

        super._Init();

        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

        this._optionsHandler = new nkm.com.helpers.OptionsHandler();
        this._optionsHandler.Setup(this);

        this._optionsHandler
            .Hook(`label`, (p_value) => { this._label.Set(p_value); });

    }

    set options(p_value){ this._optionsHandler.Process(this, p_value); }

    get editor() {
        if (this._editor) { return this._editor; }
        return nkm.datacontrols.FindEditor(this);
    }
    set editor(p_value) { this._editor = p_value; }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'width': '100%',
                //'border-top': '1px solid #000',
                'opacity':'0.5',
                'margin-top':'2px'
            },
            '.label': {
                //'border-bottom': '1px solid #656565',
                //'padding-bottom':'2px',
                //'font-style':'italic'
                //'text-align':'center',
                'text-transform':'uppercase'
            },
        }, super._Style());
    }

    _Render() {

        super._Render();
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label font-small` }, this._host), false, false);

    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = ControlHeader;
ui.Register(`mkfont-control-header`, ControlHeader);