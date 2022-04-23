const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;
const { shell } = require(`electron`);

const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const base = ui.views.View;
class WelcomeView extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this.cmdNewFromTTF = this._commands.Create(mkfCmds.StartNewFromTTF);
        this.cmdNewFromSVGs = this._commands.Create(mkfCmds.StartNewFromSVGS);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'align-content': `center`,
                'justify-content': `center`,
                'align-items': `center`,
            },
            '.body': {
                'width': `750px`,
                'height': `500px`,
                'display': 'grid',
                'grid-template-columns': '400px 1fr',
                'grid-template-rows': '1fr 1fr 50px',
            },
            '.ico': {
                'grid-column': `1`,
                'align-self': `center`,
                'grid-row': `1 / span 2`,
                'background-image': nkm.style.URLAssets(`mkfont-logo-nobg.svg`, true),
                'background-size':`70%`
            },
            '.title': {
                'padding':'15px',
            },
            '.start': { 'align-self': `center`, 'grid-row':'1 / span 2' },//start
            '.end': { 'align-self': `start`, 'display':`none` }, 
            '.block': {
                'grid-column': `2`,
                'padding-top':'10px',
                'padding-left':'10px',
                'border-left':'1px solid rgba(127,127,127,0.1)'
            },
            '.block:hover': {
                'border-left':'1px solid rgba(127,127,127,0.5)'
            },
            '.actionlist': {
                'align-items': `flex-start`
            },
            '.footer': {
                'align-self': `center`,
                'justify-self': `center`,
                'grid-column': `1 / span 2`
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._body = ui.El(`div`, { class: `body` }, this._host);

        this._logo = new ui.manipulators.Icon(ui.El(`div`, { class: `ico` }, this._body));
        this._logo.Set(`icon`);

        this._startBlock = ui.El(`div`, { class: `block start` }, this._body);
        let title = new ui.manipulators.Text(ui.El(`div`, { class: `title` }, this._startBlock));
        title.Set(`Start`);
        this._toolbar = this.Attach(ui.WidgetBar, `actionlist`, this._startBlock);
        this._toolbar.options = {
            orientation: ui.FLAGS.VERTICAL,
            stretch: ui.WidgetBar.FLAG_STRETCH,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [
                {
                    command: mkfCmds.CreateFamilyDoc,
                    variant: ui.FLAGS.MINIMAL, flavor: ui.FLAGS.CTA,
                    group:`n`
                },
                {
                    command: this.cmdNewFromTTF,
                    variant: ui.FLAGS.MINIMAL, flavor: nkm.com.FLAGS.LOADING
                },
                {
                    command: this.cmdNewFromSVGs,
                    variant: ui.FLAGS.MINIMAL, flavor: nkm.com.FLAGS.LOADING
                },
                {
                    command: mkfCmds.LoadFamilyDoc,
                    variant: ui.FLAGS.MINIMAL, flavor: nkm.com.FLAGS.LOADING,
                    group:`plop`
                },
            ]
        };


        console.log(nkm.env.CONF);

        this._recentBlock = ui.El(`div`, { class: `block end` }, this._body);
        title = new ui.manipulators.Text(ui.El(`div`, { class: `title` }, this._recentBlock));
        title.Set(`Recent`);

        this._footer = this.Attach(ui.WidgetBar, `footer`, this._body);
        this._footer.options = {
            //size:ui.FLAGS.SIZE_L,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [
                {
                    label: `${nkm.env.CONF.version}`,
                    cl:nkm.uilib.widgets.Tag,
                    size:ui.FLAGS.SIZE_XS,
                    group: `Version`
                },
                {
                    label: `About`,
                    variant: ui.FLAGS.MINIMAL, flavor: ui.FLAGS.CTA,
                    group: `about`,
                    trigger:{
                        fn:()=>{ shell.openExternal("https://github.com/Nebukam/mkfont") }
                    }
                },
                {
                    label: `Help`,
                    variant: ui.FLAGS.MINIMAL,
                    group: `help`,
                    trigger:{
                        fn:()=>{ shell.openExternal("https://github.com/Nebukam/mkfont/wiki") }
                    }
                },
                {
                    label: `Settings`,
                    variant: ui.FLAGS.FRAME,
                    group: `settings`,
                    command:mkfCmds.OpenPrefs
                }
            ]
        };
    }

}

module.exports = WelcomeView;
ui.Register(`mkf-welcome`, WelcomeView);