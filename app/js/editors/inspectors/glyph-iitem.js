'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

class GlyphVariantInspectorItem extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __controls = [
        { options:{ propertyId:mkfData.IDS.ID } },
        { options:{ propertyId:mkfData.IDS.WIDTH } },
        { options:{ propertyId:mkfData.IDS.HEIGHT } }
    ];

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;
        
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'column nowrap'
            },
            '.preview': {
                'position': 'relative',
                'aspect-ratio': 'var(--preview-ratio)',
                'flex': '0 0 auto',
                'overflow': 'hidden',
                'padding': '10px',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
                'margin-bottom': '10px'
            },
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': 'var(--preview-ratio)'
            },
            '.control': {
                'flex': '1 1 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {
        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgRenderer = this.Add(mkfWidgets.GlyphRenderer, `renderer`, this._previewBox);
        super._Render();
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._svgRenderer.Set(p_data);
    }

}

module.exports = GlyphVariantInspectorItem;