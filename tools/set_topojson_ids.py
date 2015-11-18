"""
Sets id field on geometry objects based on properties containing id_field, and deletes other properties.
"""

import json


filename = '../static/features.json'
id_field = 'HUC_12'

data = json.loads(open(filename).read())
layer = data['objects'].keys()[0]
for geom in data['objects'][layer]['geometries']:
    geom['id'] = geom['properties'][id_field]
    del geom['properties']

with open(filename, 'w') as outfile:
    outfile.write(json.dumps(data, separators=(',', ':')))
