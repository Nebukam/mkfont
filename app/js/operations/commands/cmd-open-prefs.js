//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const ui = nkm.ui;
const u = nkm.u;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdOpenPrefs extends actions.Command {
    constructor() { super(); }

    static __defaultName = `App settings`;
    static __defaultIcon = `gear`;

    _Init() {
        super._Init();
    }

    _InternalExecute() {

        let opts = {
            orientation: ui.FLAGS.HORIZONTAL,
            placement: ui.FLAGS.LEFT,
            title: `App settings`,
            data: nkm.env.APP._prefDataObject,
            contentClass: nkm.ui.UI.GetClass(`mkf-prefs-explorer`)
        };

        nkm.actions.Emit(nkm.uilib.REQUEST.DRAWER, opts, this);

        this._Success();

    }

}

module.exports = CmdOpenPrefs;