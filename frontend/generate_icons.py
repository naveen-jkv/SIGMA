"""
Generate PWA PNG icons using PIL
"""
import math
import os
from PIL import Image, ImageDraw

def create_pwa_icon(size, is_maskable=False):
    # Create image with RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rect
    corner_radius = size // 10 if is_maskable else size // 5
    padding = size // 16 if is_maskable else 0
    bg_box = [padding, padding, size - padding, size - padding]

    # Draw dark background
    draw.rounded_rectangle(bg_box, radius=corner_radius, fill=(11, 19, 41, 255), outline=(34, 211, 238, 70), width=max(1, size // 100))

    # Center coordinates
    cx = size / 2
    cy = size * 0.58

    # Droplet dimensions
    r = size * 0.28 if not is_maskable else size * 0.24
    top_y = size * 0.18 if not is_maskable else size * 0.22

    # Draw smooth teardrop path
    points = []
    # Tip of droplet
    points.append((cx, top_y))
    # Tangent curves to bottom circle
    angle_start = math.radians(35)
    angle_end = math.radians(145)

    num_steps = 60
    for i in range(num_steps + 1):
        a = angle_start + (angle_end - angle_start) * (i / num_steps)
        x = cx + r * math.cos(a)
        y = cy + r * math.sin(a)
        points.append((x, y))

    points.append((cx, top_y))

    # Draw droplet base
    draw.polygon(points, fill=(6, 182, 212, 255))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(6, 182, 212, 255))

    # Highlight overlay
    draw.ellipse([cx - r * 0.75, cy - r * 0.75, cx + r * 0.75, cy + r * 0.75], fill=(13, 148, 136, 120))

    # Draw white pulse line across droplet
    lw = max(2, int(size * 0.024))
    pulse_y = cy + r * 0.1
    p1 = (cx - r * 0.7, pulse_y)
    p2 = (cx - r * 0.3, pulse_y)
    p3 = (cx - r * 0.15, pulse_y - r * 0.45)
    p4 = (cx + r * 0.05, pulse_y + r * 0.45)
    p5 = (cx + r * 0.2, pulse_y - r * 0.15)
    p6 = (cx + r * 0.35, pulse_y)
    p7 = (cx + r * 0.7, pulse_y)

    for seg_start, seg_end in zip([p1, p2, p3, p4, p5, p6], [p2, p3, p4, p5, p6, p7]):
        draw.line([seg_start, seg_end], fill=(255, 255, 255, 255), width=lw)

    # Small AI node dot
    dot_r = max(2, int(size * 0.022))
    draw.ellipse([cx - dot_r, cy - r * 0.4 - dot_r, cx + dot_r, cy - r * 0.4 + dot_r], fill=(255, 255, 255, 255))

    return img

out_dir = r"c:\Users\navee\SIGMA\frontend\public"
os.makedirs(out_dir, exist_ok=True)

img_512 = create_pwa_icon(512, is_maskable=False)
img_512.save(os.path.join(out_dir, "icon-512.png"), "PNG")

img_192 = create_pwa_icon(192, is_maskable=False)
img_192.save(os.path.join(out_dir, "icon-192.png"), "PNG")

img_maskable = create_pwa_icon(512, is_maskable=True)
img_maskable.save(os.path.join(out_dir, "icon-maskable-512.png"), "PNG")

print("Generated icon-192.png, icon-512.png, icon-maskable-512.png successfully.")
