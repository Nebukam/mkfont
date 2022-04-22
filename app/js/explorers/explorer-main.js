const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const base = nkm.uiworkspace.Explorer;
class MainExplorer extends base {
    constructor() { super(); }

    _Init() {

        super._Init();

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {

            }
        }, base._Style());
    }

    _Render() {

        super._Render();

    }

}

module.exports = MainExplorer;
ui.Register(`mkf-main-explorer`, MainExplorer);