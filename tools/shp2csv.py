import csv
import glob
import os
import fiona


indir = r'D:\Projects\PFLCC\Data\PFLCCDataViewerDatasets'
indir = r'D:\Projects\PFLCC\Data\SHCA Species List By HUC 12'

outdir = r'D:\Projects\PFLCC\Data\tables'

for shp in glob.glob(os.path.join(indir, '*.shp')):
    print shp
    with open(os.path.join(outdir, os.path.split(shp.replace('.shp', '.csv'))[1]), 'wb') as outfile:
        writer = csv.writer(outfile)
        with fiona.open(shp) as src:
            fields = [f for f in src.meta['schema']['properties']]
            writer.writerow(fields)
            for i, feature in enumerate(src):
                props = feature['properties']
                try:
                    writer.writerow([unicode(props[f]).encode('ascii', 'ignore') for f in fields])
                except UnicodeEncodeError as ex:
                    print 'Failed to convert record {0}'.format(i)
                    print ex.message
                    print [props[f] for f in fields]
                    print '---------------'


