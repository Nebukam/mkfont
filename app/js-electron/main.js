const { shell } = require('electron');
const path = require('path');
const electron = require(`@nkmjs/core/electron`);

class ElectronProcess extends electron.core.ElectronBase {
    constructor(p_config) { super(p_config); }

    _Boot() {
        super._Boot();
        // At that point, the main window is loaded and ready
    }

    _WriteFileOnDisk() {

    }

    _OpenAndWatch() {
        shell.openPath(path.join(__dirname, 'test.docx'));
    }

}

module.exports = ElectronProcess;