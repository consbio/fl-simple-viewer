import os
import pandas as pd
import numpy
import pprint


QUINTILES = [0.2, 0.4, 0.6, 0.8, 1.0]
QUARTILES = [0.25, 0.5, 0.75, 1.0]

working_dir = '/Volumes/data/projects/PFLCC/data/tables'

# [file root, list of field names]
metrics = {
    # Priorities
    'clip': ['Clip4OverPrioByHUC12_201612', ['CLIP_P1', 'CLIP_P2']],
    'bio': ['Clip4BiodivByHUC12_201701', ['BioD_P1', 'BioD_P2']],
    'land': ['Clip4LanScaPrioByHUC12_201612', ['Lan_P1', 'Lan_P2']],
    'priority': ['BluePrintV1_HUC12_201701', ['Conx_H', 'PFDP_H', 'WL1_H', 'WL2_H', 'FNFW_H', 'FFW_H', 'HPS_H', 'HFU_H', 'CU_H', 'FA_H', 'E_H']],
    'water': ['Clip4SrfWatByHUC12_201612', ['SW_P1', 'SW_P2']],

    # Threats
    # Sea level rise 1m ... 3m
    'slr1': ['SLRProjections', ['1M_H']],
    'slr2': ['SLRProjections', ['2M_H']],
    'slr3': ['SLRProjections', ['3M_H']],

    # Development
    'devCur': ['Florida2060', ['ExUrban_H']],
    'dev2020': ['Florida2060', ['2020_H_Cum']],
    'dev2040': ['Florida2060', ['2040_H_Cum']],
    'dev2060': ['Florida2060', ['2060_H_Cum']],
}
fields = metrics.keys()


binsObj = {}
quantiles = {}
for metric in metrics:
    src_df = pd.read_csv(os.path.join(working_dir, metrics[metric][0] + '.csv'), dtype={'HUC_12': str}).set_index('HUC_12')
    series = src_df[metrics[metric][1]].sum(axis=1)

    if metric in ('clip', 'bio', 'land', 'water'):
        series = series / 10000.0  # convert to hectares to match other metrics

    # if 'dev' in metric or 'slr' in metric:
    #     # Calculate percent
    series = (100.0 * series) / src_df['ActAREA_H']

    # print('min, max', metric, series.min(), series.max())

    if metric == 'land' or 'slr' in metric:
        # have to force 0 into its own class
        bins = [0] + series[series > 0].quantile(QUARTILES).tolist()

    else:
        bins = series.quantile(QUINTILES)

    bins = numpy.ceil(bins).astype('uint8').tolist()

    if 'dev' in metric or 'slr' in metric:
        quantiles[metric] = pd.Series(numpy.digitize(series, [1, 10, 25, 50, 100], right=True), index=series.index)

    else:
        quantiles[metric] = pd.Series(numpy.digitize(series, bins, right=True), index=series.index)

    # if quantiles[metric].max() > 4:
    #     print metric

    binsObj[metric] = bins

df = pd.DataFrame(quantiles)


# Pull fields out as hectares

# File name: fields
area_files = {
    'LandUseByHUC12_201612': ['NatUp_H', 'Wet_H', 'FrAq_H', 'Mar_H', 'RHi_H', 'RLow_H', 'TreeP_H', 'Dev_H'],
    'SHCA_Species_List': ['AIBM_H_1', 'ASMS_PH_H', 'CHBM_PH_H', 'GBAT_PH_H', 'GSHP_PH_H', 'KDEER_PH_H', 'LKMR_PH_H', 'PANT_PH_H', 'SABM_PH_H', 'SAVOL_PH_H', 'SIRAT_PH_H', 'BCFS_PH_H', 'BEAR_PH_H', 'CROC_PH_H', 'LOUSP_PH_H', 'MACSP_PH_H', 'NEWT_PH_H', 'PLOVR_PH_H', 'SCRJY_PH_H', 'SESAL_PH_H', 'SNKIT_PH_H', 'SSKNK_PH_H', 'STHA_PH_H', 'SRRAT_PH_H', 'FLOMO_PH_H', 'GSMS_PH_H', 'OWL_PH_H', 'PBTF_PH_H', 'SCTSP_PH_H', 'STKI_PH_H', 'WCPI_PH_H', 'COHA_PH_H', 'MACU_PH_H', 'SEBM_PH_H']
}


field_LUT = {
    'NatUp_H': 10,
    'Wet_H': 20,
    'FrAq_H': 30,
    'Mar_H': 60,
    'RHi_H': 70,
    'RLow_H': 80,
    'TreeP_H': 85,
    'Dev_H': 90
}

for filename, fields in area_files.items():
    src_df = pd.read_csv(os.path.join(working_dir, filename + '.csv'), dtype={'HUC_12': str}).set_index('HUC_12')[fields]

    if filename == 'LandUseByHUC12_201612':
        src_df.columns = ['lu{}'.format(field_LUT[x]) for x in src_df.columns]
    elif filename == 'SHCA_Species_List':
        pass
        # src_df.columns = [x.replace('_1', '').replace('_H', '').replace('_PH', '') for x in src_df.columns]

    df = df.join(src_df.round(0))  # hectares


df.to_csv('../static/summary.csv', index_label='id', float_format='%.0f')  # force writing as integers

print('Bins:')
pprint.pprint(binsObj, indent=4)