'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const UNICODE = require("../../unicode");
const mkfData = require(`../../data`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const __flag_inherited = `inherited`;

const PropertyControl = require(`../property-control`);

class AssignBaseControl extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __distribute = nkm.datacontrols.ControlView.__distribute.Ext()
        .To(`importList`)
        .Move(`data`);

    static __valueIDs = [];

    _Init() {
        super._Init();
        this._importList = null;
        this._dataObserver.Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this);

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    _PostInit() {
        super._PostInit();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'align-items': 'center',
                'flex': '0 1 auto',
                'align-items': `stretch`
            },
            '.control': {
                'flex': '1 1 auto',
                'margin': '0 0 5px 0'
            },
        }, super._Style());
    }

    _Render() {
        super._Render();
    }

    set importList(p_value) {
        this._importList = p_value;
        if (p_value && this._data) { this._UpdateList(); }
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data && this._importList) { this._UpdateList(); }
    }

    _OnDataValueChanged(p_data, p_id, p_valueObj, p_oldValue) {
        if (!this.constructor.__valueIDs.includes(p_id)) { return; }
        this._UpdateList();
    }

    _UpdateList() {

        for (let i = 0; i < this._importList.length; i++) {
            this._ProcessSingle(this._importList[i]);
        }

        this.Broadcast(nkm.com.SIGNAL.UPDATED, this);
    }

    _ProcessSingle(p_item) {

        this._InternalProcess(p_item);

        p_item.unicodeInfos = UNICODE.GetInfos(p_item.targetUnicode, false);
        let variant = this.editor.GetGlyphVariant(p_item.unicodeInfos);
        p_item.variant = variant ? variant.glyph.isNull ? null : variant : null;

    }

    _InternalProcess(p_item) {

    }

    _CleanUp() {
        this.importList = null;
        super._CleanUp();
    }

}

module.exports = AssignBaseControl;