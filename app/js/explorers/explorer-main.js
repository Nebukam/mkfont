const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class MainExplorer extends nkm.uiworkspace.Explorer {
    constructor() { super(); }

    _Init() {

        super._Init();

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            }
        }, super._Style());
    }

    _Render() {

        super._Render();

    }

}

module.exports = MainExplorer;
ui.Register(`mkf-main-explorer`, MainExplorer);