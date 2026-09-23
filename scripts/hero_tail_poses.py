"""Build compatible polygon poses from the original tail, without runtime geometry work."""
import math
import re
from functools import lru_cache


def smooth_line(points):
    line = []
    for i in range(len(points) - 1):
        a, b, c, d = points[max(0, i-1)], points[i], points[i+1], points[min(len(points)-1, i+2)]
        for step in range(16):
            t = step / 16
            line.append(tuple(0.5*((2*b[k])+(-a[k]+c[k])*t+
                (2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+
                (-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t) for k in (0, 1)))
    line.append(points[-1])
    lengths = [0]
    for a, b in zip(line, line[1:]):
        lengths.append(lengths[-1]+math.dist(a, b))
    return line, lengths


SOURCE = smooth_line([(137,148),(154,117),(167,90),(167,62),(153,38),
    (126,24),(100,25),(76,40),(53,54),(32,72)])
TARGET = smooth_line([(137,148),(154,117),(179,99),(207,101),
    (230,119),(245,145),(258,168),(278,177)])
# Keep the same centreline length so the wag does not shorten the tail.
ratio = SOURCE[1][-1] / TARGET[1][-1]
TARGET = smooth_line([(137+(x-137)*ratio,148+(y-148)*ratio)
    for x,y in [(137,148),(154,117),(179,99),(207,101),(230,119),(245,145),(258,168),(278,177)]])


def project(point):
    line, lengths = SOURCE
    best = None
    for i, (a, b) in enumerate(zip(line, line[1:])):
        dx, dy = b[0]-a[0], b[1]-a[1]
        size = dx*dx+dy*dy
        t = max(0, min(1, ((point[0]-a[0])*dx+(point[1]-a[1])*dy)/size))
        p = (a[0]+dx*t,a[1]+dy*t)
        distance = math.dist(point,p)
        if best is None or distance < best[0]:
            best = (distance,(lengths[i]+math.sqrt(size)*t)/lengths[-1],p,math.atan2(dy,dx))
    return best[1:]


def sample(line, lengths, u):
    distance=u*lengths[-1]
    i = next((i for i in range(len(lengths)-1) if lengths[i+1]>=distance),len(lengths)-2)
    a,b = line[i],line[i+1]
    t = (distance-lengths[i])/(lengths[i+1]-lengths[i])
    return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),math.atan2(b[1]-a[1],b[0]-a[0])


@lru_cache(maxsize=16)
def bent_line(amount):
    line,lengths=SOURCE
    output=[line[0]]
    previous_turn=0
    for i,(a,b) in enumerate(zip(line,line[1:])):
        u=(lengths[i]+lengths[i+1])/2/lengths[-1]
        angle=math.atan2(b[1]-a[1],b[0]-a[0])
        _,target_angle=sample(*TARGET,u)
        turn=(target_angle-angle+math.pi)%(2*math.pi)-math.pi
        # Unwrap along the rope: crossing 180 degrees must not flip one section.
        while turn-previous_turn > math.pi:
            turn-=2*math.pi
        while turn-previous_turn < -math.pi:
            turn+=2*math.pi
        previous_turn=turn
        blend=min(1,max(0,(u-0.08)/0.14))
        angle+=turn*amount*blend*blend*(3-2*blend)
        size=lengths[i+1]-lengths[i]
        output.append((output[-1][0]+math.cos(angle)*size,output[-1][1]+math.sin(angle)*size))
    return output,lengths


def deform(point, amount):
    if amount == 0:
        return point
    u,source,angle=project(point)
    target,target_angle=sample(*bent_line(amount),u)
    turn=target_angle-angle
    dx,dy = point[0]-source[0],point[1]-source[1]
    warped = (target[0]+dx*math.cos(turn)-dy*math.sin(turn),
        target[1]+dx*math.sin(turn)+dy*math.cos(turn))
    return warped


def polygon(d):
    tokens = re.findall(r'[MLHVZmlhvz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',d)
    result=[]
    i=0
    x=y=0
    command=None
    while i<len(tokens):
        if tokens[i].isalpha():
            command=tokens[i]
            i+=1
        if command=='Z':
            result.append(('Z',None))
            command=None
        elif command in ('M','L'):
            x,y=float(tokens[i]),float(tokens[i+1])
            i+=2
            result.append((command,(x,y)))
            command='L'
        elif command=='H':
            x=float(tokens[i]); i+=1
            result.append(('L',(x,y)))
        elif command=='V':
            y=float(tokens[i]); i+=1
            result.append(('L',(x,y)))
        else:
            raise ValueError(f'Unsupported tail path command: {command}')
    return result


def poses(d, tx, ty, scale, horizontal_squeeze=1):
    points=polygon(d)
    variants={}
    # Equally spaced time samples of one smooth half-cycle. CSS mirrors these
    # samples on the return, without restarting easing at each intermediate pose.
    for step in range(13):
        name = f'pose-{step}'
        amount = (1 - math.cos(math.pi * step / 12)) / 2
        commands=[]
        for command,p in points:
            if p is None:
                commands.append(command)
                continue
            local=((p[0]-tx)/scale,(p[1]-ty)/scale)
            x,y=deform(local,amount)
            if amount != 0 and x > 170:
                # Fade viewport protection in with the deformation, so rest is
                # continuous with the first moving pose rather than snapping.
                squeeze = 1 + (horizontal_squeeze - 1) * amount
                x=170+(x-170)*squeeze
            commands.append(f'{command}{tx+x*scale:.3f} {ty+y*scale:.3f}')
        variants[name]=' '.join(commands)
    return variants
