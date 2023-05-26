'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const base = nkm.uilib.inspectors.ValueList;
class DisplayInspector extends base {
    constructor() { super(); }

    static __controls = [
        { cl: nkm.datacontrols.widgets.MiniHeader, options: { label: `Display options` } },
        //{ options: { propertyId: mkfData.IDS.COLOR_PREVIEW } },
        {
            options: {
                propertyId: mkfData.IDS.PREVIEW_SIZE, 
                onSubmit: (p_input, p_id, p_value) => {
                    let editor = nkm.datacontrols.FindEditor(p_input);
                    editor.data.Set(p_id, p_value);
                }
            }
        },
    ];

}

module.exports = DisplayInspector;