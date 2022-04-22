'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const AssignBaseControl = require("./assign-base");
const ControlHeader = require(`../control-header`);

const base = AssignBaseControl;
class AssignSelectionFilenameControl extends base {
    constructor() { super(); }

    static __valueIDs = [
        mkfData.IDS_EXT.IMPORT_PREFIX,
        mkfData.IDS_EXT.IMPORT_SEPARATOR];

    static __controls = [
        { cl: ControlHeader, options: { label: `Filename infos` } },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_PREFIX } },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_SEPARATOR } },
    ];

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {

            },
        }, base._Style());
    }

    _Render() {
        super._Render();

    }

    _InternalProcess(p_item) {
        p_item.targetUnicode = this._FindUnicodeStructure(p_item.userDoCustom ? p_item.userInput : p_item.name);
    }

    _FindUnicodeStructure(p_string) {

        let
            prefix = this._data.Get(mkfData.IDS_EXT.IMPORT_PREFIX),
            separator = this._data.Get(mkfData.IDS_EXT.IMPORT_SEPARATOR);

        let parseArray = p_string.split(prefix);
        parseArray = parseArray.length > 1 ? parseArray.pop() : parseArray[0];
        parseArray = this._GetUnicodeStructure(parseArray.split(separator));

        return parseArray;

    }
    

}

module.exports = AssignSelectionFilenameControl;
ui.Register(`mkfont-assign-filename`, AssignSelectionFilenameControl);