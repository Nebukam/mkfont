//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');
const fs = require('fs');

const mkfData = require(`../../data`);

const ActionSetSVG = require(`../actions/action-set-svg`);
const SVG = require(`../svg-operations`);

class CmdExternalEdit extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this.Disable();
    }

    _FetchContext() {

        if (nkm.utils.isInstanceOf(this._emitter.data, mkfData.Family)) {
            return this._emitter.data;
        }

        return null;

    }

    _InternalExecute() {

        // - Write content of Glyph in an SVG file on disk (temp file)    
        // - Start watching file for modifications
        // - When modification occur, update that glyph path using SVG path set
        // - Need to generate & use "external edit" import settings
        // - When to stop listening to changes ?
        // - keep track of glyphs that have an existing temp file ?
        // - keep track of temp files x_x

        this._Success();

    }

}

module.exports = CmdExternalEdit;