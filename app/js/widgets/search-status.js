const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;


class SearchStatus extends ui.Widget {
    constructor() { super(); }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position':'relative',
                //'min-height': '250px',
                //'height': '250px',
                'min-width': '500px',
                'width': '250px',
                //'padding': '20px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'padding-bottom': '5px',
                'margin-bottom': '5px',
                //'border': '1px solid red',
            },
            '.emote':{
                'pointer-events':'none',
                'font-size':'1em',
                'text-align':'center',
                'opacity':'0.5'
            },
            '.label':{
                'pointer-events':'none',
                'text-align':'center'
            }
        }, super._Style());
    }

    _Render() {

        super._Render();
        this._emote = new ui.manipulators.Text(ui.El(`code`, {class:`emote`}, this._host));
        this._statusLabel = new ui.manipulators.Text(ui.El(`div`, {class:`label`}, this._host));

        this._emote.Set(` （＞人＜；） `);
        this._statusLabel.Set(`No results.`);

    }

    Progress(p_progress, p_numResults){
        this._emote.Set(Math.sin(p_progress * 10) > 0 ? ` o(*￣▽￣). ` : ` .(￣▽￣*)o `);
        this._statusLabel.Set(`Searching...<br><i>(${p_numResults} results so far)</i>`);
    }

    NoResults(){
        this._emote.Set(`（＞人＜；）`);
        this._statusLabel.Set(`No results.`);
    }


}

module.exports = SearchStatus;
ui.Register(`mkfont-search-status`, SearchStatus);