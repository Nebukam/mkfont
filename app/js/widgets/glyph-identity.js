const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const UNICODE = require(`../unicode`);

const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

class GlyphIdentity extends ui.Widget {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._multi = null;
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

        this._tagBar = this.Attach(ui.WidgetBar, `tagbar`);
        this._tagBar.options = {
            defaultWidgetClass: nkm.uilib.widgets.Tag,
            size: ui.FLAGS.SIZE_XS
        };

        let hexCtnr = this._tagBar.CreateHandle({ cl: ui.WidgetButton });
        hexCtnr.options = {
            htitle: `Copy value to clipboard`,
            trigger: {
                fn: () => {
                    mkfCmds.ExportSingleUniHex.Execute(this._multi ? this._multi : this._data);
                }, thisArg: this
            }
        }
        this._hexTag = hexCtnr.Attach(nkm.uilib.widgets.Tag, `tag`);
        this._hexTag.bgColor = `rgba(var(--col-cta-rgb),0.5)`;
        this._hexTag.maxWidth = `100px`;

        this._blockTag = this._tagBar.CreateHandle();
        this._blockTag.bgColor = `black`;
        this._blockTag.maxWidth = `100px`;

        this._catTag = this._tagBar.CreateHandle();
        this._catTag.bgColor = `black`;
        this._catTag.maxWidth = `100px`;

    }

    _OnDataUpdated(p_data) {

        if (!p_data) {
            this._title.Set(`---`);
            this._blockTag.label = `---`; this._blockTag.htitle = null;
            this._catTag.label = `---`;
            this._hexTag.label = `-`;
            this._catTag.textColor = `var(--col-error)`;
            return;
        }

        this._title.Set((p_data.name || `U+${p_data.u}`).substr(0, 80));

        this._hexTag.label = UNICODE.UUni(p_data);

        if (p_data.block) {
            this._blockTag.label = p_data.block.name;
            this._blockTag.htitle = p_data.block.name;
        } else {
            this._blockTag.label = `unknown block`;
        }

        if (p_data.cat) {
            this._catTag.label = p_data.cat.name;
            this._catTag.textColor = `var(--col-${p_data.cat.col})`;
            this._catTag.visible = true;
        } else {
            this._catTag.visible = false;
        }
    }

    Multi(p_title, p_uni) {

        this._multi = p_uni;

        this._title.Set(p_title);
        this._blockTag.visible = false; this._blockTag.htitle = null;
        this._catTag.visible = false;
        this._hexTag.label = `${p_uni}`;
        this._catTag.textColor = `var(--col-cta)`;
    }

}

module.exports = GlyphIdentity;
ui.Register(`mkfont-glyph-identity`, GlyphIdentity);