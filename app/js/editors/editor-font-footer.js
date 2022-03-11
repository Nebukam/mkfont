const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);

class FontEditorFooter extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._dataObserver.Hook(mkfData.SIGNAL.SUBFAMILY_CHANGED, this._OnSubFamilyChanged, this);
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display':'flex',
                'min-height':'250px'
            },
            '.pangram':{
                'width':'100%',
                'height':'100%'
            }
        }, super._Style());
    }

    _Render(){
        super._Render();
        this._pangramRenderer = this.Add(mkfWidgets.PangramRenderer, 'pangram');
    }

    _OnDataChanged(p_oldData){
        super._OnDataChanged(p_oldData);
        if(this._data){
            this._OnSubFamilyChanged(this._data.selectedSubFamily);
        }
    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);
        //this._pangramRenderer._scheduledDraw.Schedule();
    }

    _OnSubFamilyChanged(p_subFamily){
        this._pangramRenderer.data = p_subFamily;
    }

}

module.exports = FontEditorFooter;
ui.Register(`mkfont-font-editor-footer`, FontEditorFooter);