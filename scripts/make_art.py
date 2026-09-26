"""Generates every raster asset the Gbena Grant app ships with.

Outputs
-------
assets/posters/<id>.jpg        460x690  poster art for each catalogue title
assets/backdrops/<genre>.jpg   1200x675 wide art shared per genre
assets/icon.png                1024x1024
assets/adaptive-icon.png       1024x1024 (transparent, 66% safe zone)
assets/splash.png              1284x2778
assets/favicon.png             48x48
lib/data/catalog.ts            typed catalogue
lib/data/artwork.ts            static require() maps for Metro
"""
import colorsys
import hashlib
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalog import as_dicts, slug  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
FONTS = "/usr/share/fonts/truetype/agon-slides"
STATIC_FONTS = os.path.join(ASSETS, "fonts")

try:
    import numpy as np
    HAVE_NUMPY = True
except Exception:  # pragma: no cover
    HAVE_NUMPY = False

BRAND_BG = (12, 12, 18)          # #0c0c12
GOLD = (240, 180, 41)            # #f0b429
GOLD_SOFT = (255, 214, 122)
CREAM = (245, 243, 238)

GENRE_HUE = {
    "Drama": 205, "Crime": 350, "Action": 18, "Sci-Fi": 250, "Thriller": 165,
    "Comedy": 42, "Animation": 300, "Romance": 330, "Horror": 0,
    "Adventure": 95, "Fantasy": 275, "War": 70, "Western": 30,
    "Music": 285, "History": 190, "Nollywood": 140, "Trending": 225,
}


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def h2rgb(h, s, v):
    r, g, b = colorsys.hsv_to_rgb((h % 360) / 360.0, s, v)
    return (int(r * 255), int(g * 255), int(b * 255))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hash01(seed, salt=0):
    h = hashlib.sha256(f"{seed}:{salt}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def v_gradient(w, h, stops):
    """stops: list of (pos0..1, rgb)"""
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        i = 0
        while i < len(stops) - 2 and t > stops[i + 1][0]:
            i += 1
        (p0, c0), (p1, c1) = stops[i], stops[i + 1]
        local = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
        local = max(0.0, min(1.0, local))
        px_row = mix(c0, c1, local)
        for x in range(w):
            px[x, y] = px_row
    return img


def fast_v_gradient(w, h, stops):
    """Column image stretched to size - far quicker than per-pixel loops."""
    col = v_gradient(1, h, stops)
    return col.resize((w, h))


def radial(img, cx, cy, radius, color, strength=1.0):
    layer = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(layer)
    steps = 26
    for i in range(steps, 0, -1):
        r = radius * i / steps
        alpha = int(255 * strength * (1 - i / steps) ** 1.7)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=alpha)
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.18))
    tinted = Image.new("RGB", img.size, color)
    img.paste(tinted, (0, 0), layer)
    return img


def grain(img, amount=10):
    if not HAVE_NUMPY:
        return img
    arr = np.asarray(img).astype(np.int16)
    noise = np.random.randint(-amount, amount + 1, arr.shape[:2], dtype=np.int16)
    arr = np.clip(arr + noise[:, :, None], 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def vignette(img, strength=0.62):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.22, -h * 0.16, w * 1.22, h * 1.16], fill=int(255 * strength))
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.28))
    black = Image.new("RGB", (w, h), (0, 0, 0))
    img.paste(black, (0, 0), mask)
    return img


def scrim(img, height_ratio, color=(0, 0, 0), max_alpha=235):
    w, h = img.size
    sh = int(h * height_ratio)
    layer = Image.new("L", (w, sh), 0)
    d = ImageDraw.Draw(layer)
    for y in range(sh):
        t = y / max(1, sh - 1)
        d.line([(0, y), (w, y)], fill=int(max_alpha * t ** 1.5))
    img.paste(Image.new("RGB", (w, sh), color), (0, h - sh), layer)
    return img


def top_scrim(img, height_ratio=0.3, max_alpha=150):
    w, h = img.size
    sh = int(h * height_ratio)
    layer = Image.new("L", (w, sh), 0)
    d = ImageDraw.Draw(layer)
    for y in range(sh):
        t = 1 - y / max(1, sh - 1)
        d.line([(0, y), (w, y)], fill=int(max_alpha * t ** 1.4))
    img.paste(Image.new("RGB", (w, sh), (0, 0, 0)), (0, 0), layer)
    return img


def font(name, size):
    return ImageFont.truetype(os.path.join(STATIC_FONTS, name + ".ttf"), size)


def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_text(draw, text, fam, size, max_w, min_size=10):
    while size > min_size:
        fnt = font(fam, size)
        if draw.textlength(text, font=fnt) <= max_w:
            return fnt, size
        size -= 1
    return font(fam, min_size), min_size


def spaced_text(draw, xy, text, fnt, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking
    return x


def spaced_width(draw, text, fnt, tracking):
    return sum(draw.textlength(c, font=fnt) + tracking for c in text)


# --------------------------------------------------------------------------- #
# motifs
# --------------------------------------------------------------------------- #
def motif_orb(img, pal, rnd):
    w, h = img.size
    d = ImageDraw.Draw(img, "RGBA")
    cx = w * (0.3 + rnd[0] * 0.4)
    cy = h * (0.30 + rnd[1] * 0.12)
    r = w * (0.26 + rnd[2] * 0.1)
    radial(img, cx, cy, r * 2.6, pal["accent"], 0.55)
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(5):
        rr = r + i * (w * 0.055)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  outline=pal["accent"] + (max(10, 70 - i * 14),), width=2)
    ball = Image.new("RGB", (int(r * 2), int(r * 2)))
    bd = ImageDraw.Draw(ball)
    for y in range(ball.size[1]):
        t = y / ball.size[1]
        bd.line([(0, y), (ball.size[0], y)], fill=mix(pal["glow"], pal["accent"], t))
    mask = Image.new("L", ball.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, ball.size[0], ball.size[1]], fill=255)
    img.paste(ball, (int(cx - r), int(cy - r)), mask)
    d = ImageDraw.Draw(img, "RGBA")
    d.line([(0, int(cy + r * 1.5)), (w, int(cy + r * 1.5))], fill=pal["accent"] + (90,), width=2)


def motif_beams(img, pal, rnd):
    w, h = img.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    n = 5
    for i in range(n):
        x = w * (0.1 + 0.8 * i / max(1, n - 1)) + (rnd[i % len(rnd)] - 0.5) * w * 0.12
        width = w * (0.03 + rnd[(i + 2) % len(rnd)] * 0.05)
        d.polygon([(x - width, -h * 0.1), (x + width, -h * 0.1),
                   (x + width * 3.2, h * 1.1), (x - width * 3.2, h * 1.1)],
                  fill=pal["accent"] + (26 + int(rnd[i % len(rnd)] * 26),))
    layer = layer.filter(ImageFilter.GaussianBlur(w * 0.02))
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"))


def motif_strip(img, pal, rnd):
    w, h = img.size
    d = ImageDraw.Draw(img, "RGBA")
    band_h = int(h * 0.42)
    top = int(h * 0.16 + rnd[0] * h * 0.1)
    d.rectangle([0, top, w, top + band_h], fill=(8, 8, 12, 210))
    hole_w, hole_h = int(w * 0.055), int(band_h * 0.13)
    gap = int(w * 0.088)
    x = gap // 2
    while x < w:
        d.rounded_rectangle([x, top + int(band_h * 0.05), x + hole_w, top + int(band_h * 0.05) + hole_h],
                            radius=3, fill=pal["accent"] + (150,))
        d.rounded_rectangle([x, top + band_h - int(band_h * 0.05) - hole_h, x + hole_w, top + band_h - int(band_h * 0.05)],
                            radius=3, fill=pal["accent"] + (150,))
        x += gap
    inner = top + int(band_h * 0.24)
    inner_h = band_h - int(band_h * 0.48)
    for i in range(4):
        fx = int(w * 0.06 + i * w * 0.235)
        fw = int(w * 0.19)
        d.rounded_rectangle([fx, inner, fx + fw, inner + inner_h], radius=4,
                            fill=mix(pal["accent"], pal["glow"], rnd[i % len(rnd)]) + (95,))
    radial(img, w * 0.5, top + band_h * 0.5, w * 0.7, pal["accent"], 0.22)


def motif_peaks(img, pal, rnd):
    w, h = img.size
    d = ImageDraw.Draw(img, "RGBA")
    base = h * 0.62
    radial(img, w * (0.25 + rnd[0] * 0.5), base * 0.55, w * 0.75, pal["glow"], 0.5)
    d = ImageDraw.Draw(img, "RGBA")
    layers = 4
    for i in range(layers):
        t = i / max(1, layers - 1)
        y0 = base + i * h * 0.075
        amp = h * (0.16 - 0.03 * i)
        pts = [(0, h)]
        steps = 7
        for s in range(steps + 1):
            x = w * s / steps
            y = y0 - abs(math.sin(s * 1.1 + rnd[s % len(rnd)] * 3 + i)) * amp
            pts.append((x, y))
        pts.append((w, h))
        col = mix(pal["accent"], (5, 5, 9), 0.25 + t * 0.72)
        d.polygon(pts, fill=col + (255,))


def motif_rings(img, pal, rnd):
    w, h = img.size
    radial(img, w * 0.5, h * 0.42, w * 0.85, pal["accent"], 0.35)
    d = ImageDraw.Draw(img, "RGBA")
    cx, cy = w * 0.5, h * 0.42
    for i in range(9):
        r = w * (0.10 + i * 0.075)
        alpha = max(12, 120 - i * 12)
        d.ellipse([cx - r, cy - r * 0.98, cx + r, cy + r * 0.98],
                  outline=mix(pal["accent"], CREAM, 0.25) + (alpha,), width=3)
    d.ellipse([cx - w * 0.055, cy - w * 0.055, cx + w * 0.055, cy + w * 0.055],
              fill=pal["glow"] + (235,))


def motif_watermark(img, pal, rnd, letter):
    w, h = img.size
    radial(img, w * 0.5, h * 0.38, w * 0.95, pal["accent"], 0.3)
    size = int(w * 1.55)
    fnt = font("PlayfairDisplay-Black", size)
    tmp = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    bb = td.textbbox((0, 0), letter, font=fnt)
    td.text((w / 2 - (bb[0] + bb[2]) / 2, h * 0.36 - (bb[1] + bb[3]) / 2),
            letter, font=fnt, fill=mix(pal["accent"], CREAM, 0.35) + (58,))
    tmp = tmp.filter(ImageFilter.GaussianBlur(1.2))
    img.paste(Image.alpha_composite(img.convert("RGBA"), tmp).convert("RGB"))
    d = ImageDraw.Draw(img, "RGBA")
    d.line([(w * 0.12, h * 0.60), (w * 0.88, h * 0.60)], fill=pal["accent"] + (120,), width=2)


MOTIFS = [motif_orb, motif_beams, motif_strip, motif_peaks, motif_rings]


def palette_for(movie):
    genre = movie["genres"][0]
    base = GENRE_HUE.get(genre, 210)
    jitter = (hash01(movie["id"], 7) - 0.5) * 26
    h = base + jitter
    return {
        "hue": h,
        "top": h2rgb(h + 10, 0.52, 0.30),
        "mid": h2rgb(h, 0.68, 0.16),
        "bottom": h2rgb(h - 14, 0.80, 0.055),
        "accent": h2rgb(h + 22, 0.72, 0.92),
        "glow": h2rgb(h + 40, 0.42, 1.0),
    }


# --------------------------------------------------------------------------- #
# posters
# --------------------------------------------------------------------------- #
PW, PH = 460, 690


def draw_poster(movie, idx):
    pal = palette_for(movie)
    rnd = [hash01(movie["id"], i) for i in range(12)]
    img = fast_v_gradient(PW, PH, [(0.0, pal["top"]), (0.45, pal["mid"]), (1.0, pal["bottom"])])

    variant = idx % 6
    if variant == 5:
        motif_watermark(img, pal, rnd, movie["title"][0].upper())
    else:
        MOTIFS[variant](img, pal, rnd)

    vignette(img, 0.55)
    top_scrim(img, 0.26, 120)
    scrim(img, 0.52, (4, 4, 8), 242)
    img = grain(img, 7)

    d = ImageDraw.Draw(img, "RGBA")
    pad = 26

    # brand mark
    bf = font("SpaceGrotesk-Bold", 15)
    d.rounded_rectangle([pad, pad, pad + 30, pad + 30], radius=8, fill=GOLD + (235,))
    tf = font("SpaceGrotesk-Bold", 16)
    bb = d.textbbox((0, 0), "G", font=tf)
    d.text((pad + 15 - (bb[2] - bb[0]) / 2 - bb[0], pad + 15 - (bb[3] - bb[1]) / 2 - bb[1]),
           "G", font=tf, fill=(20, 16, 6, 255))
    spaced_text(d, (pad + 40, pad + 8), "GBENA GRANT", bf, CREAM + (190,), 2.4)

    # rating chip
    rt = f"{movie['rating']:.1f}"
    rf = font("Outfit-Bold", 17)
    star = "\u2605"
    rw = d.textlength(rt, font=rf) + 24
    d.rounded_rectangle([PW - pad - rw, pad, PW - pad, pad + 30], radius=15, fill=(10, 10, 14, 200))
    d.text((PW - pad - rw + 11, pad + 5), star, font=font("Outfit-Bold", 15), fill=GOLD + (255,))
    d.text((PW - pad - rw + 11 + 17, pad + 5), rt, font=rf, fill=CREAM + (245,))

    # ---- meta row (anchored to the bottom edge) ----
    mins = movie["runtime"]
    meta = f"{movie['year']}  \u00b7  {mins // 60}h {mins % 60:02d}m  \u00b7  {' / '.join(movie['genres'][:2])}"
    mf = font("Outfit-Medium", 15)
    meta_h = 18
    meta_y = PH - pad - meta_h
    spaced_text(d, (pad, meta_y), meta.upper(), mf, (206, 205, 214, 235), 1.1)

    # ---- title block (grows upward from the meta row, never overlaps it) ----
    serif = variant in (0, 2, 5)
    fam = "PlayfairDisplay-Bold" if serif else "Outfit-ExtraBold"
    max_w = PW - pad * 2
    title = movie["title"]
    block_bottom = meta_y - 24

    n = len(title)
    start = 54 if n <= 12 else (48 if n <= 18 else (42 if n <= 26 else (36 if n <= 36 else 31)))
    size = start
    while size > 17:
        fnt = font(fam, size)
        lines = wrap(d, title, fnt, max_w)
        if len(lines) <= 3:
            break
        size -= 2
    else:
        size = 17
    fnt = font(fam, size)
    lines = wrap(d, title, fnt, max_w)[:3]

    line_h = int(round(size * 1.14))
    block_h = line_h * len(lines)
    y = block_bottom - block_h

    d.rectangle([pad, y - 20, pad + 46, y - 15], fill=GOLD + (240,))
    for i, ln in enumerate(lines):
        ty = y + i * line_h
        d.text((pad + 2, ty + 3), ln, font=fnt, fill=(0, 0, 0, 150))
        d.text((pad, ty), ln, font=fnt, fill=(252, 251, 248, 255))

    if movie["badge"]:
        btxt = movie["badge"].upper()
        bfm = font("Outfit-SemiBold", 12)
        bw = d.textlength(btxt, font=bfm) + 20
        by = pad + 44
        d.rounded_rectangle([PW - pad - bw, by, PW - pad, by + 24], radius=12,
                            fill=GOLD + (235,))
        d.text((PW - pad - bw + 10, by + 5), btxt, font=bfm, fill=(24, 18, 4, 255))

    # hairline frame
    d.rectangle([8, 8, PW - 9, PH - 9], outline=(255, 255, 255, 26), width=1)
    return img


# --------------------------------------------------------------------------- #
# backdrops
# --------------------------------------------------------------------------- #
BW, BH = 1200, 675


def draw_backdrop(genre, idx):
    base = GENRE_HUE.get(genre, 210)
    pal = {
        "top": h2rgb(base + 14, 0.55, 0.26),
        "mid": h2rgb(base, 0.70, 0.13),
        "bottom": h2rgb(base - 16, 0.82, 0.045),
        "accent": h2rgb(base + 26, 0.70, 0.95),
        "glow": h2rgb(base + 44, 0.40, 1.0),
    }
    rnd = [hash01(genre, i) for i in range(12)]
    img = fast_v_gradient(BW, BH, [(0.0, pal["top"]), (0.5, pal["mid"]), (1.0, pal["bottom"])])
    MOTIFS[idx % len(MOTIFS)](img, pal, rnd)
    vignette(img, 0.5)
    scrim(img, 0.75, (6, 6, 10), 225)
    top_scrim(img, 0.3, 110)
    img = grain(img, 6)
    d = ImageDraw.Draw(img, "RGBA")
    fam = "PlayfairDisplay-Bold" if idx % 2 == 0 else "Outfit-ExtraBold"
    fnt = font(fam, 150)
    label = genre.upper()
    lw = d.textlength(label, font=fnt)
    if lw > BW * 0.86:
        fnt, _ = fit_text(d, label, fam, 150, BW * 0.86, 60)
        lw = d.textlength(label, font=fnt)
    d.text(((BW - lw) / 2, BH * 0.30), label, font=fnt, fill=(255, 255, 255, 26))
    return img


# --------------------------------------------------------------------------- #
# hero backdrops (one per featured carousel title)
# --------------------------------------------------------------------------- #
HERO_IDS = [
    "dune-two", "oppenheimer", "parasite", "jagun-jagun",
    "inception", "lionheart", "endgame", "whiplash",
]


def draw_hero(movie, idx):
    pal = palette_for(movie)
    rnd = [hash01(movie["id"] + "-hero", i) for i in range(12)]
    img = fast_v_gradient(BW, BH, [(0.0, pal["top"]), (0.5, pal["mid"]), (1.0, pal["bottom"])])
    MOTIFS[idx % len(MOTIFS)](img, pal, rnd)

    # oversized title watermark, right aligned
    d = ImageDraw.Draw(img, "RGBA")
    fam = "PlayfairDisplay-Black" if idx % 2 == 0 else "Outfit-ExtraBold"
    words = movie["title"].replace(":", "").split()
    size = 190 if len(words) <= 1 else (150 if len(words) == 2 else 104)
    fnt = font(fam, size)
    longest = max(words, key=lambda w: d.textlength(w, font=fnt))
    while d.textlength(longest, font=fnt) > BW * 0.8 and fnt.size > 40:
        fnt = font(fam, fnt.size - 6)
    lh = int(fnt.size * 1.02)
    total = lh * len(words)
    y = (BH - total) / 2 - lh * 0.1
    for w in words:
        wd = d.textlength(w, font=fnt)
        d.text((BW - wd - BW * 0.05, y), w, font=fnt, fill=(255, 255, 255, 34))
        y += lh

    vignette(img, 0.5)
    top_scrim(img, 0.34, 120)
    scrim(img, 0.82, (6, 6, 10), 235)
    img = grain(img, 6)

    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([int(BW * 0.055), int(BH * 0.60), int(BW * 0.055) + 74, int(BH * 0.60) + 6],
                fill=GOLD + (245,))
    return img


# --------------------------------------------------------------------------- #
# app icon / splash
# --------------------------------------------------------------------------- #
def draw_glyph(size, ring=True):
    """Gold aperture + play triangle on transparent background."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = cy = size / 2
    R = size * 0.34
    if ring:
        grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        gd = ImageDraw.Draw(grad)
        for i in range(60):
            t = i / 59
            r = R + size * 0.045 * (1 - t)
            gd.ellipse([cx - r, cy - r, cx + r, cy + r],
                       outline=mix(GOLD, GOLD_SOFT, t) + (255,), width=max(2, int(size * 0.016)))
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse([cx - R - size * 0.06, cy - R - size * 0.06,
                                      cx + R + size * 0.06, cy + R + size * 0.06], fill=255)
        layer = Image.alpha_composite(layer, grad)
        d = ImageDraw.Draw(layer)

    # aperture blades
    for i in range(6):
        ang = math.radians(i * 60 - 90)
        x1 = cx + math.cos(ang) * R * 0.98
        y1 = cy + math.sin(ang) * R * 0.98
        ang2 = math.radians(i * 60 - 90 + 60)
        x2 = cx + math.cos(ang2) * R * 0.98
        y2 = cy + math.sin(ang2) * R * 0.98
        d.line([(x1, y1), (cx + math.cos(ang + math.radians(28)) * R * 0.42,
                         cy + math.sin(ang + math.radians(28)) * R * 0.42), (x2, y2)],
               fill=GOLD + (70,), width=max(1, int(size * 0.006)))

    # play triangle
    tr = R * 0.60
    pts = [
        (cx - tr * 0.46, cy - tr * 0.80),
        (cx - tr * 0.46, cy + tr * 0.80),
        (cx + tr * 0.92, cy),
    ]
    tri = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    td = ImageDraw.Draw(tri)
    td.polygon(pts, fill=(255, 255, 255, 255))
    tmask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(tmask).polygon(pts, fill=255)
    tmask = tmask.filter(ImageFilter.GaussianBlur(size * 0.004))
    gold_grad = Image.new("RGB", (size, size))
    gpx = gold_grad.load()
    for y in range(size):
        t = y / size
        row = mix(GOLD_SOFT, (214, 138, 18), t)
        for x in range(size):
            gpx[x, y] = row
    layer.paste(gold_grad, (0, 0), tmask)
    return layer


def draw_icon(size=1024):
    img = Image.new("RGB", (size, size), BRAND_BG)
    radial(img, size * 0.5, size * 0.42, size * 0.72, (58, 42, 12), 0.95)
    radial(img, size * 0.5, size * 0.42, size * 0.42, (96, 68, 14), 0.7)
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, draw_glyph(size))
    d = ImageDraw.Draw(img, "RGBA")
    # sprocket detail
    for i in range(5):
        y = size * (0.16 + i * 0.17)
        d.rounded_rectangle([size * 0.055, y, size * 0.085, y + size * 0.055], radius=int(size * 0.012),
                            fill=GOLD + (60,))
        d.rounded_rectangle([size * 0.915, y, size * 0.945, y + size * 0.055], radius=int(size * 0.012),
                            fill=GOLD + (60,))
    out = img.convert("RGB")
    out = grain(out, 5)
    return out


def draw_adaptive(size=1024):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glyph = draw_glyph(int(size * 0.62))
    layer.paste(glyph, (int(size * 0.19), int(size * 0.19)), glyph)
    return layer


def draw_splash(w=1284, h=2778):
    img = Image.new("RGB", (w, h), BRAND_BG)
    radial(img, w * 0.5, h * 0.40, w * 1.1, (44, 32, 10), 0.9)
    radial(img, w * 0.5, h * 0.40, w * 0.55, (78, 56, 12), 0.6)
    img = img.convert("RGBA")
    g = int(w * 0.42)
    glyph = draw_glyph(g)
    img.paste(glyph, ((w - g) // 2, int(h * 0.36)), glyph)
    d = ImageDraw.Draw(img, "RGBA")

    title = "GBENA GRANT"
    tf = font("PlayfairDisplay-Bold", int(w * 0.105))
    tw = spaced_width(d, title, tf, w * 0.012)
    while tw > w * 0.86:
        tf = font("PlayfairDisplay-Bold", tf.size - 4)
        tw = spaced_width(d, title, tf, w * 0.012)
    spaced_text(d, ((w - tw) / 2, int(h * 0.36) + g + int(h * 0.035)), title, tf, CREAM + (255,), w * 0.012)

    sub = "CINEMA, CURATED"
    sf = font("Outfit-Medium", int(w * 0.032))
    sw = spaced_width(d, sub, sf, w * 0.02)
    spaced_text(d, ((w - sw) / 2, int(h * 0.36) + g + int(h * 0.035) + int(w * 0.14)),
                sub, sf, GOLD + (230,), w * 0.02)

    d.rectangle([(w - w * 0.16) / 2, int(h * 0.36) + g + int(h * 0.028),
                 (w + w * 0.16) / 2, int(h * 0.36) + g + int(h * 0.028) + 3], fill=GOLD + (140,))
    return grain(img.convert("RGB"), 4)


# --------------------------------------------------------------------------- #
# emit TypeScript
# --------------------------------------------------------------------------- #
def ts_str(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def emit_ts(movies, genres):
    os.makedirs(os.path.join(ROOT, "lib", "data"), exist_ok=True)

    rows = []
    for m in movies:
        rows.append(
            "  {\n"
            f"    id: {ts_str(m['id'])},\n"
            f"    title: {ts_str(m['title'])},\n"
            f"    year: {m['year']},\n"
            f"    runtime: {m['runtime']},\n"
            f"    rating: {m['rating']},\n"
            f"    votes: {ts_str(m['votes'])},\n"
            f"    genres: [{', '.join(ts_str(g) for g in m['genres'])}],\n"
            f"    director: {ts_str(m['director'])},\n"
            f"    cast: [{', '.join(ts_str(c) for c in m['cast'])}],\n"
            f"    tagline: {ts_str(m['tagline'])},\n"
            f"    synopsis: {ts_str(m['synopsis'])},\n"
            f"    featured: {str(m['featured']).lower()},\n"
            f"    badge: {ts_str(m['badge'])},\n"
            "  },")

    catalog = (
        "// AUTO-GENERATED by scripts/make_art.py - edit the script, not this file.\n"
        "export interface Movie {\n"
        "  id: string;\n  title: string;\n  year: number;\n  runtime: number;\n"
        "  rating: number;\n  votes: string;\n  genres: string[];\n  director: string;\n"
        "  cast: string[];\n  tagline: string;\n  synopsis: string;\n"
        "  featured: boolean;\n  badge: string;\n}\n\n"
        "export const MOVIES: Movie[] = [\n" + "\n".join(rows) + "\n];\n\n"
        f"export const GENRES: string[] = [{', '.join(ts_str(g) for g in genres)}];\n"
    )
    with open(os.path.join(ROOT, "lib", "data", "catalog.ts"), "w") as f:
        f.write(catalog)

    poster_lines = "\n".join(
        f"  {ts_str(m['id'])}: require('../../assets/posters/{m['id']}.jpg')," for m in movies)
    backdrop_lines = "\n".join(
        f"  {ts_str(g)}: require('../../assets/backdrops/{slug(g)}.jpg')," for g in genres)
    hero_ids = [m["id"] for m in movies if m["id"] in HERO_IDS]
    hero_lines = "\n".join(
        f"  {ts_str(i)}: require('../../assets/heroes/{i}.jpg')," for i in hero_ids)
    artwork = (
        "// AUTO-GENERATED by scripts/make_art.py - edit the script, not this file.\n"
        "import type { ImageSourcePropType } from 'react-native';\n\n"
        "export const POSTERS: Record<string, ImageSourcePropType> = {\n"
        f"{poster_lines}\n}};\n\n"
        "export const BACKDROPS: Record<string, ImageSourcePropType> = {\n"
        f"{backdrop_lines}\n}};\n\n"
        "export const HEROES: Record<string, ImageSourcePropType> = {\n"
        f"{hero_lines}\n}};\n\n"
        "export const posterFor = (id: string) => POSTERS[id] ?? POSTERS['shawshank'];\n"
        "export const backdropFor = (genre: string) => BACKDROPS[genre] ?? BACKDROPS['Drama'];\n"
        "export const heroFor = (id: string, genre: string) => HEROES[id] ?? backdropFor(genre);\n"
    )
    with open(os.path.join(ROOT, "lib", "data", "artwork.ts"), "w") as f:
        f.write(artwork)


def main():
    movies = as_dicts()
    genres = sorted({g for m in movies for g in m["genres"]},
                    key=lambda g: ["Nollywood", "Action", "Adventure", "Animation", "Comedy",
                                   "Crime", "Drama", "Fantasy", "History", "Horror", "Music",
                                   "Romance", "Sci-Fi", "Thriller", "War", "Western"].index(g)
                    if g in ["Nollywood", "Action", "Adventure", "Animation", "Comedy", "Crime",
                             "Drama", "Fantasy", "History", "Horror", "Music", "Romance",
                             "Sci-Fi", "Thriller", "War", "Western"] else 99)

    os.makedirs(os.path.join(ASSETS, "posters"), exist_ok=True)
    os.makedirs(os.path.join(ASSETS, "backdrops"), exist_ok=True)

    for i, m in enumerate(movies):
        p = draw_poster(m, i)
        out = os.path.join(ASSETS, "posters", m["id"] + ".jpg")
        p.save(out, "JPEG", quality=78, optimize=True, progressive=True)
    print(f"posters: {len(movies)}")

    for i, g in enumerate(genres):
        b = draw_backdrop(g, i)
        out = os.path.join(ASSETS, "backdrops", slug(g) + ".jpg")
        b.save(out, "JPEG", quality=74, optimize=True, progressive=True)
    print(f"backdrops: {len(genres)} -> {genres}")

    os.makedirs(os.path.join(ASSETS, "heroes"), exist_ok=True)
    hero_movies = [m for m in movies if m["id"] in HERO_IDS]
    for i, m in enumerate(hero_movies):
        draw_hero(m, i).save(os.path.join(ASSETS, "heroes", m["id"] + ".jpg"),
                             "JPEG", quality=74, optimize=True, progressive=True)
    print(f"heroes: {len(hero_movies)}")

    draw_icon(1024).save(os.path.join(ASSETS, "icon.png"), "PNG", optimize=True)
    draw_adaptive(1024).save(os.path.join(ASSETS, "adaptive-icon.png"), "PNG", optimize=True)
    draw_splash(1284, 2778).save(os.path.join(ASSETS, "splash.png"), "PNG", optimize=True)
    draw_icon(1024).resize((48, 48), Image.LANCZOS).save(os.path.join(ASSETS, "favicon.png"), "PNG", optimize=True)
    draw_icon(1024).resize((512, 512), Image.LANCZOS).save(os.path.join(ASSETS, "store-icon-512.png"), "PNG", optimize=True)
    print("icon / adaptive-icon / splash / favicon / store-icon-512 written")

    emit_ts(movies, genres)
    print("lib/data/catalog.ts + lib/data/artwork.ts written")

    total = 0
    for root, _, files in os.walk(ASSETS):
        for fn in files:
            total += os.path.getsize(os.path.join(root, fn))
    print(f"assets total: {total / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
