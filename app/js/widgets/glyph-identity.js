const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;


class GlyphIdentity extends ui.Widget {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-height': 'auto',
                //'padding': '20px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'padding-bottom': '5px',
                'margin-bottom': '5px',
                //'border-bottom': '1px solid rgba(0,0,0,0.25)',
            },
            '.long-name': {
                'padding-bottom': '15px',
                'margin-bottom': '5px',
                'border-bottom': '1px solid rgba(127, 127, 127, 0.1)',
                'height': '2.2em',
                'word-break': 'break-all',
            },
            '.tagbar': {
                'max-height': '16px',
                'margin-left': '4px',
                'margin-right': '4px'
            },
            '.toolbar': {

            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._title = new ui.manipulators.Text(ui.dom.El("code", { class: "long-name" }, this), false);
        this._title.Set("---");

        this._tagBar = this.Add(ui.WidgetBar, `tagbar`);
        this._tagBar.options = {
            defaultWidgetClass: nkm.uilib.widgets.Tag,
            size: ui.FLAGS.SIZE_XS
        };

        let hexCtnr = this._tagBar.CreateHandle({ cl: ui.WidgetButton });
        hexCtnr.options = {
            htitle: `Copy value to clipboard`,
            trigger: { fn: () => { navigator.clipboard.writeText((this._GetUni(this._glyphInfos)).toUpperCase()); }, thisArg: this }
        }
        this._hexTag = hexCtnr.Add(nkm.uilib.widgets.Tag, `tag`);
        this._hexTag.bgColor = `rgba(var(--col-cta-rgb),0.5)`;
        this._hexTag.maxWidth = `100px`;

        this._blockTag = this._tagBar.CreateHandle();
        this._blockTag.bgColor = `black`;
        this._blockTag.maxWidth = `100px`;

        this._catTag = this._tagBar.CreateHandle();
        this._catTag.bgColor = `black`;
        this._catTag.maxWidth = `100px`;

    }

    set glyphInfos(p_infos) {

        this._glyphInfos = p_infos;

        if (!p_infos) {
            this._title.Set(`---`);
            this._blockTag.label = `---`; this._blockTag.htitle = null;
            this._catTag.label = `---`;
            this._hexTag.label = `-`;
            this._catTag.textColor = `var(--col-error)`;
            return;
        }

        this._title.Set((p_infos.name || `U+${p_infos.u}`).substr(0, 80));

        this._hexTag.label = this._GetUni(p_infos);

        if (p_infos.block) {
            this._blockTag.label = p_infos.block.name;
            this._blockTag.htitle = p_infos.block.name;
        } else {
            this._blockTag.label = `unknown block`;
        }

        if (p_infos.cat) {
            this._catTag.label = p_infos.cat.name;
            this._catTag.textColor = `var(--col-${p_infos.cat.col})`;
            this._catTag.visible = true;
        } else {
            this._catTag.visible = false;
        }
    }

    _GetUni(p_infos) {
        if (p_infos.ligature) {
            let ulist = p_infos.u.split(`+`);
            for (let i = 0; i < ulist.length; i++) { ulist[i] = `U+${ulist[i]}`; }
            return ulist.join(`_`);
        } else {
            return `U+${p_infos.u}`;
        }
    }

}

module.exports = GlyphIdentity;
ui.Register(`mkfont-glyph-identity`, GlyphIdentity);