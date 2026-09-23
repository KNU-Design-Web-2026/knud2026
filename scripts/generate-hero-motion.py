"""Rebuild motion-ready SVGs from the checked-in Figma vectors (no raster editing)."""
import json
import math
import re
from copy import deepcopy
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)

# Frame origins and fuse bounds measured from the source SVG coordinate space.
SCENES = [
    (1920, 1340, -31, -255, 1506.4, 358, 190.48),
    (1350, 900, -67, -187, 987.091, 234.585, 124.819),
    (1020, 1370, -29, -210, 514.639, 379.999, 196.146),
    (600, 980, -7.94922, -144.359, 314.465, 294.827, 138.210),
    (400, 860, 0, -116, 209.522, 244, 103.407),
]

def element(tag, **attrs):
    return ET.Element(f'{{{NS}}}{tag}', {k: str(v) for k, v in attrs.items()})

scenes = []
for width, height, ox, oy, tx, ty, tw in SCENES:
    svg = ET.parse(ROOT / f'public/assets/figma/main-artwork-{width}.svg').getroot()
    svg.set('viewBox', f'{ox} {oy} {width} {height}')
    svg.set('width', str(width))
    svg.set('height', str(height))
    svg.set('class', 'hero-scene-svg')
    svg.set('focusable', 'false')
    by_id = {e.get('id'): e for e in svg.iter() if e.get('id')}
    main = by_id['Main']
    # These first two paths are the Figma editor canvas, not exhibition artwork.
    for child in list(main)[:2]:
        main.remove(child)
    by_id['Group_4'].set('class', 'hero-ignite')
    by_id['Group 366'].set('class', 'hero-lion')
    by_id['Group_27'].set('class', 'hero-spray')
    for index, name in enumerate(['Group', 'Group_2', 'Group_3']):
        by_id[name].set('class', f'hero-burst hero-burst-{index}')
    tail = by_id['Group_12']
    tail.set('class', 'hero-fuse')
    scale = tw / 190.48
    # Pivot at the covered body joint, in the SVG viewBox coordinate system.
    pivot_x, pivot_y = tx + 145*scale, ty + 134*scale
    tail.set('style', f'transform-origin:{pivot_x}px {pivot_y}px')
    tail.set('data-pivot-x', str(pivot_x))
    tail.set('data-pivot-y', str(pivot_y))
    for path in tail.iter():
        if path.tag.endswith('path'):
            path.set('class', 'hero-tail-shape')
    # Keep the source tail paths unchanged; motion is now carried by IGNITE.
    defs = next(e for e in svg if e.tag.endswith('defs'))
    # Cover only the ordinary eye; preserve the opposite firework-shaped eye.
    eye_clip = element('clipPath', id='eye-clip', clipPathUnits='userSpaceOnUse')
    eye_shape = deepcopy(by_id['Vector_55'])
    eye_shape.attrib.pop('id', None)
    eye_clip.append(deepcopy(eye_shape))
    defs.append(eye_clip)
    eye_cover = element('g', **{'clip-path':'url(#eye-clip)'})
    eyelid = element('g', **{'class':'hero-eyelid'})
    eye_shape.set('fill', '#41C9F9')
    eyelid.append(eye_shape)
    ex, ey = map(float, re.match(r'M([\d.]+) ([\d.]+)', eye_shape.get('d')).groups())
    # Source frames share this eye geometry, scaled with the lion artwork.
    eyelid.append(element('path', d=f'M {ex} {ey-14*scale} Q {ex+21*scale} {ey+2*scale} {ex+42*scale} {ey-12*scale}',
        fill='none', stroke='#0F0E0F', **{'stroke-width':4*scale,'stroke-linecap':'round'}))
    eye_cover.append(eyelid)
    by_id['Group_24'].append(eye_cover)
    # Bounds measured with SVG getBBox from the original artwork, in local coordinates.
    bounds = {
        1920: [(255,295.545,510,591.09),(564.068,836.796,218.135,211.592),(1074.59,695.127,277.18,316.254)],
        1350: [(167.092,193.66,334.185,387.32),(369.614,548.323,142.936,138.648),(704.142,455.492,181.628,207.231)],
        1020: [(142.261,164.881,284.522,329.761),(308.847,445.021,121.694,118.044),(836.191,379.88,245.754,280.395)],
        600: [(89.453,103.675,178.905,207.35),(197.869,293.545,76.521,74.225),(525.787,238.862,154.528,176.31)],
        400: [(52.751,77.364,133.501,154.727),(133.649,219.041,57.1,55.388),(378.346,178.232,115.31,131.565)],
    }
    palettes = [('#F21C1C','#41C9F9'), ('#FCD519','#FD9519'), ('#FD9519','#F21C1C','#FCD519')]
    for index, name in enumerate(['Group', 'Group_2', 'Group_3']):
        burst = by_id[name]
        parent = next(e for e in svg.iter() if burst in list(e))
        cx, cy, bw, bh = bounds[width][index]
        particles = element('g', **{'class':f'hero-burst-particles hero-burst-particles-{index}'})
        # Share the artwork's parent coordinates, but never inherit its animated scale.
        for i, degrees in enumerate([205, 268, 330, 75, 155, 25, 112]):
            angle = math.radians(degrees + index * 9)
            radius = max(bw, bh) * (0.34 if index == 0 else 0.38)
            travel = (48 + (i * 17) % 39) * scale * (0.55 if width <= 600 else 1)
            sx, sy = math.cos(angle)*radius, math.sin(angle)*radius
            ex, ey = math.cos(angle)*(radius+travel), math.sin(angle)*(radius+travel)
            anchor = element('g', transform=f'translate({cx} {cy})')
            piece = element('path', d='M -12 -7 L 13 -3 L 5 10 L -7 5 Z',
                fill=palettes[index][i % len(palettes[index])],
                **{'class':'hero-burst-particle' + (' hero-burst-particle-extra' if i >= 4 else ''),
                   'style':f'--start-x:{sx:.3f}px;--start-y:{sy:.3f}px;--end-x:{ex:.3f}px;--end-y:{ey:.3f}px;--piece-size:{max(scale, 0.65):.4f};--piece-turn:{i*47+25}deg'})
            anchor.append(piece)
            particles.append(anchor)
            # A smaller second wave follows 150ms later with offset directions.
            if i < 4:
                follow_angle = angle + math.radians(18)
                follow = deepcopy(piece)
                follow.set('class', 'hero-burst-particle hero-burst-particle-follow' +
                    (' hero-burst-particle-extra' if i >= 2 else ''))
                fx, fy = math.cos(follow_angle), math.sin(follow_angle)
                follow.set('style',
                    f'--start-x:{fx*radius:.3f}px;--start-y:{fy*radius:.3f}px;'
                    f'--end-x:{fx*(radius+travel*1.45):.3f}px;--end-y:{fy*(radius+travel*1.45):.3f}px;'
                    f'--piece-size:{max(scale, 0.65)*0.58:.4f};--piece-turn:{-i*61-35}deg')
                follow_anchor = element('g', transform=f'translate({cx} {cy})')
                follow_anchor.append(follow)
                particles.append(follow_anchor)
        # Both the artwork and its particles share a subtle idle drift.
        position = list(parent).index(burst)
        parent.remove(burst)
        drift = element('g', **{'class':f'hero-burst-drift hero-burst-drift-{index}'})
        drift.append(burst)
        drift.append(particles)
        parent.insert(position, drift)
    # Namespace every ID because all responsive scenes share one document.
    markup = ET.tostring(svg, encoding='unicode')
    ids=re.findall(r'id="([^"]+)"',markup)
    for ident in ids:
        replacement=f'hero-{width}-{ident.replace(" ", "-")}'
        markup=markup.replace(f'id="{ident}"',f'id="{replacement}"').replace(f'url(#{ident})',f'url(#{replacement})')
    scenes.append({'width':width,'height':height,'markup':markup})

target=ROOT/'src/components/main/hero-scenes.generated.ts'
target.write_text('// Generated by scripts/generate-hero-motion.py. Do not hand-edit.\nexport const heroScenes = '+json.dumps(scenes,ensure_ascii=False,indent=2)+' as const;\n')
