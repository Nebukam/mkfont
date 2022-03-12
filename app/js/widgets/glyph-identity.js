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
                'border-bottom': '1px solid rgba(0,0,0,0.25)',
                'height': '2.2em'
            },
            '.tagbar': {
                'max-height':'16px',
                'margin-left':'4px',
                'margin-right':'4px'
            },
            '.toolbar': {

            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._title = new ui.manipulators.Text(ui.dom.El("code", { class: "long-name" }, this));
        this._title.Set("---");

        this._tagBar = this.Add(ui.WidgetBar, `tagbar`);
        this._tagBar._defaultWidgetClass = nkm.uilib.widgets.Tag;
        this._tagBar.size = ui.FLAGS.SIZE_XS;

        this._hexTag = this._tagBar.CreateHandle();
        this._hexTag.bgColor = `#3c3c3c`;

        this._blockTag = this._tagBar.CreateHandle();
        this._blockTag.bgColor = `black`;
        this._blockTag.maxWidth = `100px`;

        this._catTag = this._tagBar.CreateHandle();
        this._catTag.bgColor = `black`;

    }

    set glyphInfos(p_infos) {
        if (!p_infos) {
            this._title.Set(`---`);
            this._blockTag.label = `---`; this._blockTag.htitle = null;
            this._catTag.label = `---`;
            this._hexTag.label = `-`;
            this._catTag.textColor = `var(--col-error)`;
            return;
        }

        this._title.Set(p_infos.name);
        this._hexTag.label = `0×${p_infos.u}`;

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

}

module.exports = GlyphIdentity;
ui.Register(`mkfont-glyph-identity`, GlyphIdentity);