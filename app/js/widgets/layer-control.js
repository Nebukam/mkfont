const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);

const ControlHeader = require(`./control-header`);
const PropertyControl = require(`./property-control`);

const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_NORMALIZE; };

const __circular = `circular`;

const base = nkm.datacontrols.InspectorWidgetGroup;
class LayerControl extends base {
    constructor() { super(); }

    static __widgetExpandData = false;

    static __controls = [
        { cl: ControlHeader, options: { label: `Glyph name` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.CHARACTER_NAME, subData: `_layer` } },
        { options: { propertyId: mkfData.IDS.INVERTED, subData: `_layer` } },
        { cl: ControlHeader, options: { label: `Boundaries & Scale` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_LYR_BOUNDS_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_LYR_SCALE_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_FACTOR }, requireData: true, hideWhen: { fn: isMANUAL } },
        { options: { propertyId: mkfData.IDS.TR_NRM_FACTOR }, requireData: true, hideWhen: { fn: isNRM } },
        { cl: ControlHeader, options: { label: `Vertical align + anchoring` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_LYR_VER_ALIGN, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN_ANCHOR, inputOnly: true }, css: 'small' },
        { cl: ControlHeader, options: { label: `Horizontal align + anchoring` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_LYR_HOR_ALIGN, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN_ANCHOR, inputOnly: true }, css: 'small' },
        { cl: ControlHeader, options: { label: `Offsets` }, css: 'hdr', requireData: true },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT }, requireData: true },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH }, requireData: true },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, requireData: true },
    ];

    _Init() {
        super._Init();

        this._flags.Add(this, __circular);

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;

        this.forwardData.Remove(this._builder);
        this.forwardData.To(this._builder, { dataMember: `_transformSettings` });

        this._extExpand = this._extensions.Add(ui.extensions.Expand);
        this._extExpand._toggled = false;

        this._extExpand
            .Watch(ui.SIGNAL.EXPANDED, this._Expand, this)
            .Watch(ui.SIGNAL.COLLAPSED, this._Collapse, this);
    }

    _PostInit() {
        super._PostInit();
        this._builder.host = this._body;
        this._extExpand.Setup(this, this._body, this._expandIcon.element);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'min-height': 'auto',
                'min-width': 'auto',
                //'padding': '20px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'padding': '5px',
                'margin-bottom': '5px',
                'align-items': `center`,
                'background-color': `rgba(127,127,127,0.25)`,
            },
            ':host(.circular)': {
                'background-color': `rgba(var(--col-error-dark-rgb),0.25)`,
            },
            ':host(.expanded) .icon.expand': {
                'transform': `rotate(90deg)`
            },
            '.body': {
                'display': 'flex',
                'width': `100%`,
                'flex-flow': 'row wrap',
                'align-content': 'flex-start',
            },
            '.control': {
                'flex': '1 1 100%',
                'margin': '0 2px 5px 2px'
            },
            '.hdr': {
                'margin': '5px 2px 5px 2px'
            },
            '.small': {
                'flex': '1 1 45%'
            },
            '.vsmall': {
                'flex': '1 1 25%'
            },
            '.osmall': {
                'flex': '1 1 80%'
            },
            '.checkbox': {
                'flex': '0 0 16px',
            },
            '.label': {
                'flex': '1 1 auto'
            },
            '.btn': {
                'margin': '3px'
            },
            '.header': {
                'position': `relative`,
                'display': `flex`,
                'flex-flow': `row nowrap`,
                'width': `100%`,
                'align-items': `center`,
                'flex': '1 1 auto',
                'box-sizing': `border-box`,
            },
        }, base._Style());
    }

    _Render() {

        ui.DOMTemplate.Render(nkm.uilib.dom.BodyExpand, this, {
            [ui.IDS.OWNER]: this,
            //[ui.IDS.ICON]: { autoHide: true },
            expandIcon: { htitle: `Expand` }
        });

        super._Render();

        this._icon.autoHide = true;

        // delete btn triggers this.editor.cmdLayerRemove.Execute(this._data);

        this._toolbar = this.Attach(ui.WidgetBar, `toolbar`, this._header);
        this._toolbar.options = {
            inline: true,
            size: nkm.ui.FLAGS.SIZE_XS,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `up-short`, htitle: `Move layer up`,
                    variant: ui.FLAGS.MINIMAL,
                    //trigger: { fn: () => { this.editor.cmdLayerAdd.Execute(this._data); } },
                    group: `move`
                },
                {
                    icon: `down-short`, htitle: `Move layer down`,
                    variant: ui.FLAGS.MINIMAL,
                    //trigger: { fn: () => { this.editor.cmdLayersOn.Execute(this._data); } },
                    group: `move`
                },
                {
                    icon: `remove`, htitle: `Delete  this layer`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerRemove.Execute(this._data); } },
                    group: `remove`
                },
            ]
        };

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let char = p_data.Get(mkfData.IDS.CHARACTER_NAME);
        this._label.Set(char && char != `` ? `layer : ${char} ` : `(empty layer)`);
        this._flags.Set(__circular, p_data.Get(mkfData.IDS.CIRCULAR_REFERENCE));
    }

    _CleanUp() {
        this._flags.Set(__circular, false);
        super._CleanUp();
    }

}

module.exports = LayerControl;
ui.Register(`mkf-layer-control`, LayerControl);