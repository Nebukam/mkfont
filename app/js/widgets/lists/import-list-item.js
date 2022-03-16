const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

class ImportListItem extends lists.FolderListItem {
    constructor() { super(); }


    _Init() {
        super._Init();
        this._Bind(this._UpdatePreview);
    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.renderer': {
                'aspect-ratio': '1/1',
                'width': '40px',
                'margin': '5px',
                'border-radius': '3px',
                'background-color': '#1b1b1b',
            }
        }, super._Style());
    }

    _Render() {
        this._glyphRenderer = this.Add(GlyphCanvasRenderer, `renderer`, this._host);
        //this._glyphRenderer.centered = true;
        super._Render();
        this._tags = this.Add(ui.WidgetBar, `tagBar`, );
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }

        let editor = nkm.datacontrols.FindEditor(this);
        if(editor){ editor.Inspect(this._data); }

        return true;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._subFamily = this._data.GetOption(`subFamily`);
            this._transformSettings = this._data.GetOption(`transforms`);
            this._transformSettings.Watch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview);
        } else {
            if (this._transformSettings) { this._transformSettings.Unwatch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview); }
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._UpdatePreview();
    }

    _UpdatePreview() {

        let subFamily = this._data.GetOption(`subFamily`),
            contextInfos = subFamily._contextInfos,
            pathData = this._data.GetOption(`svgStats`),
            transformedPath = SVGOPS.FitPath(
                this._data.GetOption(`transforms`),
                contextInfos,
                pathData
            );

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.Draw();
    }

    _Cleanup() {
        this._cmd = null;
        super._Cleanup();
    }

}

module.exports = ImportListItem;
ui.Register(`mkfont-import-list-item`, ImportListItem);