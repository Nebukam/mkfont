const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

class DisplayInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        { cl:mkfWidgets.ControlHeader, options:{ label:`Display options` } },
        { options: { propertyId: mkfData.IDS.COLOR_PREVIEW } },
        { options: { propertyId: mkfData.IDS.PREVIEW_SIZE } },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'flex': '0 0 auto',
                'min-width': '300px'
            },
            '.list': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {

        this._body = ui.dom.El(`div`, { class: `list` }, this._host);
        this._builder.host = this._body;

        super._Render();

        this._controls = ui.dom.El("div", { class: 'controls' }, this._body);


        // Preview align mode (left/center/right)

        // ...

    }

    //#region Family properties

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    //#endregion


}

module.exports = DisplayInspector;
ui.Register(`mkf-display-inspector`, DisplayInspector);