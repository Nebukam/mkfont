const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../data`);
const GlyphRenderer = require(`./glyph-renderer`);
const GlyphCanvasRenderer = require(`./glyph-canvas-renderer`);

class TestWidget extends ui.WidgetItem {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _PostInit() {
        super._PostInit();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                //'min-height': 'var(--preview-size)',
                //'border':'1px solid gray',
                //'background-color': 'green',
                'border': '1px solid red'
            },
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `title font-large` }, this._host));
    }

    set vIndex(p_value) {
        this._label.Set(`${p_value}`);
        let s = (Math.abs(Math.round(Math.sin(p_value) * 255))).toString(16);
        this._label._element.style.setProperty('color', `#${s}${s}${s}`);
    }


    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = TestWidget;
ui.Register(`test-widget`, TestWidget);