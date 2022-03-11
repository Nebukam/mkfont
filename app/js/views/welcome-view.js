const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

class WelcomeView extends ui.views.View {
    constructor() { super(); }

    _Init() {
        super._Init();


    }


    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
        }, super._Style());
    }

    _Render(){
        super._Render();

    }

}

module.exports = WelcomeView;
ui.Register(`mkfont-welcome`, WelcomeView);