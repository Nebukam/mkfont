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

        this._shortcut = actions.Keystroke.CreateFromString("Ctrl S");
        this._glyphInfos = null;

        this.Disable();
    }

    _InternalExecute() {

        this._targetPath = null;

        if(!this._emitter){ 
            this._Cancel(); 
            return;
        }

        this._context = this._emitter.data;

        if(!this._context){ 
            this._Cancel(); 
            return;
        }

        if (nkm.env.isNodeEnabled) {

            if (this._context._filePath) {
                this._targetPath = this._context._filePath;
                this._Save();
            } else {
                nkm.actions.RELAY.ShowOpenDialog({
                    //defaultPath: this._currentValue ? this._currentValue : ``,
                    filters: [{ name: 'MKFont files', extensions: ['mkfont'] }],
                    type: `save`,
                    //properties: ['openFile']
                }, this._OnPicked);
            }


        } else {
            this._Cancel();
        }

    }

    _OnPicked(p_response) {

        if (p_response.canceled) {
            this._Cancel();
            return;
        }

        this._targetPath = p_response.filePath;
        this._Save();

    }

    _Save() {
        let
            targetPath = this._targetPath,
            rsc = nkm.io.RESOURCES.Get(targetPath, {
                cl: nkm.io.resources.JSONResource,
                //io:nkm.io.IO_TYPE.FILE_SYSTEM
            });

        this._context._filePath = this._targetPath;

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
        this._context.ClearDirty();
        this._Success();
    }

}

module.exports = CmdIOSaveFamily;