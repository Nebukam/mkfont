const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfInspectors = require(`../editors/inspectors`);
const mkfWidgets = require(`../widgets`);

class SingleImportPreview extends ui.views.View {
    constructor() { super(); }

    _Init() {
        super._Init();


    }


    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display':'flex',
                'flex-flow':'row nowrap'
            },
        }, super._Style());
    }

    _Render(){
        super._Render();
        this._settingsInspector = this.Add(mkfInspectors.ImportSettings, `settings`);
        this._preview = this.Add(mkfWidgets.GlyphRenderer);
    }

}

module.exports = SingleImportPreview;
ui.Register(`mkfont-single-import-preview`, SingleImportPreview);