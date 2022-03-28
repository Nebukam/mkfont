//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const mkfData = require(`../../data`);

class CmdIOSaveFamily extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
        this._Bind(this._OnSaveError);
        this._Bind(this._OnSaveSuccess);
    }

    _InternalExecute() {

        if (nkm.env.isNodeEnabled) {
            nkm.actions.RELAY.ShowOpenDialog({
                //defaultPath: this._currentValue ? this._currentValue : ``,
                filters: [{ name: 'MKFont files', extensions: ['mkfont'] }],
                type: `save`,
                //properties: ['openFile']
            }, this._OnPicked);
        } else {
            this._Cancel();
        }

    }

    _OnPicked(p_response) {

        if (p_response.canceled) {
            this._Cancel();
            return;
        }

        let
            targetPath = p_response.filePath,
            rsc = nkm.io.RESOURCES.Get(targetPath, {
                cl: nkm.io.resources.JSONResource,
                //io:nkm.io.IO_TYPE.FILE_SYSTEM
            });

        rsc.content = nkm.data.serialization.JSONSerializer.Serialize(this._context);
        rsc.Write({
            error: this._OnSaveError,
            success: this._OnSaveSuccess
        });

    }

    _OnSaveError(p_err) {
        console.error(p_err);
        this._Fail(p_err);
    }

    _OnSaveSuccess() {
        this._Success();
    }

}

module.exports = CmdIOSaveFamily;