const electron = require(`@nkmjs/core/electron`);

class ElectronProcess extends electron.core.ElectronBase{
    constructor(p_config){super(p_config);}

    _Boot(){
        super._Boot();
        // At that point, the main window is loaded and ready
    }

}

module.exports = ElectronProcess;