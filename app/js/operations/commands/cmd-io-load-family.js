//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const mkfData = require(`../../data`);

class CmdIOSaveFamily extends actions.Command {
    constructor() { super(); }

    static __defaultName = `Load .mkfont`;
    static __defaultIcon = `document-download-small`;

    _Init() {
        super._Init();
        this._Bind(this._Success);
        this._Bind(this._Fail);
        this._Bind(this._OnPicked);
        this._Bind(this._OnReadError);
        this._Bind(this._OnReadSuccess);
    }

    _InternalExecute() {

        if (nkm.utils.isVoid(this._context) ||
            !nkm.utils.isString(this._context)) {

            if (nkm.env.isNodeEnabled) {
                nkm.actions.RELAY.ShowOpenDialog({
                    filters: [{ name: 'MKFont files', extensions: ['mkfont'] }],
                    properties: ['openFile']
                }, this._OnPicked);
            } else {
                this._Cancel();
            }
        } else {
            this._Open(this._context);
        }

    }

    _OnPicked(p_response) {

        if (p_response.canceled) {
            this._Cancel();
            return;
        }

        this._Open(p_response.filePaths[0]);

    }

    _Open(p_filePath) {

        let
            targetPath = p_filePath,
            rsc = nkm.io.RESOURCES.Get(targetPath, {
                cl: nkm.io.resources.JSONResource,
                //io:nkm.io.IO_TYPE.FILE_SYSTEM
            });

        rsc.Read({
            error: this._OnReadError,
            success: this._OnReadSuccess
        });

    }

    _OnReadError(p_err) {
        console.error(p_err);
        this._Fail(p_err);
    }

    _OnReadSuccess(p_rsc) {

        this._family = nkm.data.serialization.JSONSerializer.Deserialize(p_rsc.content);
        nkm.actions.Emit(nkm.actions.REQUEST.EDIT, { data: this._family },
            this, this._Success, this._Fail);

    }

    _Fail(...args) {
        if (this._family) {
            this._family.Release();
            this._family = null;
        }
        super._Fail(...args);
    }

}

module.exports = CmdIOSaveFamily;