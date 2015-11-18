import os
import csv
import fiona


working_dir = r'D:\Projects\PFLCC\Data\PFLCCDataViewerDatasets'

# file root: field name
metrics = {
    'clip': 'CLIPOverallPrioritiesByHUC12:CLIPp_P1P2',
    'bio': 'CLIPBiodiversityPrioritesByHUC12:BioDp_P1P2',
    'land': 'CLIPLanScpPrioritiesByHUC12:Lanp_P1P2',
    'priority': 'PFLCCPRByHUC12:ALL_PR_pH',
    'water': 'CLIPSrfWatPrioritiesByHUC12:SWp_P1P2'
}

id_field = 'HUC_12'

results = dict()

for metric in metrics:
    print('Processing {0}'.format(metric))
    filename, field = metrics[metric].split(':')
    with fiona.open(os.path.join(working_dir, '{0}.shp'.format(filename))) as src:
        for f in src:
            props = f['properties']
            id = props[id_field]

            if not id in results:
                results[id] = dict()

            value = int(round(props[field], 0))
            results[id][metric] = value


with open('../static/summary.csv', 'wb') as outfile:
    writer = csv.writer(outfile)

    fields = metrics.keys()
    writer.writerow(['id'] + fields)

    ids = results.keys()
    ids.sort()

    for id in ids:
        result = results[id]
        writer.writerow([id] + [result[field] for field in fields])
