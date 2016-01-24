import os
import pandas as pd
import numpy
import pprint


QUINTILES = [0.2, 0.4, 0.6, 0.8, 1.0]
QUARTILES = [0.25, 0.5, 0.75, 1.0]

working_dir = r'D:\Projects\PFLCC\Data\tables'

# [file root, field name]
metrics = {
    # Priorities
    'clip': ['CLIPOverallPrioritiesByHUC12', 'CLIPp_P1P2'],
    'bio': ['CLIPBiodiversityPrioritesByHUC12', 'BioDp_P1P2'],
    'land': ['CLIPLanScpPrioritiesByHUC12', 'Lanp_P1P2'],
    'priority': ['PFLCCPRByHUC12', 'ALL_PR_pH'],
    'water': ['CLIPSrfWatPrioritiesByHUC12', 'SWp_P1P2'],

    # Threats
    # Sea level rise 1m ... 3m
    'slr1': ['SLRProjections', '1M_H'],
    'slr2': ['SLRProjections', '2M_H'],
    'slr3': ['SLRProjections', '3M_H'],

    # Development
    'devCur': ['Florida2060', 'ExUrban_H'],
    'dev2020': ['Florida2060', '2020_H_Cum'],
    'dev2040': ['Florida2060', '2040_H_Cum'],
    'dev2060': ['Florida2060', '2060_H_Cum'],
}
fields = metrics.keys()


binsObj = {}
quantiles = {}
for metric in metrics:
    src_df = pd.read_csv(os.path.join(working_dir, metrics[metric][0] + '.csv'), dtype={'HUC_12': str}).set_index('HUC_12')
    series = src_df[metrics[metric][1]]

    if 'dev' in metric or 'slr' in metric:
        # Calculate percent
        series = (100.0 * series) / src_df['HECTARES']

    if metric == 'land' or 'slr' in metric:
        # have to force 0 into its own class
        bins = [0] + series[series > 0].quantile(QUARTILES).tolist()

    else:
        bins = series.quantile(QUINTILES)

    bins = numpy.ceil(bins).astype('uint8').tolist()

    quantiles[metric] = pd.Series(numpy.digitize(series, bins, right=True), index=series.index)
    if (quantiles[metric].max() > 4): print metric
    binsObj[metric] = bins

df = pd.DataFrame(quantiles)


# Pull fields out as hectares

# File name: fields
area_files = {
    'ConsolidatedCLCByHUC12': ['LU_1000_H', 'LU_2000_H', 'LU_3000_H', 'LU_6000_H', 'LU_7000_H', 'LU_8000_H', 'LU_8500_H', 'LU_9000_H'],
    'SHCA_Species_List': ['AIBM_H_1', 'ASMS_PH_H', 'CHBM_PH_H', 'GBAT_PH_H', 'GSHP_PH_H', 'KDEER_PH_H', 'LKMR_PH_H', 'PANT_PH_H', 'SABM_PH_H', 'SAVOL_PH_H', 'SIRAT_PH_H', 'BCFS_PH_H', 'BEAR_PH_H', 'CROC_PH_H', 'LOUSP_PH_H', 'MACSP_PH_H', 'NEWT_PH_H', 'PLOVR_PH_H', 'SCRJY_PH_H', 'SESAL_PH_H', 'SNKIT_PH_H', 'SSKNK_PH_H', 'STHA_PH_H', 'SRRAT_PH_H', 'FLOMO_PH_H', 'GSMS_PH_H', 'OWL_PH_H', 'PBTF_PH_H', 'SCTSP_PH_H', 'STKI_PH_H', 'WCPI_PH_H', 'COHA_PH_H', 'MACU_PH_H', 'SEBM_PH_H']
}

for filename, fields in area_files.items():
    src_df = pd.read_csv(os.path.join(working_dir, filename + '.csv'), dtype={'HUC_12': str}).set_index('HUC_12')[fields]

    if filename == 'ConsolidatedCLCByHUC12':
        src_df.columns = [x.replace('LU_', 'lu')[:-4] if 'LU_' in x else x for x in src_df.columns]
    elif filename == 'SHCA_Species_List':
        pass
        src_df.columns = [x.replace('_1', '').replace('_H', '').replace('_PH', '') for x in src_df.columns]

    df = df.join(src_df.round(0))  # hectares


df.to_csv('../static/summary.csv', index_label='id', float_format='%.0f')  # force writing as integers

print('Bins:')
pprint.pprint(binsObj, indent=4)