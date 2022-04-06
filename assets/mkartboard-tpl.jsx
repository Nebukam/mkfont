var unicodeList = [%unicodeList%];
var unicodeChars = [];

ParseList();
GenerateArtboards();

/*************/

function trim(str) { return str.replace(/^\s+/, '').replace(/\s+$/, ''); }
function substr(str, start, end) {
    var result = "";
    for (var i = start; i < end; i++) { result += str[i]; }
    return result;
}
function substring(str, start, length) {
    var result = "";
    if (!length) { length = str.length - start; }
    for (var i = start; i < start + length; i++) { result += str[i]; }
    return result;
}
/*************/

function ParseList() {

    for (var i = 0; i < unicodeList.length; i++) {
        var u = trim(unicodeList[i]);
        unicodeList[i] = u;
        if (substr(u, 0, 2) == "U+") {
            var n = parseInt(u.substring(2), 16);
            unicodeChars.push(String.fromCharCode(n));
        } else {
            unicodeChars.push(u);
        }

    }

    return true;

}

function GenerateArtboards() {

    var codes = unicodeList;
    var w = 100;
    var h = 100;
    var sp = 50;
    var perRow = Math.min(Math.floor(Math.sqrt(Math.min(codes.length, 1000))), 16383 / (w + sp));

    var docRef = app.documents.add(DocumentColorSpace.RGB, w, h, codes.length, DocumentArtboardLayout.GridByRow, sp, perRow);
    var layerLabels = docRef.layers.add();
    layerLabels.name = "labels";

    var layerOutlines = docRef.layers.add();
    layerOutlines.name = "reference outlines";

    for (var i = 0; i < codes.length; i++) {

        var artbrd = docRef.artboards[i];
        var text = unicodeChars[i];
        artbrd.name = unicodeList[i];

        AddLabel(text, layerLabels, artbrd);
        AddOutline(text, layerOutlines, artbrd, h);

    }

    layerLabels.locked = true;
    layerOutlines.locked = true;
}

function AddLabel(text, layer, artbrd) {

    var aRect = artbrd.artboardRect;
    var aX = aRect[0];
    var aY = aRect[3];

    var label = layer.textFrames.add();
    label.paragraphs.add(text);

    var tt = label.textRange.characters.length;
    for (var c = 0; c < tt; c++) {
        var tf = label.textRange.characters[c].characterAttributes;
        tf.size = 10;
    }

    var labelP = label.paragraphs[0].paragraphAttributes;
    labelP.justification = Justification.RIGHT;

    label.left = aX - (5 + label.width);
    label.top = aY + label.height;

}

function AddOutline(text, layer, artbrd, h) {

    var aRect = artbrd.artboardRect;
    var aX = aRect[0];
    var aY = aRect[3];

    var outline = layer.textFrames.add();
    outline.paragraphs.add(text);

    var _o = 0.25;
    var _r = (1 / (1 - _o));
    var _h = h * _r;

    var tt = outline.textRange.characters.length;
    for (var c = 0; c < tt; c++) {
        var ch = outline.textRange.characters[c];
        var tf = ch.characterAttributes;
        tf.size = _h;
    }

    var labelP = outline.paragraphs[0].paragraphAttributes;
    labelP.justification = Justification.LEFT;

    outline.left = aX;
    outline.top = (aY + (outline.height));
    outline.opacity = 25;

    for (var c = 0; c < tt; c++) {
        var ch = outline.textRange.characters[c];
        ch.baselineShift = -(_h * _o);
    }

    outline.createOutline();

}