const { uilib } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../data`);

class PangramView extends ui.views.View {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._dataObserver.Hook(mkfData.SIGNAL.TTF_UPDATED, this._Refresh);

        this._previewText = `By Jove, my quick study of lexicography won a prize!`;

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap'
            },
            '.header': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'align-items': 'center'
            },
            '.body': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'row wrap',
                //'justify-content': 'space-evenly'
            },
            '.group': {
                'flex': '1 0 auto'
            },
            '.item': {
                'flex': '0 0 auto'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
    }

    //#region Catalog Management

    /**
     * @description TODO
     * @type {data.core.Catalog}
     */
    get catalog() { return this._builder.catalog; }
    set catalog(p_value) { 
        this._builder.catalog = p_value; 
        if(p_value){
            this._tpl[ui.IDS.LABEL].Set(p_value.name);
        }
    }

    //#endregion

    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = PangramView;
ui.Register(`mkfont-font-group`, PangramView);