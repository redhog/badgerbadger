def make_color(v):
    distances = [min(abs(0.0 - v), abs(1.0 - v)),
                 abs(1.0/3.0 - v),
                 abs(2.0/3.0 - v)]
    fractions = [3.0 * max(1.0/3.0 - distance, 0.0)
                 for distance in distances]
    rgb = [119 + fraction * 136.0
           for fraction in fractions]
    rgbhex = "#" + "".join(hex(int(val))[2:]
                           for val in rgb)
    print rgbhex

def make_colors(sets):
    offset = 0
    diff = 1.0/6.0
    for setnr in xrange(sets):
        for v in range(3):
            make_color(offset + v / 3.0)
        offset += diff
        diff /= 2.0

make_colors(8)
