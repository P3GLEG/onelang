export function arrayEq(a, b) {
    if (a === b) return true;
    if (a == null || b == null || a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false;

    return true;
}

export function deindent(str: string) {
    function getPadLen(line: string) {
        for (let i = 0; i < line.length; i++)
            if (line[i] !== ' ')
                return i;
        return -1; // whitespace line => pad === 0
    }

    const lines = str.split("\n");
    if (lines.length === 1) return str;

    if (getPadLen(lines[0]) === -1)
        lines.shift();

    const minPadLen = Math.min.apply(null, lines.map(getPadLen).filter(x => x !== -1));
    const newStr = lines.map(x => x.length !== 0 ? x.substr(minPadLen) : x).join("\n");
    return newStr;
}