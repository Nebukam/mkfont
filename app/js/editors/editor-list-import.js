const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const svgpath = require('svgpath');

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);

class EditorListImport extends nkm.datacontrols.Editor {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._builder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this.forwardData.To(this._builder);
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'flex-flow': 'column wrap',
                'flex': '0 0 auto',
                'grid-template-columns': 'max-content max-content max-content',
                'grid-template-rows': '90px auto',
                'grid-gap': '10px'
            },
            '.item': {
                'flex': '1 0 auto',
                'grid-column-start': '1',
            },
            '.list': {
                'position': 'relative',
                'height': '0',
                'width': '300px',
                'overflow': 'hidden',
                //'padding': '10px',
                'background-color': 'rgba(0,0,0,0.2)',
                'grid-column-start': '2',
                'grid-row': '1 / span 2',
                'overflow': 'auto',
                'min-height': '100%',
            },
            '.settings': {
                'width': '300px'
            },
            '.preview': {
                'position': 'relative',
                'width': '400px',
                'height': '100%',
                //'aspect-ratio': '1/1',
                'flex': '0 0 100%',
                'background-color': '#1b1b1b',
                'border-radius': '3px',
                'grid-column-start': '3',
                'grid-row': '1 / span 2',
            },
            '.identity': {
                'width': '100%'
            },
            '.header': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();

        this._header = ui.El(`div`, { class: `item header` }, this._host);

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
        this._builder.host = this._header;
        this._builder.Build([
            { cl: mkfWidgets.ControlHeader, options: { label: `Options` } },
            { options: { propertyId: mkfData.IDS.IMPORT_PREFIX } },
            { options: { propertyId: mkfData.IDS.IMPORT_SEPARATOR } },
        ]);

        this._settingsInspector = this.Add(mkfInspectors.TransformSettings, `item settings`);
        this.forwardData.To(this._settingsInspector);

        this._importListBrowser = this.Add(mkfWidgets.lists.ImportListRoot, `list`, this._host);

        this._glyphRenderer = this.Add(mkfWidgets.GlyphCanvasRenderer, `preview`, this._host);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            centered: false,
        };

    }

    set subFamily(p_value) {
        this._subFamily = p_value;
    }

    set catalog(p_value) {
        this._catalog = p_value;
        this._importListBrowser.data = p_value;
        this._UpdateUnicodeImportedValues();
        if(this._catalog){
            this.Inspect(this._catalog.At(0));
        }
    }

    _OnInspectedDataChanged(p_oldData) {
        super._OnInspectedDataChanged(p_oldData);
        if (this._inspectedData) { this._UpdatePreview(); }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        if (this._inspectedData) { this._UpdatePreview(); }
        this._UpdateUnicodeImportedValues();
    }

    _UpdateUnicodeImportedValues() {

        if (!this._catalog) { return; }
        let list = this._catalog._items;

        for (let i = 0; i < list.length; i++) {
            let item = list[i],
                name = item.GetOption(`name`),
                parsedUnicode = ``,
                parseArray = this._FindUnicodeStructure(name);

            item.SetOption(`imported-unicode`, parseArray);
        }

    }

    _FindUnicodeStructure(p_string) {

        let
            prefix = this._data.Get(mkfData.IDS.IMPORT_PREFIX),
            separator = this._data.Get(mkfData.IDS.IMPORT_SEPARATOR);

        let parseArray = p_string.split(prefix);
        parseArray = parseArray.length > 1 ? parseArray.pop() : parseArray[0];
        parseArray = this._GetUnicodeStructure(parseArray.split(separator));
        return parseArray;
    }

    _GetUnicodeStructure(p_array) {

        if (p_array.length == 1) {
            return this._SingleStructure(p_array[0]);
        }

        let result = [];
        for (let i = 0; i < p_array.length; i++) {
            result.push(...this._SingleStructure(p_array[i]));
        }


        return result;

    }

    _SingleStructure(p_value) {
        if (p_value.length == 1) { return [UNICODE.GetAddress(p_value)]; }
        if (p_value.substr(0, 2) == `U+`) { return [p_value.substring(2)]; }

        let result = [];
        for (let i = 0; i < p_value.length; i++) { result.push(UNICODE.GetAddress(p_value.substr(i, 1))); }
        return result;
    }

    _UpdatePreview() {

        let subFamily = this._inspectedData.GetOption(`subFamily`),
            contextInfos = subFamily._contextInfos,
            pathData = this._inspectedData.GetOption(`svgStats`),
            transformedPath = SVGOPS.FitPath(
                this._data,
                contextInfos,
                pathData
            );

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.Draw();
    }

    _CleanUp(){
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = EditorListImport;
ui.Register(`mkfont-list-import-editor`, EditorListImport);