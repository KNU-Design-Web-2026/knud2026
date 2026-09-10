"""Rebuild motion-ready SVGs from the checked-in Figma vectors (no raster editing)."""
import json
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
    for index, name in enumerate(['Group', 'Group_2', 'Group_3']):
        by_id[name].set('class', f'hero-burst hero-burst-{index}')
    tail = by_id['Group_12']
    tail.set('class', 'hero-fuse')
    scale = tw / 190.48
    # Centre line follows the original curled fuse from its lit tip into the body.
    points = [(32,72),(46,42),(88,20),(127,24),(166,43),(169,76),(153,115),(137,154)]
    p = [(tx+x*scale, ty+y*scale) for x,y in points]
    d = f'M {p[0][0]} {p[0][1]} C {p[1][0]} {p[1][1]} {p[2][0]} {p[2][1]} {p[3][0]} {p[3][1]} S {p[4][0]} {p[4][1]} {p[5][0]} {p[5][1]} Q {p[6][0]} {p[6][1]} {p[7][0]} {p[7][1]}'
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
    mask = element('mask', id='fuse-mask', maskUnits='userSpaceOnUse', x=tx-100*scale, y=ty-100*scale, width=400*scale, height=400*scale)
    mask.append(element('rect', x=tx-100*scale, y=ty-100*scale, width=400*scale, height=400*scale, fill='white'))
    erase = element('path', d=d, pathLength=100, fill='none', stroke='black', **{'stroke-width':58*scale,'stroke-linecap':'butt','class':'hero-fuse-erase'})
    mask.append(erase)
    # Remove the original tip flame as the moving flame takes over.
    tip_outline = deepcopy(by_id['Vector_18'])
    tip_outline.attrib.pop('id', None)
    tip_outline.set('fill', 'black')
    # Cover the source's separately stroked contour as well as its fill, so
    # antialiasing cannot leave a ghost outline at the old flame position.
    tip_outline.set('stroke', 'black')
    tip_outline.set('stroke-width', str(4 * scale))
    tip_outline.set('stroke-linejoin', 'round')
    tip_outline.set('class', 'hero-fuse-tip-erase')
    mask.append(tip_outline)
    defs.append(mask)
    tail.set('mask', 'url(#fuse-mask)')
    spark = element('g', **{'class':'hero-fuse-spark','style':f'offset-path:path("{d}");offset-rotate:0deg;offset-anchor:0px 0px'})
    # Retain the actual red/yellow/blue Figma flame, not a generic replacement.
    # Clip the shared rope/body paths to the red tip silhouette before moving it.
    flame_clip = element('clipPath', id='flame-clip', clipPathUnits='userSpaceOnUse')
    silhouette = deepcopy(by_id['Vector_18'])
    silhouette.attrib.pop('id', None)
    flame_clip.append(silhouette)
    defs.append(flame_clip)
    shrink = element('g', **{'class':'hero-flame-size'})
    flicker = element('g', **{'class':'hero-flame-flicker'})
    local = element('g', transform=f'translate({-p[0][0]} {-p[0][1]})')
    original_flame = element('g', **{'clip-path':'url(#flame-clip)'})
    for name in ['Vector_18', 'Vector_19', 'Vector_20', 'Vector_21']:
        part = deepcopy(by_id[name])
        part.attrib.pop('id', None)
        original_flame.append(part)
    local.append(original_flame)
    flicker.append(local)
    shrink.append(flicker)
    spark.append(shrink)
    # Small hot fragments stay local to the burning front, not across the page.
    for i, (dx, dy) in enumerate([(-22,-31),(16,-36),(-30,5)]):
        ember = element('g', transform=f'scale({scale})')
        ember.append(element('path', d='M 0 0 L 3 -6 L 5 1 Z', fill=['#FCD519','#FD9519','#F21C1C'][i],
            **{'class':'hero-ember','style':f'--ember-x:{dx}px;--ember-y:{dy}px;animation-delay:{-i*.09}s'}))
        spark.append(ember)
    by_id['Group_11'].append(spark)
    # Local, short-lived flecks follow the final ignition; no canvas particles/timers.
    debris = element('g', transform=f'translate({p[-1][0]} {p[-1][1]}) scale({scale})')
    for i, (dx,dy) in enumerate([(-85,-60),(-35,-110),(45,-95),(100,-30),(70,65),(-70,60)]):
        piece=element('path', d='M -5 -4 L 7 -2 L 2 7 L -7 3 Z', fill=['#FCD519','#FD9519','#41C9F9'][i%3], **{'class':'hero-paint-fleck','style':f'--fleck-x:{dx}px;--fleck-y:{dy}px;--fleck-r:{i*53}deg'})
        debris.append(piece)
    by_id['Group 366'].append(debris)
    # Namespace every ID because all responsive scenes share one document.
    markup = ET.tostring(svg, encoding='unicode')
    ids=re.findall(r'id="([^"]+)"',markup)
    for ident in ids:
        replacement=f'hero-{width}-{ident.replace(" ", "-")}'
        markup=markup.replace(f'id="{ident}"',f'id="{replacement}"').replace(f'url(#{ident})',f'url(#{replacement})')
    scenes.append({'width':width,'height':height,'markup':markup})

target=ROOT/'src/components/main/hero-scenes.generated.ts'
target.write_text('// Generated by scripts/generate-hero-motion.py. Do not hand-edit.\nexport const heroScenes = '+json.dumps(scenes,ensure_ascii=False,indent=2)+' as const;\n')
