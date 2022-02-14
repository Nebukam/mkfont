// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');
const { optimize } = require('svgo');

const ActionSetSVG = require(`../actions/action-set-svg`);

class CmdClipboardReadSVG extends actions.CommandAction {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = ActionSetSVG;
        this._shortcut = actions.Keystroke.CreateFromString("Ctrl V");
        this.Disable();
    }

    _FetchContext() {

        let
            targetSlot = this._emitter.data,
            targetFont = this._emitter.context;

        if (!targetSlot || !targetFont) { return null; }

        let
            clipboardData = clipboard.readText(),
            svgo = optimize(clipboardData, {
                multipass: true
            }),
            svgString = svgo.data;

        if (!svgString) { return null; }


        console.log(`raw output : `, svgString);

        let
            colReplace = `fff`,
            viewBox = { width: 100, height: 100 };

        // Replace all colors with white
        try {
            let s = svgString.split(`:#`);
            for (let i = 1; i < s.length; i++) {
                let s2 = s[i], s3 = s2[3], s6 = s2[6];
                if (s3 == `;` || s3 == `}` || s3 == `"`) { s2 = `${colReplace}${s2.substr(3)}`; }
                else if (s6 == `;` || s6 == `}` || s6 == `"`) { s2 = `${colReplace}${s2.substr(6)}`; }
                s[i] = s2;
            }
            svgString = s.join(`:#`);
        } catch (e) { }

        // Remove dimensions


        // Remove unwanted properties
        svgString = this._RemoveProperty(svgString, `viewBox`);
        svgString = this._RemoveProperty(svgString, `width`);
        svgString = this._RemoveProperty(svgString, `height`);

        svgString = svgString.split(`fill:none;`).join(``);
        svgString = svgString.split(`fill:none`).join(``);
        svgString = svgString.split(`stroke:#`).join(`fill:#`);

        // Add viewBox
        let vb = svgString.split(`<svg `);
        svgString = vb.join(`<svg viewBox="0 0 ${viewBox.width} ${viewBox.height}" `);

        return {
            fontContext: targetFont,
            targetSlot: targetSlot,
            svgString: svgString
        };

    }

    _RemoveProperty(p_string, p_property, p_delim = `"`) {
        let s = p_string.split(`${p_property}=${p_delim}`);
        if (s.length > 1) {
            let r = s[1].split(p_delim);
            if (r.length > 1) {
                r.shift();
                s[1] = r.join(p_delim);
                p_string = s.join(``);
            }
        }
        return p_string;
    }

}

module.exports = CmdClipboardReadSVG;
