const fs = require(`fs`);
let characterFile = fs.readFileSync(`./assets/unicode-data.txt`, `utf8`);
let characterLines = characterFile.split(`\r\n`);
let blockFile = fs.readFileSync(`./assets/unicode-blocks.txt`, `utf8`);
let blockLines = blockFile.split(`\r\n`);

//#region Blocks
let tabs = `\n\t\t\t`;
let blocks = [];
let UNI_BLOCKS = `[\n`;
for (let i = 0; i < blockLines.length; i++) {

    let
        blocksplit = blockLines[i].split(`; `),
        id = blocksplit[0],
        range = id.split(`..`),
        name = blocksplit[1],
        start = parseInt(range[0], 16),
        end = parseInt(range[1], 16);

    blocks.push({ name: name, start: start, end: end, i: i, glyphs: [] });
    UNI_BLOCKS += `${tabs}{ name:'${name}', count:${end - start} }${i == blockLines.length - 1 ? '' : ','}`;
}
UNI_BLOCKS += `${tabs}]`;

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
    Lu: { name: `Letter, Uppercase` },
    Ll: { name: `Letter, Lowercase` },
    Lt: { name: `Letter, Titlecase` },

    Mn: { name: `Mark, Non-Spacing` },
    Mc: { name: `Mark, Spacing Combining` },
    Me: { name: `Mark, Enclosing` },

    Nd: { name: `Number, Decimal Digit` },
    Nl: { name: `Number, Letter` },
    No: { name: `Number, Other` },

    Zs: { name: `Separator, Space` },
    Zl: { name: `Separator, Line` },
    Zp: { name: `Separator, Paragraph` },

    Cc: { name: `Other, Control` },
    Cf: { name: `Other, Format` },
    Cs: { name: `Other, Surrogate` },
    Co: { name: `Other, Private Use` },

    //Informative Categories
    Lm: { name: `Letter, Modifier` },
    Lo: { name: `Letter, Other` },

    Pc: { name: `Punctuation, Connector` },
    Pd: { name: `Punctuation, Dash` },
    Ps: { name: `Punctuation, Open` },
    Pe: { name: `Punctuation, Close` },
    Pi: { name: `Punctuation, Initial quote` },
    Pf: { name: `Punctuation, Final quote` },
    Po: { name: `Punctuation, Other` },

    Sm: { name: `Symbol, Math` },
    Sc: { name: `Symbol, Currency` },
    Sk: { name: `Symbol, Modifier` },
    So: { name: `Symbol, Other` },

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

    obj.count = 0;
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

let charMap = {};
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
        charData = {};

    if (charName == `<control>`) { charName = entry[10]; }
    charData.name = charName;

    let cat = categories[generalCategory];
    cat.count++;
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

let UNI_CHAR_MAP = `{\n`;
for (var p in charMap) {
    let c = charMap[p];
    UNI_CHAR_MAP += `${tabs}'${p}':{ name:'${c.name}', canon:k.${c.canonical}, block:b[${c.block}]`;
    UNI_CHAR_MAP += `},`;
}
UNI_CHAR_MAP += `${tabs}}`;

let UNI_CATEGORIES = `{\n`;
for (let p in categories) {
    let obj = categories[p];
    UNI_CATEGORIES += `${tabs}'${p}':{ name:'${obj.name}', count:${obj.count} },`;
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