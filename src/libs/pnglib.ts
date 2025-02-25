export default function (width: number = 100, height: number = 30, depth: number = 8) {
    function write(buffer: Buffer | Array<any>, offs: string) {
        for (let i = 2; i < arguments.length; i++) {
            for (let j = 0; j < arguments[i].length; j++) {
                // @ts-ignore
                buffer[offs++] = arguments[i].charAt(j);
            }
        }
    }
    const byte2 = (w: number) => String.fromCharCode((w >> 8) & 255, w & 255);
    const byte4 = (w: number) => String.fromCharCode((w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255);
    const byte2lsb = (w: number) => String.fromCharCode(w & 255, (w >> 8) & 255);

    const pix_size = height * (width + 1); // default = 3041
    const data_size = 2 + pix_size + 5 * Math.floor((0xfffe + pix_size) / 0xffff) + 4; // default = 3041
    const ihdr_offs = 0; // IHDR offset and size
    const ihdr_size = 4 + 4 + 13 + 4; // default = 25
    const plte_offs = ihdr_offs + ihdr_size; // PLTE offset and size default (0 + 25 = 25)
    const plte_size = 4 + 4 + 3 * depth + 4; // default = 36
    const trns_offs = plte_offs + plte_size; // tRNS offset and size (25 + 36 = 61)
    const trns_size = 4 + 4 + depth + 4; // default = 20
    const idat_offs = trns_offs + trns_size; // IDAT offset and size (61 + 20 = 81)
    const idat_size = 4 + 4 + data_size + 4; // default = 3053
    const iend_offs = idat_offs + idat_size; // IEND offset and size (68 + 3053 = 3134)
    const iend_size = 4 + 4 + 4; // default = 12
    const buffer_size = iend_offs + iend_size; // total PNG size (3134 + 12 = 3146)
    console.log("total PNG size:", buffer_size);
    const buffer = new Array();
    const palette = new Object();
    let pindex = 0;
    const _crc32 = new Array();
    for (let i = 0; i < buffer_size; i++) {
        buffer[i] = "\x00";
    }

    // @ts-ignore
    write(buffer, ihdr_offs, byte4(ihdr_size - 12), "IHDR", byte4(width), byte4(height), "\x08\x03");
    // @ts-ignore
    write(buffer, plte_offs, byte4(plte_size - 12), "PLTE");
    // @ts-ignore
    write(buffer, trns_offs, byte4(trns_size - 12), "tRNS");
    // @ts-ignore
    write(buffer, idat_offs, byte4(idat_size - 12), "IDAT");
    // @ts-ignore
    write(buffer, iend_offs, byte4(iend_size - 12), "IEND");

    var header = ((8 + (7 << 4)) << 8) | (3 << 6); // default = 30912
    header += 31 - (header % 31); // value = 30938

    // @ts-ignore
    write(buffer, idat_offs + 8, byte2(header));
    for (var i = 0; (i << 16) - 1 < pix_size; i++) {
        var size, bits;
        if (i + 0xffff < pix_size) {
            size = 0xffff;
            bits = "\x00";
        } else {
            size = pix_size - (i << 16) - i;
            bits = "\x01";
        }
        // @ts-ignore
        write(buffer, idat_offs + 8 + 2 + (i << 16) + (i << 2), bits, byte2lsb(size), byte2lsb(~size));
    }

    for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) {
            if (c & 1) {
                c = -306674912 ^ ((c >> 1) & 0x7fffffff);
            } else {
                c = (c >> 1) & 0x7fffffff;
            }
        }
        _crc32[i] = c;
    }

    const index = function (x: number, y: number) {
        var i = y * (width + 1) + x + 1;
        var j = idat_offs + 8 + 2 + 5 * Math.floor(i / 0xffff + 1) + i;
        return j;
    };

    // export
    const color = function (red: number, green: number, blue: number, alpha: number) {
        alpha = alpha >= 0 ? alpha : 255;
        var color = (((((alpha << 8) | red) << 8) | green) << 8) | blue; // value = 1347440720
        // @ts-ignore
        if (typeof palette[color] == "undefined") {
            if (pindex == depth) return "\x00";
            var ndx = plte_offs + 8 + 3 * pindex;
            buffer[ndx + 0] = String.fromCharCode(red);
            buffer[ndx + 1] = String.fromCharCode(green);
            buffer[ndx + 2] = String.fromCharCode(blue);
            buffer[trns_offs + 8 + pindex] = String.fromCharCode(alpha);
            // @ts-ignore
            palette[color] = String.fromCharCode(pindex);
        }
        // @ts-ignore
        return palette[color];
    };

    // export
    const getBase64 = function () {
        var s = getDump();
        var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var c1, c2, c3, e1, e2, e3, e4;
        var l = s.length;
        var i = 0;
        var r = "";
        do {
            c1 = s.charCodeAt(i);
            e1 = c1 >> 2;
            c2 = s.charCodeAt(i + 1);
            e2 = ((c1 & 3) << 4) | (c2 >> 4);
            c3 = s.charCodeAt(i + 2);
            if (l < i + 2) {
                e3 = 64;
            } else {
                e3 = ((c2 & 0xf) << 2) | (c3 >> 6);
            }
            if (l < i + 3) {
                e4 = 64;
            } else {
                e4 = c3 & 0x3f;
            }
            r += ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
        } while ((i += 3) < l);
        console.log("total Img size:", r.length);
        return r;
    };

    const getDump = function () {
        var BASE = 65521; /* largest prime smaller than 65536 */
        var NMAX = 5552; /* NMAX is the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1 */
        var s1 = 1;
        var s2 = 0;
        var n = NMAX;
        for (var y = 0; y < height; y++) {
            for (var x = -1; x < width; x++) {
                s1 += buffer[index(x, y)].charCodeAt(0);
                s2 += s1;
                if ((n -= 1) == 0) {
                    s1 %= BASE;
                    s2 %= BASE;
                    n = NMAX;
                }
            }
        }
        s1 %= BASE;
        s2 %= BASE;
        // @ts-ignore
        write(buffer, idat_offs + idat_size - 8, byte4((s2 << 16) | s1));

        function crc32(png: Buffer | Array<any>, offs: number, size: number) {
            var crc = -1;
            for (var i = 4; i < size - 4; i += 1) {
                crc = _crc32[(crc ^ png[offs + i].charCodeAt(0)) & 0xff] ^ ((crc >> 8) & 0x00ffffff);
            }
            // @ts-ignore
            write(png, offs + size - 4, byte4(crc ^ -1));
        }

        crc32(buffer, ihdr_offs, ihdr_size);
        crc32(buffer, plte_offs, plte_size);
        crc32(buffer, trns_offs, trns_size);
        crc32(buffer, idat_offs, idat_size);
        crc32(buffer, iend_offs, iend_size);
        // return "\211PNG\r\n\032\n" + buffer.join("");
        return "\x89PNG\r\n\x1a\n" + buffer.join("");
    };
    return {
        buffer,
        index,
        color,
        getBase64
    };
}
