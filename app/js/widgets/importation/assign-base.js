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

const base = nkm.datacontrols.ControlView;
class AssignBaseControl extends base {
    constructor() { super(); }

    static __distribute = base.__distribute.Ext()
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

    static _Style() {
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
        }, base._Style());
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

        this._offsetIndex = 0;

        this._ComputeStartOffset();

        for (let i = 0; i < this._importList.length; i++) {
            this._ProcessSingle(this._importList[i], i + this._offsetIndex);
        }

        this.Broadcast(nkm.com.SIGNAL.UPDATED, this);
    }

    _ComputeStartOffset() { }

    _ProcessSingle(p_item, p_index = null) {

        if (!p_index) { p_index = p_item.index; }
        else { p_item.index = p_index; }

        p_item.outOfRange = false;

        if (!p_item.userDoImport || p_item.userDoCustom) {
            this._offsetIndex--;
            if (p_item.userDoCustom) {
                p_item.targetUnicode = this._GetUnicodeStructure([UNICODE.ResolveString(p_item.userInput)]);
            }
        } else {
            this._InternalProcess(p_item, p_index);
        }

        p_item.unicodeInfos = UNICODE.GetInfos(p_item.targetUnicode, false);
        let variant = this.editor.GetGlyphVariant(p_item.unicodeInfos);
        p_item.variant = variant ? variant.glyph.isNull ? null : variant : null;

        if (p_item.variant) {
            let overlapMode = this.editor._data.Get(mkfData.IDS_EXT.IMPORT_OVERLAP_MODE);
            if (overlapMode == mkfData.ENUMS.OVERLAP_IGNORE) {
                p_item.preserved = false;
                p_item.outOfRange = true;
            } else {
                if (overlapMode == mkfData.ENUMS.OVERLAP_PRESERVE) {
                    p_item.preserved = true;
                } else if (overlapMode == mkfData.ENUMS.OVERLAP_OVERWRITE_EMPTY) {
                    p_item.preserved = !variant.Get(mkfData.IDS.EMPTY);
                } else {
                    p_item.preserved = false;
                }
            }
        } else {
            p_item.preserved = false;
        }

    }

    _InternalProcess(p_item, p_index) {

    }

    _CleanUp() {
        this.importList = null;
        super._CleanUp();
    }

    _GetUnicodeStructure(p_array) {

        if (p_array.length == 1) { return this._SingleStructure(p_array[0]); }

        let result = [];
        for (let i = 0; i < p_array.length; i++) {
            result.push(...this._SingleStructure(p_array[i]));
        }

        return result;

    }

    _SingleStructure(p_value, p_index) {

        p_value = UNICODE.ResolveString(p_value);

        if (p_value.length == 1) { return [UNICODE.GetAddress(p_value)]; }

        let result = [];
        for (let i = 0; i < p_value.length; i++) { result.push(UNICODE.GetAddress(p_value.substr(i, 1))); }
        return result;

    }

}

module.exports = AssignBaseControl;