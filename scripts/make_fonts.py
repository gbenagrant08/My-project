"""Instantiate static font weights from the variable TTFs shipped on this machine.

Produces assets/fonts/*.ttf that the app loads through expo-font.
"""
import os
from fontTools import ttLib
from fontTools.varLib import instancer

SRC = "/usr/share/fonts/truetype/agon-slides"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts")

WANT = {
    "Outfit": [300, 400, 500, 600, 700, 800],
    "PlayfairDisplay": [500, 600, 700, 900],
    "SpaceGrotesk": [500, 700],
}

NAMES = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black"}

os.makedirs(OUT, exist_ok=True)

for family, weights in WANT.items():
    src = os.path.join(SRC, family + ".ttf")
    for w in weights:
        font = ttLib.TTFont(src)
        axes = {"wght": w}
        if "wdth" in [a.axisTag for a in font["fvar"].axes]:
            axes["wdth"] = 100
        if "opsz" in [a.axisTag for a in font["fvar"].axes]:
            ax = [a for a in font["fvar"].axes if a.axisTag == "opsz"][0]
            axes["opsz"] = ax.defaultValue
        inst = instancer.instantiateVariableFont(font, axes, updateFontNames=True)
        name = f"{family}-{NAMES[w]}"
        path = os.path.join(OUT, name + ".ttf")
        inst.save(path)
        print("wrote", path, round(os.path.getsize(path) / 1024, 1), "KB")

print("done")
