// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const { optimize } = require('svgo');
const svgpath = require('svgpath');

const domparser = new DOMParser();

class SVGOperations {
    constructor() { }

    static ProcessString(p_value, p_params) {

        let
            col = `eaeaea`,
            viewBox = { width: 1000, height: 1000 };

        // Quickfixes on string

        try {
            // Replace all colors with white
            let s = p_value.split(`:#`);
            for (let i = 1; i < s.length; i++) {
                let s2 = s[i], s3 = s2[3], s6 = s2[6];
                if (s3 == `;` || s3 == `}` || s3 == `"`) { s2 = `${col}${s2.substr(3)}`; }
                else if (s6 == `;` || s6 == `}` || s6 == `"`) { s2 = `${col}${s2.substr(6)}`; }
                s[i] = s2;
            }
            p_value = s.join(`:#`);
        } catch (e) { }

        // Manipulation on SVG element

        let svg = domparser.parseFromString(p_value, `image/svg+xml`)
            .getElementsByTagName(`svg`)[0];

        if (!svg) { return null; }

        this._rAtts(svg, [`width`, `height`, `viewBox`]);

        // Add viewBox
        svg.setAttribute(`viewBox`, `0 0 ${viewBox.width} ${viewBox.height}`);

        // Flatten groups
        let groups = svg.getElementsByTagName(`g`);
        for (let i = 0; i < groups.length; i++) {
            let children = groups[i].children;
            for (let c = 0; c < children.length; c++) {
                let child = children[c];
                if (child.tagName == `g`) { child.remove(); }
                else { svg.appendChild(child); }
            }
            //groups[i].remove();
        }

        // Remove unsupported rounded corners on rect elements
        this._rAttsOnTag(svg, `rect`, [`rx`, `ry`]);

        svg = domparser.parseFromString(
            optimize(svg.outerHTML,
                {
                    multipass: true,
                    plugins:
                        [
                            `preset-default`,
                            {
                                name: `convertShapeToPath`,
                                params: { convertArcs: true }
                            }
                        ]

                }).data, `image/svg+xml`)
            .getElementsByTagName(`svg`)[0];

        svg.removeAttribute(`style`);
        let path = svg.getElementsByTagName(`path`)[0];

        if (!path) {
            console.log(svg);
            console.warn(`SVG will be ignored : it does not contain a path.`);
            return null;
        } else {

            let pathlist = svg.getElementsByTagName(`path`);
            let str = ``;
            path = pathlist[0];
            for(let i = 0; i < pathlist.length; i++){
                let tp = pathlist[i];
                str += tp.getAttribute(`d`) + ` `;
                if(i > 0){ tp.remove(); }
            }

            path.setAttribute(`d`, str);

            // DEBUG : Try to scale D attribute
            path.removeAttribute(`style`);
            path.setAttribute(`fill`, `#${col}`);
            path.setAttribute(`style`, `fill:#${col}`);

            if (path.hasAttribute(`d`)) {
                let d = path.getAttribute(`d`);
                d = svgpath(d)
                    .scale(10)
                    //.translate(100,200)
                    //.rel()
                    //.round(1)
                    .toString();
                path.setAttribute(`d`, d);
            }
        }

        return svg;

    }

    static _rAtts(p_el, p_atts) {
        for (let i = 0; i < p_atts.length; i++) { p_el.removeAttribute(p_atts[i]); }
    }

    static _rAttsOnTag(p_el, p_tag, p_atts) {
        let children = p_el.getElementsByTagName(p_tag);
        for (let i = 0; i < children.length; i++) { this._rAtts(children[i], p_atts); }
    }

}

module.exports = SVGOperations;
