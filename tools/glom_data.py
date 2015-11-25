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


# df = pd.read_csv(.., dtype={'HUC_12': str}).set_index('HUC_12')
# df.loc['030901011504']


files = [
    'PFLCCPRByHUC12',
    'CLIPOverallPrioritiesByHUC12',
    'CLIPBiodiversityPrioritesByHUC12',
    'CLIPLanScpPrioritiesByHUC12',
    'CLIPSrfWatPrioritiesByHUC12',
    'LandOwnershipByHUC12',
    'FHAB_L1',
    'SHCA_L1',
    'NATCOM_L1',
    'PHRICH_L1',
    'PHRICH_L2'
]

dfs = dict()

for filename in files:
    dfs[filename] = pd.read_csv(os.path.join(working_dir, filename + '.csv'), dtype={'HUC_12': str}).set_index('HUC_12')

primary_df = dfs[dfs.keys()[0]]

for huc in primary_df.index: #[0:500]:
    # print('Processing {}'.format(huc))
    record = primary_df.loc[huc]
    data = {
        'acres': record['ACRES']
    }

    # PFLCC priorities
    # record = dfs['PFLCCPRByHUC12'].loc[huc]
    # fields = [u'CLIPp_P1', u'CLIPp_P2', u'CLIPp_P3', u'CLIPp_P4', 'CLIPp_P5']
    # data['priority'] = [round(record[f], 1) for f in fields]

    # CLIP priorities
    record = dfs['CLIPOverallPrioritiesByHUC12'].loc[huc]
    fields = [u'CLIPp_P1', u'CLIPp_P2', u'CLIPp_P3', u'CLIPp_P4', 'CLIPp_P5', 'CLIPp_0']
    data['clip'] = [round(record[f], 1) for f in fields]

    # Biodiversity
    record = dfs['CLIPBiodiversityPrioritesByHUC12'].loc[huc]
    fields = ['BioDp_P1', 'BioDp_P2', 'BioDp_P3', 'BioDp_P4', 'BioDp_P5', 'BioDp_0']
    data['bio'] = [round(record[f], 1) for f in fields]

    # Biodiversity - rare species
    record = dfs['FHAB_L1'].loc[huc]
    fields = ['FHABp_P1', 'FHABp_P2','FHABp_P3', 'FHABp_P4', 'FHABp_0']
    data['bio_rare_spp'] = [round(record[f], 1) for f in fields]

    # Biodiversity - SHCA
    record = dfs['SHCA_L1'].loc[huc]
    fields = ['SHCAp_P1', 'SHCAp_P2', 'SHCAp_P3', 'SHCAp_P4', 'SHCAp_0']
    data['bio_shca'] = [round(record[f], 1) for f in fields]

    # Biodiversity - PNC
    record = dfs['NATCOM_L1'].loc[huc]
    fields = ['NCp_P1', 'NCp_P2', 'NCp_P3', 'NCp_P4', 'NCp_0']
    data['bio_pnc'] = [round(record[f], 1) for f in fields]

    # Biodiversity - Spp Richness
    record = dfs['PHRICH_L1'].loc[huc]
    fields = ['PHRICHp_P1', 'PHRICHp_P2', 'PHRICHp_P3', 'PHRICHp_P4', 'PHRICHp__1', 'PHRICHp_0']
    data['bio_spp_rich'] = [round(record[f], 1) for f in fields]

    # Biodiversity - Spp Richness Level 2
    record = dfs['PHRICH_L2'].loc[huc]
    fields = ['AMKE_PH_H', 'ASMS_PH_H', 'BCFS_PH_H', 'BEAR_PH_H', 'BE_PH_H', 'BGFRG_PH_H', 'BWVI_PH_H', 'CHBM_PH_H', 'CKMS_PH_H', 'COHA_PH_H', 'CRCA_PH_H', 'CROC_PH_H', 'DUCK_PH_H', 'FATSL_PH_H', 'FKMS_PH_H', 'FLOMO_PH_H', 'FSC_PH_H', 'GBAT_PH_H', 'GSHP_PH_H', 'GSMS_PH_H', 'GTORT_PH_H', 'KDEER_PH_H', 'KTURT_PH_H', 'LIMK_PH_H', 'LKMR_PH_H', 'LOUSP_PH_H', 'LOWA_PH_H', 'MACSP_PH_H', 'MACU_PH_H', 'NEWT_PH_H', 'OWL_PH_H', 'PABU_PH_H', 'PANT_PH_H', 'PBTF_PH_H', 'PLOVR_PH_H', 'RCCSN_PH_H', 'RCW_PH_H', 'SABM_PH_H', 'SAVOL_PH_H', 'SCRJY_PH_H', 'SCTSP_PH_H', 'SEBAT_PH_H', 'SEBM_PH_H', 'SESAL_PH_H', 'SHFS_PH_H', 'SIRAT_PH_H', 'SKMR_PH_H', 'SNKIT_PH_H', 'SRRAT_PH_H', 'SSKNK_PH_H', 'STHA_PH_H', 'STKI_PH_H', 'WADE_PH_H', 'WCPI_PH_H']
    values = [int(round(record[f], 0)) for f in fields]
    data['bio_spp_rich2'] = dict([x for x in zip([f.replace('_PH_H', '') for f in fields], values) if x[1] > 0])



    # Landscapes
    record = dfs['CLIPLanScpPrioritiesByHUC12'].loc[huc]
    fields = ['Lanp_P1', 'Lanp_P2', 'Lanp_P3', 'Lanp_P4', 'Lanp_P5', 'Lanp_0']
    data['land'] = [round(record[f], 1) for f in fields]

    # Surface water
    record = dfs['CLIPSrfWatPrioritiesByHUC12'].loc[huc]
    fields = ['SWp_P1', 'SWp_P2', 'SWp_P3', 'SWp_P4', 'SWp_P5', 'SWp_0']
    data['water'] = [round(record[f], 1) for f in fields]

    # Overall ownership
    record = dfs['LandOwnershipByHUC12'].loc[huc]
    fields = ['Federal_p', 'State_p', 'Local_p', 'Private_p']
    data['ownership'] = [round(record[f], 1) for f in fields]





    # record = dfs[''].loc[huc]
    # fields = []
    # data[''] = [round(record[f], 1) for f in fields]


    with open(os.path.join(outdir, '{0}.json'.format(huc)), 'w') as outfile:
        outfile.write(json.dumps(data, indent=2))
















field_map = {
    # 'SHCA_L2_P3': ['HUC_12', 'VALUE_1', 'FLOMO_H', 'VALUE_12', 'VALUE_1_13', 'GSMS_H', 'OWL_H', 'VALUE_1_14',
    #                'PBTFROG_H', 'VALUE_1_15', 'SCOTTSP_H', 'VALUE_1_16', 'STKITE_H', 'VALUE_1_17', 'WCPIG_H',
    #                'HECTARES', 'FLOMO_PH_H', 'GSMS_PH_H', 'OWL_PH_H', 'PBTF_PH_H', 'SCTSP_PH_H', 'STKI_PH_H',
    #                'WCPI_PH_H'],
    # 'SHCA_L2_P2': ['HUC_12', 'VALUE_1', 'BCFS_H', 'VALUE_12', 'BEAR_H', 'VALUE_1_13', 'CROC_H', 'VALUE_1_14',
    #                'LOUSSP_H', 'VALUE_1_15', 'MACSP_H', 'VALUE_1_16', 'NEWT_H', 'VALUE_1_17', 'PLOVER_H',
    #                'VALUE_1_18', 'SCRUBJAY_H', 'VALUE_1_19', 'SEALSALM_H', 'VALUE_1_20', 'SNKITE_H',
    #                'VALUE_1_21', 'SRRAT_H', 'VALUE_1_22', 'SSKINK_H', 'VALUE_1_23', 'STHA_H', 'HECTARES',
    #                'BCFS_PH_H', 'BEAR_PH_H', 'CROC_PH_H', 'LOUSP_PH_H', 'MACSP_PH_H', 'NEWT_PH_H',
    #                'PLOVR_PH_H', 'SCRJY_PH_H', 'SESAL_PH_H', 'SNKIT_PH_H', 'SSKNK_PH_H', 'STHA_PH_H',
    #                'SRRAT_PH_H'],
    # 'SHCA_L2_P1': ['HUC_12', 'AIBM_M', 'AIBM_H', 'VALUE_1', 'ASMS_H', 'VALUE_12', 'CHBM_H', 'VALUE_1_13',
    #                'GRAYBAT_H', 'VALUE_1_14', 'GRHPSP_H', 'VALUE_1_15', 'KDEER_H', 'VALUE_1_16', 'LKMR_H',
    #                'VALUE_1_17', 'PANTHER_H', 'VALUE_1_18', 'SABM_H', 'VALUE_1_19', 'SALTVOLE_H', 'VALUE_1_20',
    #                'SIRRAT_H', 'VALUE_1_21', 'SEBM_H', 'HECTARES', 'AIBM_H_1', 'ASMS_PH_H', 'CHBM_PH_H',
    #                'GBAT_PH_H', 'GSHP_PH_H', 'KDEER_PH_H', 'LKMR_PH_H', 'PANT_PH_H', 'SABM_PH_H', 'SAVOL_PH_H',
    #                'SIRAT_PH_H', 'SRRAT_PH_H'],
    # 'WTLND_L1': ['HUC_12', 'HECTARES', 'WTLD_0', 'WTLD_P1', 'WTLD_P2', 'WTLD_P3', 'WTLD_P4', 'WTLD_P5',
    #              'WTLDh_0', 'WTLDh_P1', 'WTLDh_P2', 'WTLDh_P3', 'WTLDh_P4', 'WTLDh_P5', 'WTLDTArea', 'WTLDp_0',
    #              'WTLDp_P1', 'WTLDp_P2', 'WTLDp_P3', 'WTLDp_P4', 'WTLDp_P5'],
    'DetailedLandOwnershipByHUC12': ['Join_Count', 'TARGET_FID', 'JOIN_FID', 'HUC_12', 'ActAREA_M',
                                     'ActAREA_H', 'ActAREA_KM', 'FEDERAL', 'STATE', 'LOCAL', 'PRIVATE',
                                     'Federal_H', 'State_H', 'Local_H', 'Private_H', 'NonManag_H', 'Federal_p',
                                     'State_p', 'Local_p', 'Private_p', 'TotManag_p', 'MA_ID', 'MANAME',
                                     'MAJORMA', 'MATYPE', 'MANAGING_A', 'MATYPE2', 'OWNER', 'COOWNERS',
                                     'TOTACRES', 'COUNTY', 'MGRINST', 'OWNERTYPES', 'OwnerCType',
                                     'OwnerClasT'],
    # 'SHCA_L2_P4': ['HUC_12', 'VALUE_1', 'COHA_H', 'VALUE_12', 'MACU_H', 'HECTARES', 'COHA_PH_H', 'MACU_PH_H'],
    'ManagedAreas_FNAI': ['AREA', 'PERIMETER', 'MA_ID', 'MACODE_BCD', 'MANAME', 'MAJORMA', 'MATYPE',
                          'MANAGING_A', 'MATYPE2', 'OWNER', 'COOWNERS', 'TOTACRES', 'LTF_ACRES', 'COUNTY',
                          'PROTSTAT', 'MANAGER', 'MGRINST', 'MGRCITY', 'MGRPHONE', 'DESC1', 'DESC2',
                          'COMMENTS1', 'COMMENTS2', 'DIG_COM', 'MANAME_AB', 'MA_WEBSITE', 'OWNERTYPES',
                          'ESMT_HOLD'],
    'SHCA_L1': ['HUC_12', 'HECTARES', 'SHCA_0', 'SHCA_P1', 'SHCA_P2', 'SHCA_P3', 'SHCA_P4', 'SHCAh_0',
                'SHCAh_P1', 'SHCAh_P2', 'SHCAh_P3', 'SHCAh_P4', 'SHCATArea', 'SHCAp_0', 'SHCAp_P1', 'SHCAp_P2',
                'SHCAp_P3', 'SHCAp_P4'],
    'GCConVisByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'GCConVisI', 'GCConVisC',
                        'GCConVisF'],
    'LandTrustListByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'LandTrusts', 'LandTrust1',
                             'LandTrust2', 'LandTrust3', 'LandTrust4'],
    'LLPByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'LPE_1_ECD', 'LPE_2_ECU', 'LPEA_3_ECU',
                   'LPEU_4_ECU', 'NOLPE_5', 'LP_1_C_H', 'LP_2_C_H', 'LP_3_A_H', 'LP_4_U_H', 'NoLP_5_H',
                   'Conf_LLP_H', 'Prob_LLP_H', 'Conf_LLP_p', 'Prob_LLP_p', 'LPE_BUT_CO', 'LOW_PRIORI',
                   'MEDIUM_PRI', 'HIGH_PRIOR', 'LLP_LP', 'LLP_MP', 'LLP_HP', 'LLP_LP_H', 'LLP_MP_H',
                   'LLP_HP_H', 'LLP_LP_p', 'LLP_MP_p', 'LLP_HP_p', 'LLP_P_p', 'LLP_Fin'],
    'PFLCCScenario1Corr': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'FSCon_M', 'ConEas_M', 'RurDev_M',
                           'SUrbDev_M', 'UrbDev_M', 'SLR_M', 'FSCon_H', 'ConEas_H', 'RurDev_H', 'SUrbDev_H',
                           'UrbDev_H', 'SLR_H', 'NoScen_H', 'FSCon_P', 'ConEas_P', 'RurDev_P', 'SLR_P',
                           'NoScen_P', 'SUrbDev_P', 'UrbDev_P'],
    'LSINT_L1': ['HUC_12', 'HECTARES', 'LSINT_0', 'LSINT_P2', 'LSINT_P3', 'LSINT_P4', 'LSINT_P5', 'LSINTh_0',
                 'LSINTh_P2', 'LSINTh_P3', 'LSINTh_P4', 'LSINTh_P5', 'LSINTTArea', 'LSINTp_0', 'LSINTp_P2',
                 'LSINTp_P3', 'LSINTp_P4', 'LSINTp_P5'],
    'InvasiveSpecies': ['Join_Count', 'TARGET_FID', 'HUC_12', 'HECTARES', 'SQ_KM', 'EDDMapS_Fr', 'INVPLA_Fre',
                        'iMapInvFre', 'AvgFreq', 'MajFreq', 'INVPLA_Div', 'AqC1PlSpCt', 'AqAniCmCt',
                        'iMapInvDiv', 'AvgDiv', 'MajDiv', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM'],
    'HUC12FloridaClip': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM'],
    'CLCByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'VALUE_1200', 'HiPineScru', 'VALUE_1100',
                   'HaForeUpla', 'VALUE_1300', 'PiFlaDrPra', 'VALUE_1600', 'CoasUpla', 'VALUE_3000',
                   'FrewatAqu', 'VALUE_5000', 'Estaur', 'VALUE_6000', 'Marine', 'VALUE_2200', 'FreForWet',
                   'VALUE_2100', 'FreNForWet', 'VALUE_1831', 'WorkL1', 'VALUE_1833', 'WorkL2', 'VALUE_1821',
                   'Cultu', 'HPS_H', 'HFU_H', 'PFDP_H', 'CU_H', 'FA_H', 'E_H', 'M_H', 'FFW_H', 'FNFW_H',
                   'WL1_H', 'WL2_H', 'C_H', 'ALL_PR_H', 'ALL_WL1_H', 'ALL_NWL_H'],
    'FLTerrPort_200909': ['SITENAME', 'SITEACRES', 'CAID', 'CATNCID', 'FLAG', 'ERID', 'SHAPE_STAr',
                          'SHAPE_STLe'],
    'GRNWAY_L1': ['HUC_12', 'HECTARES', 'GRNWAY_0', 'GRNWAY_P1', 'GRNWAY_P3', 'GRNWAY_P4', 'GRNWAYh_0',
                  'GRNWAYh_P1', 'GRNWAYh_P3', 'GRNWAYh_P4', 'GRNWAYTAre', 'GRNWAYp_0', 'GRNWAYp_P1',
                  'GRNWAYp_P3', 'GRNWAYp_P4'], 'SouthwestFloridaWMD': ['NAME', 'AREA'],
    'CLIPSrfWatPrioritiesByHUC12': ['HUC_12', 'SW_0', 'SW_P5', 'SW_P4', 'SW_P3', 'SW_P2', 'SW_P1', 'SWTAr',
                                    'SWp_0', 'SWp_P5', 'SWp_P4', 'SWp_P3', 'SWp_P2', 'SWp_P1', 'SWp_P1P2',
                                    'SW_P1P2', 'HECTARES'],
    'ACJVByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'ACJV_LBird', 'ACJV_PBird', 'ACJV_SBird',
                    'ACJV_WBird', 'ACJV_WFowl', 'ACJV_Rich', 'ACJV_Any'],
    'NATFLDPLN_L1': ['HUC_12', 'HECTARES', 'FLPL_0', 'FLPL_P1', 'FLPL_P2', 'FLPL_P3', 'FLPL_P4', 'FLPL_P5',
                     'FLPLh_0', 'FLPLh_P1', 'FLPLh_P2', 'FLPLh_P3', 'FLPLh_P4', 'FLPLh_P5', 'FLPLTArea',
                     'FLPLp_0', 'FLPLp_P1', 'FLPLp_P2', 'FLPLp_P3', 'FLPLp_P4', 'FLPLp_P5'],
    'PHRICH_L2': ['HUC_12', 'HECTARES', 'VALUE_1', 'AIBM_H', 'VALUE_12', 'AMKE_PH_H', 'VALUE_1_13',
                  'ASMS_PH_H', 'VALUE_1_14', 'BCFS_PH_H', 'VALUE_1_15', 'BE_PH_H', 'VALUE_1_16', 'BEAR_PH_H',
                  'VALUE_1_17', 'BGFRG_PH_H', 'VALUE_1_18', 'BWVI_PH_H', 'VALUE_1_19', 'CHBM_PH_H',
                  'VALUE_1_20', 'CKMS_PH_H', 'VALUE_1_21', 'COHA_PH_H', 'VALUE_1_22', 'CRCA_PH_H',
                  'VALUE_1_23', 'CROC_PH_H', 'VALUE_1_24', 'DUCK_PH_H', 'VALUE_1_25', 'FKMS_PH_H',
                  'VALUE_1_26', 'FATSL_PH_H', 'VALUE_1_27', 'FLOMO_PH_H', 'VALUE_1_28', 'FSC_PH_H',
                  'VALUE_1_29', 'GBAT_PH_H', 'VALUE_1_30', 'GSHP_PH_H', 'VALUE_1_31', 'GSMS_PH_H',
                  'VALUE_1_32', 'GTORT_PH_H', 'VALUE_1_33', 'KDEER_PH_H', 'VALUE_1_34', 'KTURT_PH_H',
                  'VALUE_1_35', 'LIMK_PH_H', 'VALUE_1_36', 'LKMR_PH_H', 'VALUE_1_37', 'LOUSP_PH_H',
                  'VALUE_1_38', 'LOWA_PH_H', 'VALUE_1_39', 'MACSP_PH_H', 'VALUE_1_40', 'MACU_PH_H',
                  'VALUE_1_41', 'NEWT_PH_H', 'VALUE_1_42', 'OWL_PH_H', 'VALUE_1_43', 'PABU_PH_H', 'VALUE_1_44',
                  'PANT_PH_H', 'VALUE_1_45', 'PBTF_PH_H', 'VALUE_1_46', 'PLOVR_PH_H', 'VALUE_1_47', 'RCW_PH_H',
                  'VALUE_1_48', 'RCCSN_PH_H', 'VALUE_1_49', 'SABM_PH_H', 'VALUE_1_50', 'SAVOL_PH_H',
                  'VALUE_1_51', 'SCTSP_PH_H', 'VALUE_1_52', 'SCRJY_PH_H', 'VALUE_1_53', 'SESAL_PH_H',
                  'VALUE_1_54', 'SEBAT_PH_H', 'VALUE_1_55', 'SEBM_PH_H', 'VALUE_1_56', 'SHFS_PH_H',
                  'VALUE_1_57', 'SIRAT_PH_H', 'VALUE_1_58', 'SKMR_PH_H', 'VALUE_1_59', 'SNKIT_PH_H',
                  'VALUE_1_60', 'SSKNK_PH_H', 'VALUE_1_61', 'STHA_PH_H', 'VALUE_1_62', 'STKI_PH_H',
                  'VALUE_1_63', 'WADE_PH_H', 'VALUE_1_64', 'WCPI_PH_H', 'VALUE_1_65', 'SRRAT_PH_H',
                  'PH_RICH_Fi'],
    'amendment1bycounties': ['GIST_ID', 'FIPSSTCO', 'STATE', 'COUNTY', 'LSADC', 'FIPSCC', 'ENTITY',
                             'SHAPE_AREA', 'SHAPE_LEN', 'SHAPE_FID', 'Area', 'Acres', 'Hectares', 'CountyID',
                             'CountyName', 'VotesYes', 'VotesNo', 'PercentYes'],
    'SLRProjections': ['HUC_12', 'HECTARES', 'VALUE_1', 'VALUE_2', 'VALUE_3', 'VALUE_4', 'VALUE_5', 'VALUE_6',
                       'VALUE_0', '1M_H', '2M_H', '3M_H', '4M_H', '5M_H', '6M_H', 'AreaH', '1M_H_Cum',
                       '2M_H_Cum', '3M_H_Cum', '4M_H_Cum', '5M_H_Cum', '6M_H_Cum', 'AreaH_NSLR', 'ActAREA_M',
                       'ActAREA_H', 'ActAREA_KM'],
    'NATCOM_L1': ['HUC_12', 'HECTARES', 'NC_0', 'NC_P1', 'NC_P2', 'NC_P3', 'NC_P4', 'NCh_0', 'NCh_P1',
                  'NCh_P2', 'NCh_P3', 'NCh_P4', 'NChTArea', 'NCp_0', 'NCp_P1', 'NCp_P2', 'NCp_P3', 'NCp_P4'],
    'PHRICH_L1': ['HUC_12', 'HECTARES', 'PHRICH_0', 'PHRICH_P1', 'PHRICH_P2', 'PHRICH_P3', 'PHRICH_P4',
                  'PHRICH_P5', 'PHRICHh_0', 'PHRICHh_P1', 'PHRICHh_P2', 'PHRICHh_P3', 'PHRICHh_P4',
                  'PHRICHh_P5', 'PHRICHTAre', 'PHRICHp_0', 'PHRICHp_P1', 'PHRICHp_P2', 'PHRICHp_P3',
                  'PHRICHp_P4', 'PHRICHp__1'],
    'StormFrequency': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'ECONAME', 'HFreq_Mean', 'HFreq_Maj',
                       'HFreq_Med', 'TSFreq_Mea', 'TSFreq_Maj', 'TSFreq_Med'],
    'SALCC_Blueprint_2_HUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'ECONAME', 'LOWER_50__',
                                'MEDIUM_PRI', 'CORRIDORS', 'HIGH_PRIOR', 'HIGHEST_PR', 'P1_H', 'P2_H',
                                'CORR_H', 'P3_H', 'NP_H', 'P1P2_H', 'P1P2CORR_H', 'P1_pH', 'P2_pH', 'CORR_pH',
                                'P3_pH', 'NP_pH', 'P1P2_pH', 'P1P2COR_pH', 'SALCC_Fin'],
    'PartnerOrgPrioritiesByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'ACJV_Any', 'EPAPriShd',
                                    'GCConVisF', 'SALCC_Fin', 'TNC_A_Fin', 'TNC_R_Fin', 'LLP_ConP_F',
                                    'ParPriRich'],
    'NCResiliencyScoresZonal': ['HUC_12', 'MIN', 'MAX', 'RANGE', 'MEAN', 'STD', 'SUM', 'VARIETY', 'MAJORITY',
                                'MINORITY', 'MEDIAN', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM'],
    'CLIPBiodiversityPrioritesByHUC12': ['HUC_12', 'BioD_0', 'BioD_P5', 'BioD_P4', 'BioD_P3', 'BioD_P2',
                                         'BioD_P1', 'BioDTAr', 'BioDp_0', 'BioDp_P5', 'BioDp_P4', 'BioDp_P3',
                                         'BioDp_P2', 'BioDp_P1', 'BioDp_P1P2', 'BioD_P1P2', 'HECTARES'],
    'TNCAreasByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'TNC_A_Cntr', 'TNC_A_Any',
                        'TNA_A_Fin'],
    'USDAandStatePrimeFarmland': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'PrimeFarm', 'LocImpFarm',
                                  'UniImpFarm', 'PFarmD', 'PFarmDandP', 'ExiImpFarm', 'PFarm_H', 'LIFarm_H',
                                  'PDFarm_H', 'PDPFarm_H', 'ExiPFarm_H', 'UIFarm_H', 'PFarm_P', 'LIFarm_P',
                                  'UIFarm_P', 'ExiPFarm_P'],
    'FHAB_L1': ['HUC_12', 'HECTARES', 'FHAB_0', 'FHAB_P1', 'FHAB_P2', 'FHAB_P3', 'FHAB_P4', 'FHABh_0',
                'FHABh_P1', 'FHABh_P2', 'FHABh_P3', 'FHABh_P4', 'FHABTArea', 'FHABp_0', 'FHABp_P1', 'FHABp_P2',
                'FHABp_P3', 'FHABp_P4'],
    'CLIPLanScpPrioritiesByHUC12': ['HUC_12', 'Lan_0', 'Lan_P5', 'Lan_P4', 'Lan_P3', 'Lan_P2', 'Lan_P1',
                                    'LanTAr', 'Lanp_0', 'Lanp_P5', 'Lanp_P4', 'Lanp_P3', 'Lanp_P2', 'Lanp_P1',
                                    'Lanp_P1P2', 'Lan_P1P2', 'HECTARES'],
    'CLIPOverallPrioritiesByHUC12': ['HUC_12', 'CLIP_0', 'CLIP_P5', 'CLIP_P4', 'CLIP_P3', 'CLIP_P2', 'CLIP_P1',
                                     'CLIPTAr', 'CLIPp_0', 'CLIPp_P5', 'CLIPp_P4', 'CLIPp_P3', 'CLIPp_P2',
                                     'CLIPp_P1', 'CLIPp_P1P2', 'CLIP_P1P2', 'HECTARES'],
    'PFLCCPRByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'VALUE_1200', 'HiPineScru',
                       'VALUE_1100', 'HaForeUpla', 'VALUE_1300', 'PiFlaDrPra', 'VALUE_1600', 'CoasUpla',
                       'VALUE_3000', 'FrewatAqu', 'VALUE_5000', 'Estaur', 'VALUE_6000', 'Marine', 'VALUE_2200',
                       'FreForWet', 'VALUE_2100', 'FreNForWet', 'VALUE_1831', 'WorkL1', 'VALUE_1833', 'WorkL2',
                       'VALUE_1821', 'Cultu', 'HPS_H', 'HFU_H', 'PFDP_H', 'CU_H', 'FA_H', 'E_H', 'M_H',
                       'FFW_H', 'FNFW_H', 'WL1_H', 'WL2_H', 'C_H', 'ALL_PR_H', 'ALL_WL1_H', 'ALL_NWL_H',
                       'HPS_pH', 'HFU_pH', 'PFDP_pH', 'CU_pH', 'FA_pH', 'E_pH', 'M_pH', 'FFW_pH', 'FNFW_pH',
                       'WL1_pH', 'WL2_pH', 'C_pH', 'ALL_PR_pH', 'ALL_WL1_pH', 'ALL_NWL_pH', 'PR_RICH'],
    'BobwhiteQByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'HIGH', 'MEDIUM', 'LOW', 'NONE',
                         'NBCI_H_H', 'NBCI_M_H', 'NBCI_L_H', 'NBCI_N_H', 'NBCI_P_H', 'NBCI_H_p', 'NBCI_M_p',
                         'NBCI_L_p', 'NBCI_N_p', 'NBCI_P_p', 'NCBI_P_Fin', 'NCBI_P_F'],
    'SURWAT_L1': ['HUC_12', 'HECTARES', 'SWTR_0', 'SWTR_P1', 'SWTR_P2', 'SWTR_P3', 'SWTR_P4', 'SWTR_P5',
                  'SWTRh_0', 'SWTRh_P1', 'SWTRh_P2', 'SWTRh_P3', 'SWTRh_P4', 'SWTRh_P5', 'SWTRTAr', 'SWTRp_0',
                  'SWTRp_P1', 'SWTRp_P2', 'SWTRp_P3', 'SWTRp_P4', 'SWTRp_P5'],
    'ForestResources': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'Timber_M', 'Timber_H', 'Timber_P'],
    'LandOwnershipByHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'FEDERAL', 'STATE', 'LOCAL',
                             'PRIVATE', 'Federal_H', 'State_H', 'Local_H', 'Private_H', 'NonManag_H',
                             'Federal_p', 'State_p', 'Local_p', 'Private_p', 'TotManag_p'],
    'NATCOM_L2_P4': ['HUC_12', 'HECTARES', 'VALUE_0', 'UHm', 'CWm', 'Uhm_h', 'CWm_h'],
    'EPAPriorityWatershedsHUC12': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'EPAPriShd'],
    'RCHRG_L1': ['HUC_12', 'HECTARES', 'RCH_0', 'RCH_P1', 'RCH_P2', 'RCH_P3', 'RCH_P4', 'RCH_P5', 'RCH_P6',
                 'RCHh_0', 'RCHh_P1', 'RCHh_P2', 'RCHh_P3', 'RCHh_P4', 'RCHh_P5', 'RCHh_P6', 'RCHTArea',
                 'RCH_01', 'RCH_P11', 'RCH_P21', 'RCH_P31', 'RCH_P41', 'RCH_P51', 'RCH_P61'],
    'NATCOM_L2_P1': ['HUC_12', 'HECTARES', 'VALUE_0', 'UGvh', 'PRvh', 'PRh', 'SSFvh', 'SSFh', 'RHvh', 'RHh',
                     'DPvh', 'DPh', 'SSvh', 'SSh', 'ICLvh', 'ICLh', 'FCUvh', 'FCUh', 'Svh', 'Sh', 'SULvh',
                     'SULh', 'UPvh', 'UPh', 'UGvh_h', 'PRvh_h', 'PRh_h', 'SSFvh_h', 'SSFh_h', 'RHvh_h',
                     'RHh_h', 'DPvh_h', 'DPh_h', 'SSvh_h', 'SSh_h', 'ICLvh_h', 'ICLh_h', 'FCUvh_h', 'FCUh_h',
                     'Svh_h', 'Sh_h', 'SULvh_h', 'SULh_h', 'UPvh_h', 'Uph_h'],
    'NATCOM_L2_P2': ['HUC_12', 'HECTARES', 'VALUE_0', 'SSFm', 'RHm', 'DPm', 'ICLm', 'FCUm', 'Sm', 'SULm',
                     'UPm', 'PFvh', 'PFh', 'SSFm_h', 'RHm_h', 'DPm_h', 'ICLm_h', 'FCUm_h', 'Sm_h', 'SULm_h',
                     'Upm_h', 'PFvh_h', 'PFh_h'],
    'NATCOM_L2_P3': ['HUC_12', 'HECTARES', 'VALUE_0', 'PFm', 'UHvh', 'UHh', 'CWvh', 'CWh', 'PFm_h', 'Uhvh_h',
                     'Uhh_h', 'CWvh_h', 'CWh_h'],
    'NCResiliencyScores': ['HUC_12', 'VALUE_12', 'VALUE_23', 'VALUE_34', 'VALUE_45', 'VALUE_56', 'VALUE_67',
                           'VALUE_78', 'FBAvg_H', 'BAvg_H', 'SBAvg_H', 'Avg_H', 'SAAvg_H', 'AAvg_H', 'FAAvg_H',
                           'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'AnyAAvg_H', 'AnyAAvg_p', 'AnyBAvg_H',
                           'AnyBAvg_p', 'SigAAvg_H', 'SigAAvh_p', 'SigBAvg_H', 'SigBAvg_p', 'Resil_Fin'],
    'FishAndGame': ['HUC_12', 'FISH_STOCK', 'FISH_ST_SP', 'HECTARES', 'SQ_KM', 'GatorHabP', 'DuckHabP',
                    'QuailHabP', 'TrkyHabP', 'GameDiv', 'GatorHab_M', 'GatorHab_H', 'DuckHab_M', 'DuckHab_H',
                    'QuailHab_M', 'QuailHab_H', 'TrkyHab_M', 'TrkyHab_H', 'GatorHPrct', 'DuckHPrct',
                    'QuailHPrct', 'TrkyHPrct', 'AvgGamHabP', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM',
                    'FisHabCOcc', 'FisHabSMod', 'FisHabModC'],
    'Florida2060': ['HUC_12', 'HECTARES', 'VALUE_2020', 'VALUE_2040', 'VALUE_2060', '2020_H', '2040_H',
                    '2060_H', '2020_H_Cum', '2040_H_Cum', '2060_H_Cum', 'VALUE_1', 'ExUrban_H', 'ExUrb_H_C',
                    'AreaNUrb_H', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM'],
    'PFLCCScenario1': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'RuralDev_M', 'SUrbDev_M', 'UrbDev_M',
                       'RurDev_H', 'SUrbDev_H', 'UrbDev_H', 'RurDev_P', 'SUrbDev_P', 'UrbDev_P', 'NoScen_P',
                       'NoScen_H'],
    'PFLCCScenario2': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'FSCon_M', 'ConEas_M', 'RurDev_M',
                       'SUrbDev_M', 'UrbDev_M', 'SLR_M', 'FSCon_H', 'ConEas_H', 'RurDev_H', 'SUrbDev_H',
                       'UrbDev_H', 'SLR_H', 'NoScen_H', 'FSCon_P', 'ConEas_P', 'RurDev_P', 'SUrbDev_P',
                       'UrbDev_P', 'SLR_P', 'NoScen_P'],
    'PFLCCScenario3': ['HUC_12', 'ActAREA_M', 'ActAREA_H', 'ActAREA_KM', 'FSCon_M', 'ConEas_M', 'RurDev_M',
                       'SUrbDev_M', 'UrbDev_M', 'SLR_M', 'FSCon_H', 'ConEas_H', 'RurDev_H', 'SUrbDev_H',
                       'UrbDev_H', 'SLR_H', 'NoScen_H', 'FSCon_P', 'ConEas_P', 'RurDev_P', 'SUrbDev_P',
                       'UrbDev_P', 'SLR_P', 'NoScen_P']
}
