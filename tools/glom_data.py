import glob
import json
import os
import pandas as pd


working_dir = r'D:\Projects\PFLCC\Data\tables'
outdir = '../features'

# field_map = dict()
# for filename in glob.glob(os.path.join(working_dir, '*.csv')):
#     df = pd.read_csv(filename)
#     fields = list(df.columns)
#     for field in (
#         u'FLHUA_ID', u'HUC_8', u'HUC_10', u'ACRES', u'STATES',
#         u'HU_10_NAME', u'HU_10_MOD', u'HU_10_TYPE', u'HU_12_NAME',
#         u'HU_12_TYPE', u'Shape_Leng', u'Shape_Area'):
#         if field in fields:
#             fields.remove(field)
#
#     field_map[os.path.split(filename)[1].replace('.csv', '')] = fields



files = [
    'HUC_12_Names',
    'PFLCCPRbyHUC12_rev',
    'CLIPOverallPrioritiesByHUC12',
    'CLIPBiodiversityPrioritesByHUC12',
    'CLIPLanScpPrioritiesByHUC12',
    'CLIPSrfWatPrioritiesByHUC12',
    'FHAB_L1',
    'SHCA_L1',
    'SHCA_L2_P1',
    'SHCA_L2_P2',
    'SHCA_L2_P3',
    'SHCA_L2_P4',

    'PHRICH_L1',
    'PHRICH_L2',

    'NATCOM_L1',
    'NATCOM_L2_P1',
    'NATCOM_L2_P2',
    'NATCOM_L2_P3',
    'NATCOM_L2_P4',

    # Landscapes
    'GRNWAY_L1',
    'LSINT_L1',

    # Surface Water
    'SURWAT_L1',
    'NATFLDPLN_L1',
    'WTLND_L1',
    'RCHRG_L1',

    'ConsolidatedCLCByHUC12',
    # 'LandManagementByHUC12', # obviated by below
    'ManagedAreas_FNAI_HUC12',

    'Florida2060',
    'SLRProjections',

    'PartnerOrgPrioritiesByHUC12',
    'BobwhiteQByHUC12',
    'FL_counties_by_HUC12'
]

dfs = dict()

for filename in files:
    dfs[filename] = pd.read_csv(os.path.join(working_dir, filename + '.csv'), dtype={'HUC_12': str}).set_index('HUC_12')

primary_df = dfs['CLIPOverallPrioritiesByHUC12']

for huc in primary_df.index: #[0:500]:
    # print('Processing {}'.format(huc))
    record = primary_df.loc[huc]
    data = {
        'hectares': int(round(record['ACRES'].item() * 0.404686)),
        'name': dfs['HUC_12_Names'].loc[huc]['Name']
    }

    # PFLCC priorities
    record = dfs['PFLCCPRbyHUC12_rev'].loc[huc]
    fields = ['HPS_H', 'HFU_H', 'PFDP_H', 'CU_H', 'FA_H', 'E_H', 'M_H', 'FFW_H', 'FNFW_H', 'WL1_H', 'WL2_H', 'C_H']
    values = [int(round(record[f], 0)) for f in fields]
    data['pflcc_pr'] = dict([x for x in zip([f.replace('_H', '') for f in fields], values) if x[1] > 0])

    # CLIP priorities
    record = dfs['CLIPOverallPrioritiesByHUC12'].loc[huc]
    fields = [u'CLIP_P1', u'CLIP_P2', u'CLIP_P3', u'CLIP_P4', 'CLIP_P5', 'CLIP_0']  # in m2
    data['clip'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Biodiversity
    record = dfs['CLIPBiodiversityPrioritesByHUC12'].loc[huc]
    fields = ['BioD_P1', 'BioD_P2', 'BioD_P3', 'BioD_P4', 'BioD_P5', 'BioD_0']  # in m2
    data['bio'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Biodiversity - rare species
    record = dfs['FHAB_L1'].loc[huc]
    fields = ['FHAB_P1', 'FHAB_P2','FHAB_P3', 'FHAB_P4', 'FHAB_0']  # in m2
    data['bio_rare_spp'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Biodiversity - SHCA
    record = dfs['SHCA_L1'].loc[huc]
    fields = ['SHCA_P1', 'SHCA_P2', 'SHCA_P3', 'SHCA_P4', 'SHCA_0']  # in m2
    data['bio_shca'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Biodiversity - SHCA Level 2 (TODO: only write out nonempty fields)
    shca_level2 = {}
    record = dfs['SHCA_L2_P1'].loc[huc]
    fields = ['ASMS_PH_H', 'CHBM_PH_H', 'GBAT_PH_H', 'GSHP_PH_H', 'KDEER_PH_H', 'LKMR_PH_H', 'PANT_PH_H', 'SABM_PH_H', 'SAVOL_PH_H', 'SIRAT_PH_H', 'SEBM_H']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        shca_level2['1'] = dict([x for x in zip([f.replace('_PH_H', '').replace('_H', '') for f in fields], values) if x[1] > 0])

    record = dfs['SHCA_L2_P2'].loc[huc]
    fields = ['BCFS_PH_H', 'BEAR_PH_H', 'CROC_PH_H', 'LOUSP_PH_H', 'MACSP_PH_H', 'NEWT_PH_H', 'PLOVR_PH_H', 'SCRJY_PH_H', 'SESAL_PH_H', 'SNKIT_PH_H', 'SSKNK_PH_H', 'STHA_PH_H', 'SRRAT_PH_H']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        shca_level2['2'] = dict([x for x in zip([f.replace('_PH_H', '') for f in fields], values) if x[1] > 0])

    record = dfs['SHCA_L2_P3'].loc[huc]
    fields = ['FLOMO_PH_H', 'GSMS_PH_H', 'OWL_PH_H', 'PBTF_PH_H', 'SCTSP_PH_H', 'STKI_PH_H', 'WCPI_PH_H']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        shca_level2['3'] = dict([x for x in zip([f.replace('_PH_H', '') for f in fields], values) if x[1] > 0])

    record = dfs['SHCA_L2_P4'].loc[huc]
    fields = ['COHA_PH_H', 'MACU_PH_H']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        shca_level2['4'] = dict([x for x in zip([f.replace('_PH_H', '') for f in fields], values) if x[1] > 0])

    data['bio_shca2'] = shca_level2


    # Biodiversity - PNC
    record = dfs['NATCOM_L1'].loc[huc]
    fields = ['NC_P1', 'NC_P2', 'NC_P3', 'NC_P4', 'NC_0']  # in m2
    data['bio_pnc'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Biodiversity - Priority Natural Communities Level 2 (TODO: only write out nonempty fields)
    pnc_level2 = {}
    record = dfs['NATCOM_L2_P1'].loc[huc]
    fields = ['UGvh_h', 'PRvh_h', 'PRh_h', 'SSFvh_h', 'SSFh_h', 'RHvh_h', 'RHh_h', 'DPvh_h', 'DPh_h', 'SSvh_h', 'SSh_h', 'ICLvh_h', 'ICLh_h', 'FCUvh_h', 'FCUh_h', 'Svh_h', 'Sh_h', 'SULvh_h', 'SULh_h', 'UPvh_h', 'Uph_h']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        pnc_level2['1'] = dict([x for x in zip([f.replace('_h', '') for f in fields], values) if x[1] > 0])

    record = dfs['NATCOM_L2_P2'].loc[huc]
    fields = ['SSFm_h', 'RHm_h', 'DPm_h', 'ICLm_h', 'FCUm_h', 'Sm_h', 'SULm_h', 'Upm_h', 'PFvh_h', 'PFh_h']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        pnc_level2['2'] = dict([x for x in zip([f.replace('_h', '') for f in fields], values) if x[1] > 0])

    record = dfs['NATCOM_L2_P3'].loc[huc]
    fields = ['PFm_h', 'Uhvh_h', 'Uhh_h', 'CWvh_h', 'CWh_h']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        pnc_level2['3'] = dict([x for x in zip([f.replace('_h', '') for f in fields], values) if x[1] > 0])

    record = dfs['NATCOM_L2_P4'].loc[huc]
    fields = ['Uhm_h', 'CWm_h']
    values = [int(round(record[f], 0)) for f in fields]
    if sum(values):
        pnc_level2['4'] = dict([x for x in zip([f.replace('_h', '') for f in fields], values) if x[1] > 0])

    data['bio_pnc2'] = pnc_level2


    # Biodiversity - Spp Richness
    record = dfs['PHRICH_L1'].loc[huc]
    fields = ['PHRICH_P1', 'PHRICH_P2', 'PHRICH_P3', 'PHRICH_P4', 'PHRICH_P5', 'PHRICH_0']  # in m2
    data['bio_spp_rich'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Biodiversity - Spp Richness Level 2
    record = dfs['PHRICH_L2'].loc[huc]
    fields = ['AMKE_PH_H', 'ASMS_PH_H', 'BCFS_PH_H', 'BEAR_PH_H', 'BE_PH_H', 'BGFRG_PH_H', 'BWVI_PH_H', 'CHBM_PH_H', 'CKMS_PH_H', 'COHA_PH_H', 'CRCA_PH_H', 'CROC_PH_H', 'DUCK_PH_H', 'FATSL_PH_H', 'FKMS_PH_H', 'FLOMO_PH_H', 'FSC_PH_H', 'GBAT_PH_H', 'GSHP_PH_H', 'GSMS_PH_H', 'GTORT_PH_H', 'KDEER_PH_H', 'KTURT_PH_H', 'LIMK_PH_H', 'LKMR_PH_H', 'LOUSP_PH_H', 'LOWA_PH_H', 'MACSP_PH_H', 'MACU_PH_H', 'NEWT_PH_H', 'OWL_PH_H', 'PABU_PH_H', 'PANT_PH_H', 'PBTF_PH_H', 'PLOVR_PH_H', 'RCCSN_PH_H', 'RCW_PH_H', 'SABM_PH_H', 'SAVOL_PH_H', 'SCRJY_PH_H', 'SCTSP_PH_H', 'SEBAT_PH_H', 'SEBM_PH_H', 'SESAL_PH_H', 'SHFS_PH_H', 'SIRAT_PH_H', 'SKMR_PH_H', 'SNKIT_PH_H', 'SRRAT_PH_H', 'SSKNK_PH_H', 'STHA_PH_H', 'STKI_PH_H', 'WADE_PH_H', 'WCPI_PH_H']
    values = [int(round(record[f], 0)) for f in fields]
    data['bio_spp_rich2'] = dict([x for x in zip([f.replace('_PH_H', '') for f in fields], values) if x[1] > 0])


    # Landscapes
    record = dfs['CLIPLanScpPrioritiesByHUC12'].loc[huc]
    fields = ['Lan_P1', 'Lan_P2', 'Lan_P3', 'Lan_P4', 'Lan_P5', 'Lan_0']  # in m2
    data['land'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Landscapes - Greenways
    record = dfs['GRNWAY_L1'].loc[huc]
    fields = ['GRNWAY_P1', 'GRNWAY_P3', 'GRNWAY_P4', 'GRNWAY_0']  # in m2
    data['land_greenways'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Landscape integrity
    record = dfs['LSINT_L1'].loc[huc]
    fields = ['LSINT_P2', 'LSINT_P3', 'LSINT_P4', 'LSINT_P5', 'LSINT_0']  # in m2
    data['land_integrity'] = [int(round(record[f] / 10000.0, 0)) for f in fields]


    # Surface water
    record = dfs['CLIPSrfWatPrioritiesByHUC12'].loc[huc]
    fields = ['SW_P1', 'SW_P2', 'SW_P3', 'SW_P4', 'SW_P5', 'SW_0']  # in m2
    data['water'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Significant surface waters
    record = dfs['SURWAT_L1'].loc[huc]
    fields = ['SWTR_P1', 'SWTR_P2', 'SWTR_P3', 'SWTR_P4', 'SWTR_P5', 'SWTR_0']  # in m2
    data['water_significant'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Natural floodplain
    record = dfs['NATFLDPLN_L1'].loc[huc]
    fields = ['FLPL_P1', 'FLPL_P2', 'FLPL_P3', 'FLPL_P4', 'FLPL_P5', 'FLPL_0']  # in m2
    data['water_floodplain'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Wetland
    record = dfs['WTLND_L1'].loc[huc]
    fields = ['WTLD_P1', 'WTLD_P2', 'WTLD_P3', 'WTLD_P4', 'WTLD_P5', 'WTLD_0']  # in m2
    data['water_wetland'] = [int(round(record[f] / 10000.0, 0)) for f in fields]

    # Aquifer / recharge
    record = dfs['RCHRG_L1'].loc[huc]
    fields = ['RCH_P1', 'RCH_P2', 'RCH_P3', 'RCH_P4', 'RCH_P5', 'RCH_P6', 'RCH_0']  # in m2
    data['water_aquifer'] = [int(round(record[f] / 10000.0, 0)) for f in fields]


    # Land Use
    record = dfs['ConsolidatedCLCByHUC12'].loc[huc]
    fields = ['LU_1000_H', 'LU_2000_H', 'LU_3000_H', 'LU_6000_H', 'LU_7000_H', 'LU_8000_H', 'LU_8500_H', 'LU_9000_H']
    values = [int(round(record[f], 0)) for f in fields]
    data['land_use'] = dict([x for x in zip([f.replace('_H', '').replace('LU_', '')[:2] for f in fields], values) if x[1] > 0])


    # Threats - Sea level rise
    record = dfs['SLRProjections'].loc[huc]
    fields = ['1M_H', '2M_H', '3M_H']
    data['slr'] = [int(round(record[f], 0)) for f in fields]

    # Threats - Development
    record = dfs['Florida2060'].loc[huc]
    fields = ['ExUrban_H', '2020_H_Cum', '2040_H_Cum', '2060_H_Cum']
    data['dev'] = [int(round(record[f], 0)) for f in fields]


    # Detailed ownership - may be multiple records per HUC.  Nest according to type:managing institution:property name:hectares
    # data issues - this doesn't get classified same as ownership data above
    table = dfs['ManagedAreas_FNAI_HUC12']
    if huc in table.index:
        records = table.loc[huc]
        ownership = {}
        if len(records.shape) > 1:
            for i in range(records.shape[0]):
                record = records.ix[i]
                owner_type = record['MATYPE2']
                prop_name = record['MANAME']
                hectares = int(round(record['ActAREA_H']))
                if hectares:
                    if not owner_type in ownership:
                        ownership[owner_type] = {}
                    ownership[owner_type][prop_name] = hectares

        else:
            record = records
            hectares = int(round(record['ActAREA_H']))
            if hectares:
                ownership = {
                    record['MATYPE2']: {
                        record['MANAME']: hectares
                    }
                }

        if ownership:
            data['ownership_detailed'] = ownership



    # Partner organizations - just list those present
    record = dfs['PartnerOrgPrioritiesByHUC12'].loc[huc]
    fields = ['ACJV_Any', 'EPAPriShd', 'GCConVisF', 'SALCC_Fin', 'TNC_A_Fin', 'TNC_R_Fin', 'LLP_ConP_F']
    data['partners'] = [x.lower().replace('_any', '').replace('_fin', '').rstrip('f').strip('_') for x in fields if record[x] == 1]

    # Add Bobwhite data to above
    record = dfs['BobwhiteQByHUC12'].loc[huc]
    if record['NCBI_P_F']:
        data['partners'].append(['ncbi'])


    # For land trusts - extract FIPS code and county name (possibly multiple per HUC)
    table = dfs['FL_counties_by_HUC12']
    if huc in table.index:
        records = table.loc[huc]
        counties = {}
        if len(records.shape) > 1:
            for i in range(records.shape[0]):
                record = records.ix[i]
                counties['{0}{1:03d}'.format(record['STATEFP'], int(record['COUNTYFP']))] = record['NAMELSAD']
        else:
            record = records
            counties['{0}{1:03d}'.format(record['STATEFP'], int(record['COUNTYFP']))] = record['NAMELSAD']

        if counties:
            data['counties'] = counties


    with open(os.path.join(outdir, '{0}.json'.format(huc)), 'w') as outfile:
        outfile.write(json.dumps(data))  # , indent=2


