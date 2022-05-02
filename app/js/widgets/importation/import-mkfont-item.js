'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

const __outOfRange = `outOfRange`;
const __preserved = `preserved`;
const __ignored = `ignored`;
const __new = `new`;
const __replace = `replace`;

const __s = `52`;

const domparser = new DOMParser();
const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${__s}" height="${__s}"><path fill="#FFF" d=""/></svg>`;

const svgGlyphRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`svg`)[0];

const base = nkm.datacontrols.ControlWidget;
class ImportMKFontItem extends base {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._Bind(this._OnSubmit);
        this._flags.Add(this, __outOfRange, __preserved, __ignored, __new, __replace);
    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'grid-template-rows': `28px 28px`,
                'grid-template-columns': `max-content auto`,
                'align-items': `center`,
                'padding': `5px 10px`
            },
            ':host(.outOfRange)': {
                'opacity': '0.4'
            },
            ':host(.preserved):before': {
                //'content': `""`,
                '@': ['absolute-left'],
                'width': `10px`, 'height': `10px`,
                'margin-top': `-25px`,
                'margin-left': `54px`,
                'border-radius': `3px`,
                'background-color': `var(--col-cta)`
            },
            ':host(:not(.new)) .new-icon': { 'display': 'none', },
            ':host(:not(.replace)) .replace-icon': { 'display': 'none', },
            ':host(.ignored):after': {
                'content': `""`,
                'position': `absolute`,
                'width': `1px`, 'height': `120%`,
                'transform': `rotate(45deg)`,
                'margin-left': `36px`,
                'margin-top': `-3px`,
                'background-color': `var(--col-warning)`
            },
            '.renderer': {
                'position': 'relative',
                'aspect-ratio': '1/1',
                'width': `${__s}px`,
                'border-radius': '3px',
                'background-color': '#1b1b1b',
                'grid-column': '1',
                'grid-row': '1 / span 2',
                'align-self': `flex-start`,

            },
            '.hidden': {
                'display': 'none',
            },
            '.toolbar': {
                'grid-column': '2 / span 1',
                'grid-row': '1',
                'align-self': `flex-start`,
                'margin-left': `4px`,
            },
            '.output': {
                'grid-column': '2 / span 1',
                'grid-row': '2',
                'margin-left': `6px`,
                'padding': `3px`,
                'padding-left': `6px`,
                //'background-color': `rgba(127,127,127,0.05)`,
                'border-radius': '3px'
            },
            '.sic': {
                'position': 'absolute',
                'top': `4px`,
                'left': `44px`,
                'width': `20px`,
            },
        }, base._Style());
    }

    _Render() {


        this._preview = ui.El(`div`, { class: `renderer` }, this._host);

        this._svgGlyph = svgGlyphRef.cloneNode(true);
        ui.dom.Attach(this._svgGlyph, this._preview);
        this._svgPath = this._svgGlyph.getElementsByTagName(`path`)[0];

        this._newIcon = new ui.manipulators.Icon(ui.El(`div`, { class: `sic new-icon` }, this._host));
        this._newIcon.Set(`new-small`);
        this._newIcon._element.setAttribute(`title`, `This glyph doesn't exist yet and will be added to the font.`);

        this._replaceIcon = new ui.manipulators.Icon(ui.El(`div`, { class: `sic replace-icon` }, this._host));
        this._replaceIcon.Set(`load-arrow-small`);
        this._replaceIcon._element.setAttribute(`title`, `This glyph already exist and will be updated.`);

        this._outputLabel = new ui.manipulators.Text(ui.El(`div`, { class: `output label font-xsmall` }, this._host));
        this._outputLabel.ellipsis = true;

        this._tb = this.Attach(ui.WidgetBar, `toolbar`, this._host);
        this._tb.options = {
            //inline: true,
            stretch: ui.WidgetBar.FLAG_STRETCH,
            size: ui.FLAGS.SIZE_XS,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    cl: uilib.inputs.Checkbox,
                    htitle: `Custom assignation`,
                    onSubmit: {
                        fn: (p_input, p_value) => {
                            this._data.userDoCustom = p_value;
                            this._unicodeInputField.disabled = !p_value;
                            this._Reprocess();
                        }
                    },
                    group: `read`, member: { owner: this, id: `_useCustomUniCheckbox` }
                },
                {
                    cl: uilib.inputs.Text,
                    variant: ui.FLAGS.MINIMAL,
                    onSubmit: { fn: this._OnSubmit },
                    group: `read`, member: { owner: this, id: `_unicodeInputField` }
                },
            ]
        };

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            let svgStats = this._data.variants[0].values[mkfData.IDS.PATH_DATA];
            this._svgPath.setAttribute(`d`, svgStats.path);
            let w = svgStats.width * 2, h = svgStats.height * 2;
            this._svgGlyph.setAttribute(`viewBox`, `${-w * 0.25} ${-h * 0.25} ${w} ${h}`);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this.Update();
    }

    Update() {

        //TODO: Update widget display based on current data & import settings

        this._unicodeInputField.placeholderValue = this._data.placeholder;

        let
            useCustom = this._data.userDoCustom,
            targetUnicode = this._data.targetUnicode,
            OoR = this._data.outOfRange,
            ignored = OoR;

        this._unicodeInputField.disabled = !useCustom;
        this._useCustomUniCheckbox.currentValue = useCustom;

        this._flags.Set(__outOfRange, OoR && !useCustom);
        this._flags.Set(__preserved, this._data.preserved);

        if (useCustom) {
            this._unicodeInputField.currentValue = this._data.userInput;
        } else {
            this._unicodeInputField.currentValue = ``;
        }

        if (!targetUnicode || targetUnicode.length == 0) {
            ignored = true;
            //if (OoR) { this._outputLabel.Set(`<span style='color:var(--col-warning)'>Out of range.</span>`); }
            //else { this._outputLabel.Set(`<span style='color:var(--col-warning)'>Ignored.</span>`); }
        } else {
            let unichars = [];
            targetUnicode.forEach((val) => { unichars.push(UNICODE.GetUnicodeCharacter(Number.parseInt(val, 16))); });
            this._outputLabel.Set(`<b>${unichars.join(``)}</b> (${targetUnicode.join(`<span style='opacity:0.5'>+</span>`)})`);
        }

        this._flags.Set(__ignored, ignored);
        this._flags.Set(__new, !this._data.variant && !ignored);
        this._flags.Set(__replace, this._data.variant && !ignored);

        if (ignored) {
            this._outputLabel.Set(`<span style='color:var(--col-warning)'>Not imported.</span>`);
        }

    }

    _OnSubmit(p_input, p_value) {
        this._data.userInput = p_value;
        this._Reprocess();
    }

    _CleanUp() {
        this._cmd = null;
        super._CleanUp();
    }

}

module.exports = ImportMKFontItem;
ui.Register(`mkf-import-mkfont-item`, ImportMKFontItem);