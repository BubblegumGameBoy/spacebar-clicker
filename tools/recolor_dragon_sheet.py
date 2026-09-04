"""Create consistent dragon color variants from the jade master sheet."""

from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from PIL import Image


TARGET_HUES = {"violet": 0.73, "crimson": 0.98}


def recolor(source: Path, destination: Path, variant: str) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = []
    target = TARGET_HUES[variant]
    for red, green, blue, alpha in image.get_flattened_data():
        if alpha == 0:
            pixels.append((red, green, blue, alpha))
            continue
        hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        if 0.18 <= hue <= 0.48 and saturation >= 0.22:
            offset = (hue - 0.33) * 0.35
            hue = (target + offset) % 1.0
            red_f, green_f, blue_f = colorsys.hsv_to_rgb(hue, saturation, value)
            red, green, blue = round(red_f * 255), round(green_f * 255), round(blue_f * 255)
        pixels.append((red, green, blue, alpha))
    image.putdata(pixels)
    image.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("variant", choices=TARGET_HUES)
    args = parser.parse_args()
    recolor(args.source, args.destination, args.variant)


if __name__ == "__main__":
    main()
