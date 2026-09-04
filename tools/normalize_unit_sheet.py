"""Normalize a four-pose generated unit sheet for the browser game.

The generator leaves variable transparent gutters around each pose.  This tool
detects those gutters, keeps the original pose scale, aligns every foot anchor,
and writes a compact 4 x 180 by 192 PNG sheet.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


FRAME_COUNT = 4
CELL_WIDTH = 180
CELL_HEIGHT = 192
BASELINE = 184
SCALE = 0.25
ALPHA_THRESHOLD = 200


def remove_edge_checkerboard(image: Image.Image) -> Image.Image:
    """Turn an edge-connected pale checkerboard into alpha.

    Some generators render transparency as light grey squares in an RGB image.
    Flooding only from the canvas edge protects isolated steel highlights inside
    the character while removing the connected checkerboard around it.
    """
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def pale_neutral(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return min(red, green, blue) >= 212 and max(red, green, blue) - min(red, green, blue) <= 30

    def enqueue(x: int, y: int) -> None:
        offset = y * width + x
        if not background[offset] and pale_neutral(x, y):
            background[offset] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    for y in range(height):
        for x in range(width):
            if background[y * width + x]:
                red, green, blue, _ = pixels[x, y]
                # A short feather keeps antialiased pixel edges without a pale halo.
                alpha = max(0, min(255, (224 - min(red, green, blue)) * 21))
                pixels[x, y] = (red, green, blue, alpha)
    return rgba


def transparent_runs(alpha: Image.Image) -> list[tuple[int, int]]:
    width, height = alpha.size
    px = alpha.load()
    sparse = [sum(px[x, y] > ALPHA_THRESHOLD for y in range(height)) <= 2 for x in range(width)]
    runs: list[tuple[int, int]] = []
    start = None
    for x, is_sparse in enumerate(sparse):
        if is_sparse and start is None:
            start = x
        elif not is_sparse and start is not None:
            if x - start >= 20:
                runs.append((start, x - 1))
            start = None
    if start is not None:
        runs.append((start, width - 1))
    return runs


def frame_bounds(image: Image.Image) -> list[int]:
    width, _ = image.size
    internal = [run for run in transparent_runs(image.getchannel("A")) if run[0] > 0 and run[1] < width - 1]
    if len(internal) >= FRAME_COUNT - 1:
        gaps = sorted(internal, key=lambda run: run[1] - run[0], reverse=True)[: FRAME_COUNT - 1]
        cuts = sorted((start + end) // 2 for start, end in gaps)
        return [0, *cuts, width]
    return [round(i * width / FRAME_COUNT) for i in range(FRAME_COUNT + 1)]


def component_frames(image: Image.Image) -> list[Image.Image]:
    """Extract the four largest connected figures even when adjacent cells overlap."""
    alpha = image.getchannel("A")
    width, height = alpha.size
    px = alpha.load()
    seen = bytearray(width * height)
    components: list[tuple[int, tuple[int, int, int, int], list[tuple[int, int]]]] = []

    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if seen[offset] or px[x, y] <= ALPHA_THRESHOLD:
                continue
            seen[offset] = 1
            queue: deque[tuple[int, int]] = deque([(x, y)])
            points: list[tuple[int, int]] = []
            left = right = x
            top = bottom = y
            while queue:
                cx, cy = queue.popleft()
                points.append((cx, cy))
                left, right = min(left, cx), max(right, cx)
                top, bottom = min(top, cy), max(bottom, cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height:
                        neighbor = ny * width + nx
                        if not seen[neighbor] and px[nx, ny] > ALPHA_THRESHOLD:
                            seen[neighbor] = 1
                            queue.append((nx, ny))
            components.append((len(points), (left, top, right + 1, bottom + 1), points))

    chosen = sorted(components, key=lambda item: item[0], reverse=True)[:FRAME_COUNT]
    chosen.sort(key=lambda item: item[1][0])
    if len(chosen) != FRAME_COUNT:
        raise ValueError("could not identify four connected sprite figures")

    frames: list[Image.Image] = []
    for _, bbox, points in chosen:
        left, top, right, bottom = bbox
        padding = 8
        crop_box = (max(0, left - padding), max(0, top - padding), min(width, right + padding), min(height, bottom + padding))
        mask = Image.new("L", (crop_box[2] - crop_box[0], crop_box[3] - crop_box[1]), 0)
        mask_px = mask.load()
        for px_x, px_y in points:
            mask_px[px_x - crop_box[0], px_y - crop_box[1]] = 255
        # Include antialiased edge pixels surrounding the opaque connected core.
        mask = mask.filter(ImageFilter.MaxFilter(9))
        frame = image.crop(crop_box)
        frame.putalpha(ImageChops.multiply(frame.getchannel("A"), mask))
        frames.append(frame)
    return frames


def normalize(
    source: Path,
    destination: Path,
    ranges: list[tuple[int, int]] | None = None,
    remove_checker: bool = False,
    cell_width: int = CELL_WIDTH,
    cell_height: int = CELL_HEIGHT,
    baseline: int = BASELINE,
    scale: float = SCALE,
    use_components: bool = False,
    erode_alpha: int = 0,
) -> None:
    image = Image.open(source).convert("RGBA")
    if remove_checker:
        image = remove_edge_checkerboard(image)
    if erode_alpha:
        kernel = erode_alpha * 2 + 1
        alpha = image.getchannel("A").filter(ImageFilter.MinFilter(kernel))
        # Pixel-art sprites look cleaner with a hard alpha edge after matte removal.
        image.putalpha(alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0))
    if use_components:
        frames = component_frames(image)
    else:
        if ranges is None:
            bounds = frame_bounds(image)
            ranges = [(bounds[index], bounds[index + 1]) for index in range(FRAME_COUNT)]
        if len(ranges) != FRAME_COUNT:
            raise ValueError("exactly four frame ranges are required")
        frames = [image.crop((start, 0, end, image.height)) for start, end in ranges]
    sheet = Image.new("RGBA", (cell_width * FRAME_COUNT, cell_height), (0, 0, 0, 0))

    for index, frame in enumerate(frames):
        mask = frame.getchannel("A").point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
        bbox = mask.getbbox()
        if bbox is None:
            raise ValueError(f"frame {index + 1} has no visible pixels")

        resized = frame.resize(
            (max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
            Image.Resampling.NEAREST,
        )
        visible_left = round(bbox[0] * scale)
        visible_right = round(bbox[2] * scale)
        visible_bottom = round(bbox[3] * scale)
        visible_center = (visible_left + visible_right) // 2
        x = index * cell_width + cell_width // 2 - visible_center
        y = baseline - visible_bottom
        sheet.alpha_composite(resized, (x, y))

    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument(
        "--ranges",
        help="optional comma-separated source x ranges, for example 0:500,480:1050,1030:1600,1580:2100",
    )
    parser.add_argument(
        "--remove-checker",
        action="store_true",
        help="remove a pale edge-connected checkerboard rendered into an RGB source",
    )
    parser.add_argument("--cell-width", type=int, default=CELL_WIDTH)
    parser.add_argument("--cell-height", type=int, default=CELL_HEIGHT)
    parser.add_argument("--baseline", type=int, default=BASELINE)
    parser.add_argument("--scale", type=float, default=SCALE)
    parser.add_argument(
        "--components",
        action="store_true",
        help="extract the four largest connected figures instead of splitting by x ranges",
    )
    parser.add_argument(
        "--erode-alpha",
        type=int,
        default=0,
        metavar="PX",
        help="remove PX source pixels from a contaminated matte edge before packing",
    )
    args = parser.parse_args()
    ranges = None
    if args.ranges:
        ranges = [tuple(map(int, part.split(":"))) for part in args.ranges.split(",")]
    normalize(
        args.source,
        args.destination,
        ranges,
        args.remove_checker,
        args.cell_width,
        args.cell_height,
        args.baseline,
        args.scale,
        args.components,
        args.erode_alpha,
    )


if __name__ == "__main__":
    main()
