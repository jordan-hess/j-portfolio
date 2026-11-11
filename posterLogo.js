// Draws the intro logo (see .logo / .name / .aspiring / .dev in index.html) onto a
// canvas, reproducing the same CSS geometry so the wall poster matches the intro.
//
// Everything below is in the intro's own CSS pixels (a 450 x 250 box), then
// scaled to fit the canvas. Notes on the intro's final state:
//  - .aspiring is shifted up 5px and NOT rotated (anime.js replaces the CSS rotate)
//  - .dev is rotated -18deg about its centre (anime.js replaces the CSS matrix)

const NAME = { left: 35, top: 15, size: 72, lineHeight: 0.8, tracking: -3,
               font: '"Bowlby One SC", "Arial Black", sans-serif', lines: ['JORDAN', '___Hess'] };
const ASPIRING = { left: 100, top: 120 - 5, size: 48, font: '"Birthstone", cursive', text: 'Aspiring' };
const DEV = { right: 25, top: 80, size: 25, tracking: 2, pad: 10, rotate: -18,
              font: '"Bitcount Prop Double", monospace', text: 'DEVELOPER' };
const BOX_W = 450;

// Baseline of a line box in CSS: half-leading + font ascent
function baselineIn(ctx, lineTop, lineHeight) {
    const m = ctx.measureText('Hg');
    const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    return lineTop + (lineHeight - (asc + desc)) / 2 + asc;
}

export function drawPosterLogo(canvas, colors = {}) {
    const ink = colors.ink ?? '#171717';
    const script = colors.script ?? '#6c748b';
    const stamp = colors.stamp ?? '#ff2b2b';

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.save();

    // Visible extents of the intro logo, in its own units (name starts at x=35,
    // stamp ends near x=430; top of name to bottom of "Aspiring" ~ 15..185)
    const contentLeft = 30, contentRight = 432, contentTop = 12, contentBottom = 182;
    const k = Math.min((W * 0.96) / (contentRight - contentLeft), (H * 0.9) / (contentBottom - contentTop));
    ctx.translate(
        (W - (contentRight - contentLeft) * k) / 2 - contentLeft * k,
        (H - (contentBottom - contentTop) * k) / 2 - contentTop * k
    );
    ctx.scale(k, k);
    ctx.textBaseline = 'alphabetic';

    // Name: two lines, tight leading and tracking
    ctx.font = `${NAME.size}px ${NAME.font}`;
    ctx.letterSpacing = `${NAME.tracking}px`;
    ctx.fillStyle = ink;
    const lh = NAME.size * NAME.lineHeight;
    NAME.lines.forEach((line, i) => {
        ctx.fillText(line, NAME.left, baselineIn(ctx, NAME.top + i * lh, lh));
    });

    // Aspiring (line-height: normal, so the line box is the font's own height)
    ctx.font = `${ASPIRING.size}px ${ASPIRING.font}`;
    ctx.letterSpacing = '0px';
    ctx.fillStyle = script;
    const am = ctx.measureText(ASPIRING.text);
    ctx.fillText(ASPIRING.text, ASPIRING.left, ASPIRING.top + am.fontBoundingBoxAscent);

    // DEVELOPER stamp
    ctx.font = `${DEV.size}px ${DEV.font}`;
    ctx.letterSpacing = `${DEV.tracking}px`;
    const dm = ctx.measureText(DEV.text);
    const textH = dm.fontBoundingBoxAscent + dm.fontBoundingBoxDescent;
    const boxW = dm.width + DEV.pad * 2;
    const boxH = textH + DEV.pad * 2;
    const boxLeft = BOX_W - DEV.right - boxW;
    ctx.save();
    ctx.translate(boxLeft + boxW / 2, DEV.top + boxH / 2);
    ctx.rotate(DEV.rotate * Math.PI / 180);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowOffsetY = 8 * k;
    ctx.shadowBlur = 12 * k;
    ctx.fillStyle = stamp;
    ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.shadowColor = 'transparent';
    // worn-stamp stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = -boxW / 2 + 3; x < boxW / 2; x += 4) ctx.fillRect(x, -boxH / 2, 1, boxH);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(DEV.text, 0, -textH / 2 + dm.fontBoundingBoxAscent);
    ctx.restore();

    ctx.restore();
}

export async function loadPosterFonts() {
    try {
        await Promise.all([
            document.fonts.load(`${NAME.size}px ${NAME.font}`),
            document.fonts.load(`${ASPIRING.size}px ${ASPIRING.font}`),
            document.fonts.load(`400 ${DEV.size}px ${DEV.font}`),
        ]);
    } catch { /* draw with fallbacks */ }
}
