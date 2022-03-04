const fs = require(`fs`);
let characterFile = fs.readFileSync(`./assets/unicode-data.txt`, `utf8`);
let characterLines = characterFile.split(`\r\n`);
let blockFile = fs.readFileSync(`./assets/unicode-blocks.txt`, `utf8`);
let blockLines = blockFile.split(`\r\n`);

//#region Blocks
let tabs = `\n\t\t\t`;
let blocks = [];
for (let i = 0; i < blockLines.length; i++) {

    let
        blocksplit = blockLines[i].split(`; `),
        id = blocksplit[0],
        range = id.split(`..`),
        name = blocksplit[1],
        start = parseInt(range[0], 16),
        end = parseInt(range[1], 16);

    blocks.push({ name: name, start: start, end: end, i: i, glyphs: [] });
}

function FindBlock(index) {
    for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        if (index >= b.start && index <= b.end) { return i; }
    }
    return null;
}

//#endregion

//#region Categories

let categories = {
    // Normative Categories
    Lu: { name: `Letter, Uppercase`, icon:`directory` },
    Ll: { name: `Letter, Lowercase`, icon:`directory` },
    Lt: { name: `Letter, Titlecase`, icon:`directory` },

    Mn: { name: `Mark, Non-Spacing`, icon:`directory` },
    Mc: { name: `Mark, Spacing Combining`, icon:`directory` },
    Me: { name: `Mark, Enclosing`, icon:`directory` },

    Nd: { name: `Number, Decimal Digit`, icon:`directory` },
    Nl: { name: `Number, Letter`, icon:`directory` },
    No: { name: `Number, Other`, icon:`directory` },

    Zs: { name: `Separator, Space`, icon:`directory` },
    Zl: { name: `Separator, Line`, icon:`directory` },
    Zp: { name: `Separator, Paragraph`, icon:`directory` },

    Cc: { name: `Other, Control`, icon:`directory` },
    Cf: { name: `Other, Format`, icon:`directory` },
    Cs: { name: `Other, Surrogate`, icon:`directory` },
    Co: { name: `Other, Private Use`, icon:`directory` },

    //Informative Categories
    Lm: { name: `Letter, Modifier`, icon:`directory` },
    Lo: { name: `Letter, Other`, icon:`directory` },

    Pc: { name: `Punctuation, Connector`, icon:`directory` },
    Pd: { name: `Punctuation, Dash`, icon:`directory` },
    Ps: { name: `Punctuation, Open`, icon:`directory` },
    Pe: { name: `Punctuation, Close`, icon:`directory` },
    Pi: { name: `Punctuation, Initial quote`, icon:`directory` },
    Pf: { name: `Punctuation, Final quote`, icon:`directory` },
    Po: { name: `Punctuation, Other`, icon:`directory` },

    Sm: { name: `Symbol, Math`, icon:`directory` },
    Sc: { name: `Symbol, Currency`, icon:`directory` },
    Sk: { name: `Symbol, Modifier`, icon:`directory` },
    So: { name: `Symbol, Other`, icon:`directory` },

    Liga: { name: `Custom, Ligatures`, icon:`directory` },

};

let generalCategories = {};
for (let p in categories) {
    let
        obj = categories[p],
        name = obj.name.split(`, `),
        general = name[0],
        gCat;

    obj.general = general;
    obj.name = name[1];

    gCat = generalCategories[general];
    if (gCat) { gCat.children.push(p); }
    else {
        gCat = { name: general, children: [] };
        generalCategories[general] = gCat;
    }

    obj.id = p;
    obj.count = 0;
    obj.glyphs = [];
}

//#endregion

//#region Canonical combining classes

let canonicalClasses = {
    _0: { name: `Spacing, split, enclosing, reordrant, and Tibetan subjoined` },
    _1: { name: `Overlays and interior` },
    _7: { name: `Nuktas` },
    _8: { name: `Hiragana/Katakana voicing marks` },
    _9: { name: `Viramas` },
    _10: { name: `Start of fixed position classes` },
    _199: { name: `End of fixed position classes` },
    _200: { name: `Below left attached` },
    _202: { name: `Below attached` },
    _204: { name: `Below right attached` },
    _208: { name: `Left attached (reordrant around single base character)` },
    _210: { name: `Right attached` },
    _212: { name: `Above left attached` },
    _214: { name: `Above attached` },
    _216: { name: `Above right attached` },
    _218: { name: `Below left` },
    _220: { name: `Below` },
    _222: { name: `Below right` },
    _224: { name: `Left (reordrant around single base character)` },
    _226: { name: `Right` },
    _228: { name: `Above left` },
    _230: { name: `Above` },
    _232: { name: `Above right` },
    _233: { name: `Double below` },
    _234: { name: `Double above` },
    _240: { name: `Below (iota subscript)` },
};

for (let p in canonicalClasses) {
    let obj = canonicalClasses[p];
    obj.count = 0;
}

//#endregion

//#region Decompositions

let decompositions = {
    '<font>': { name: `A font variant (e.g. a blackletter form).` },
    '<noBreak>': { name: `A no-break version of a space or hyphen.` },
    '<initial>': { name: `An initial presentation form (Arabic).` },
    '<medial>': { name: `A medial presentation form (Arabic).` },
    '<final>': { name: `A final presentation form (Arabic).` },
    '<isolated>': { name: `An isolated presentation form (Arabic).` },
    '<circle>': { name: `An encircled form.` },
    '<super>': { name: `A superscript form.` },
    '<sub>': { name: `A subscript form.` },
    '<vertical>': { name: `A vertical layout presentation form.` },
    '<wide>': { name: `A wide (or zenkaku) compatibility character.` },
    '<narrow>': { name: `A narrow (or hankaku) compatibility character.` },
    '<small>': { name: `A small variant form (CNS compatibility).` },
    '<square>': { name: `A CJK squared font variant.` },
    '<fraction>': { name: `A vulgar fraction form.` },
    '<compat>': { name: `Otherwise unspecified compatibility character.` },
};


for (let p in decompositions) {
    let obj = decompositions[p];
    obj.count = 0;
}

//#endregion

//#region Glyphs

let charMap = {};
let charList = [];
for (let i = 0; i < characterLines.length; i++) {
    let
        entry = characterLines[i].split(`;`),
        charCode = entry[0].toLowerCase(),
        charName = entry[1],
        generalCategory = entry[2],
        canonical = `_${entry[3]}`,
        bidircat = entry[4],
        decomposition = entry[5],
        index = parseInt(charCode, 16),
        block = FindBlock(index),
        charData = { i: i };

    if (charName == `<control>`) { charName = entry[10]; }
    charData.name = charName;

    let cat = categories[generalCategory];
    cat.count++;
    cat.glyphs.push(charData);
    charData.category = cat;

    let canon = canonicalClasses[canonical];
    if (canon) { canon.count++; }

    charData.canonical = `${canonical}`;
    charData.canon = canon;
    charData.block = block;

    try {

        let refs = decomposition.split(` `);
        if (refs[0].includes(`<`)) {
            decomp = decompositions[refs[0]];
            decomp.count++;
            charData.decomp = decomp;
            refs.shift();
        }

        if (refs.length != 0) {
            charData.relatives = [];
            for (let d = 0; d < refs.length; d++) {
                charData.relatives.push(refs[d]);
            }
        }

    } catch (e) { }

    charMap[`${charCode}`] = charData;
    blocks[block].glyphs.push(charData);
    charList.push(charData);

}

//#region Trim glyph names

// Trim glyph name per category
for (let b = 0; b < blocks.length; b++) {
    let
        block = blocks[b],
        glyphs = block.glyphs,
        matchCounter = {};



    for (let g = 0; g < glyphs.length; g++) {
        let
            glyph = glyphs[g],
            name = glyph.name,
            spaceSplits = name.split(` `),
            tiretSplits = name.split(`-`);

        for (let i = 0; i < spaceSplits.length; i++) {
            let concat = ``;
            try {
                for (let ii = 0; ii < i; ii++) {
                    concat += spaceSplits[ii];
                    if (ii != i - 1) { concat += ` `; }
                }
                if (!(concat in matchCounter)) {
                    matchCounter[concat] = 1;
                } else {
                    matchCounter[concat]++;
                }
            } catch (e) { }
        }

        if (tiretSplits.length > 1) {
            let concat = tiretSplits[0];
            if (!(concat in matchCounter)) {
                matchCounter[concat] = 1;
            } else {
                matchCounter[concat]++;
            }
        }

    }

    let longestMatch = ``;
    for (var m in matchCounter) {
        let count = matchCounter[m];
        if (count == glyphs.length) {
            if (m.length > longestMatch.length) {
                longestMatch = m;
            }

        }
    }

    if (longestMatch.length != 0 && !longestMatch.includes(`<`)) {

        for (let g = 0; g < glyphs.length; g++) {
            let
                glyph = glyphs[g],
                name = glyph.name;

            name = name.replace(`${longestMatch}-`, ``);
            name = name.replace(longestMatch, ``);
            name = name.trim();
            glyph.name = name;
        }

    }

    /*
    for (let g = 0; g < glyphs.length; g++) {
        let
            glyph = glyphs[g],
            name = glyph.name;

        name = name.replace(`NUMBER`, `#`);
        name = name.replace(`DIGIT`, `#`);
        name = name.replace(`SYLLABLE`, `🎜`);
        name = name.replace(`TONAL MARK`, `𝇢`);
        //name = name.replace(`CAPITAL LETTER`, `Upper`);
        //name = name.replace(`SMALL LETTER`, `Lower`);
        glyph.name = name;
    }
    */

}

//#endregion

//#endregion

//#region Range computing

function getRanges(p_glyphList) {
    p_glyphList.sort((a, b) => { return a.i - b.i; });
    let ranges = [];
    let currentRange = null;
    let last_i = -1;
    let cats = [];
    let min = 9999999999;
    let max = -1;

    for (let i = 0; i < p_glyphList.length; i++) {
        let glyph = p_glyphList[i];
        let current_i = glyph.i;

        if (last_i == -1 ||
            current_i == last_i + 1) {
            if (!currentRange) {
                currentRange = [];
                ranges.push(currentRange);
            }
        } else {
            console.log(`${current_i} / ${last_i + 1} / ${last_i} `);
            currentRange = [];
            ranges.push(currentRange);
        }


        if (!cats.includes(glyph.category.id)) { cats.push(glyph.category.id); }

        if (current_i < min) { min = current_i; }
        if (current_i > max) { max = current_i; }

        currentRange.push(current_i);
        last_i = current_i;
    }

    let rstr = ``;
    for (let i = 0; i < ranges.length; i++) {

        let sr = ranges[i];
        if (sr.length == 1) {
            rstr += sr[0];
        } else {
            rstr += `[${sr[0]},${sr[sr.length - 1]}]`;
        }

        if (i != ranges.length - 1) { rstr += `,`; }
    }

    for (let i = 0; i < cats.length; i++) { cats[i] = `c.${cats[i]}`; }

    return { r: rstr, c: cats, rmin: min, rmax: max };

}

for (let i = 0; i < blocks.length; i++) {
    let bl = blocks[i];
    let glyphList = [];
    for (let bi = 0; bi < bl.glyphs.length; bi++) {
        glyphList.push(bl.glyphs[bi]);
    }
    let rinfos = getRanges(glyphList);
    bl.ranges = rinfos;
}

//#endregion

//#region Code generation

let UNI_BLOCKS = `[\n`;
for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i];
    //TODO : cross reference which categories are included within the ranges
    let rinfos = b.ranges;
    let cstr = rinfos.c ? `cats:[${rinfos.c.join(',')}], ` : ``;
    UNI_BLOCKS += `${tabs}{ name:'${b.name}', count:${b.end - b.start}, icon:'view-grid', ${cstr}range:[${b.start},${b.end}]}${i == blockLines.length - 1 ? '' : ','}`;
}
UNI_BLOCKS += `${tabs}]`;


let UNI_CHAR_MAP = `{\n`;
for (var p in charMap) {
    let c = charMap[p];
    UNI_CHAR_MAP += `${tabs}'${p}':{ u:'${p}', i:${c.i}, name:'${c.name}', canon:k.${c.canonical}, block:b[${c.block}]`;
    UNI_CHAR_MAP += `},`;
}
UNI_CHAR_MAP += `${tabs}}`;

let UNI_CATEGORIES = `{\n`;
for (let p in categories) {
    let obj = categories[p];
    let rinfos = getRanges(obj.glyphs);
    UNI_CATEGORIES += `${tabs}'${p}':{ name:'${obj.name}', count:${obj.count}, imin:${rinfos.rmin}, imax:${rinfos.rmax}, icon:'${obj.icon}', includes:[${rinfos.r}] },`;
}
UNI_CATEGORIES += `${tabs}}`;

let UNI_GENERAL_CATEGORIES = `{\n`;
for (let p in generalCategories) {

    let obj = generalCategories[p],
        children = obj.children,
        count = 0;

    for (let i = 0; i < children.length; i++) {
        let ch = children[i];
        count += categories[ch].count;
        children[i] = `c.${ch}`;
    }
    obj.count = count;

    UNI_GENERAL_CATEGORIES += `${tabs}'${p}':{ name:'${obj.name}', count:${count}, childrens:[${children.join(`, `)}] },`;
}
UNI_GENERAL_CATEGORIES += `${tabs}}`;

let UNI_CANON = `{\n`;
for (let p in canonicalClasses) {
    let obj = canonicalClasses[p];
    UNI_CANON += `${tabs}${p}:{ name:'${obj.name}', count:${obj.count} },`;
}
UNI_CANON += `${tabs}}`;

//#endregion

console.log(generalCategories);
console.log(categories);
console.log(canonicalClasses);
console.log(decompositions);
console.log(characterLines.length);
//console.log(charMap);



let js = fs.readFileSync(`./assets/unicode-singleton-template.js`, `utf8`);
js = js.split(`UNI_BLOCKS`).join(UNI_BLOCKS);
js = js.split(`UNI_GENERAL_CATEGORIES`).join(UNI_GENERAL_CATEGORIES);
js = js.split(`UNI_CATEGORIES`).join(UNI_CATEGORIES);
js = js.split(`UNI_CANON`).join(UNI_CANON);
js = js.split(`UNI_CHAR_MAP`).join(UNI_CHAR_MAP);
fs.writeFileSync(`./app/js/unicode.js`, js);