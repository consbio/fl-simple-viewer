/** Colors **/
// highest to lowest
var colorMap = {
    priority: ["#006837", "#31a354", "#78c679", "#c2e699", "#ffffcc"],
    dev: ["#993404", "#d95f0e", "#fe9929", "#fed98e", "#ffffd4"],
    slr: ["#253494", "#2c7fb8", "#41b6c4", "#a1dab4", "#ffffcc"],
    general: ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff", '#ffffcc'] //blue
};


// These represent the breaks between quantile classes.  q=0 where value <= bin[0]
var quantiles = {
    priority: [51, 73, 84, 93, 100],
    bio: [11, 24, 46, 73, 100],
    land: [0, 12, 49, 81, 100],
    water: [7, 18, 33, 55, 100],
    clip: [23, 45, 70, 92, 100],

    devCur: [2, 6, 14, 32, 100],
    dev2020: [2, 7, 19, 44, 100],
    dev2040: [4, 12, 30, 57, 100],
    dev2060: [6, 19, 41, 65, 100],

    slr1: [0, 3, 9, 24, 100],
    slr2: [0, 4, 14, 32, 100],
    slr3: [0, 6, 20, 46, 100]
};

var summaryFields = {
    priority: ['priority', 'clip', 'bio', 'land', 'water'],
    threats: ['slr1', 'slr2', 'slr3', 'devCur', 'dev2020', 'dev2040', 'dev2060'],
    slr: ['slr1', 'slr2', 'slr3'],
    dev: ['devCur', 'dev2020', 'dev2040', 'dev2060']
};

var selectedField = 'priority';
var selectedGroup = 'priority';

var fieldLabels = {
    'bio': 'CLIP Biodiversity',
    'clip': 'Overall CLIP',
    'land': 'CLIP Landscape',
    'priority': 'PFLCC DRAFT Priority Resources',
    'water': 'CLIP Surface Water',

    dev: 'Urban Development / Population Growth',
    devCur: 'Existing',
    dev2020: '2020',
    dev2040: '2040',
    dev2060: '2060',

    slr: 'Projected Sea Level Rise',
    slr1: '1 meter (2070 - 2090)',
    slr2: '2 meters (2100 - 2120)',
    slr3: '3 meters (2130 - 2150)'
};

var slrLevels = ['slr1', 'slr2', 'slr3'];
var devLevels = ['devCur', 'dev2020', 'dev2040', 'dev2060'];

var fieldTooltips = {
    'bio': 'This model is a combination of the four CLIP core data layers in the Biodiversity Resource Category: Strategic Habitat Conservation Areas (SHCA), Vertebrate Potential Habitat Richness (VertRich), Rare Species Habitat Conservation Priorities (FNAIHAB), and Priority Natural Communities (Natcom).  (See pg. 14-15 of the CLIP Technical Report for the rules used to assign the core data layers into the Landscape resource priority model.',
    'clip': 'The Critical Lands and Waters Identification Project (CLIP) is a collection of spatial data that identify statewide priorities for a broad range of natural resources in Florida. CLIP 3.0 is organized into a set of core natural resource data layers which are combined into resource categories, three of which (biodiversity, landscapes, surface water) have been combined into the Aggregated CLIP model, which identifies five priority levels for natural resource conservation.',
    'land': 'This model is a combination of the two core data layers in the Landscapes Resource Category: Florida Ecological Greenways Network, and Landscape Integrity Index. (See pg. 14 of the CLIP Technical Report for the rules used to assign the core data layers into the Biodiversity resource priority model.',
    'priority': 'Priority resources are the set of biological, ecological, and cultural features and ecological processes collaboratively identified as most important, and are the focus of the PFLCC’s planning.  Priority resources will provide a simple way to measure the overall condition of the Peninsular Florida’s complex systems.  There are currently 12 DRAFT Priority Resources, 9 based on land cover types from the Cooperative Land Cover map (v. 3.0): High Pine and Scrub, Pine Flatwoods and Dry Prairie, Freshwater Forested Wetlands, Hardwood Forested Uplands, Coastal Uplands, Freshwater non-forested Wetlands, Estuarine, Marine, Freshwater Aquatic; and 3 non-CLC based resource types:  Landscape Connectivity, Cultural and Socio-economic, and Working Lands.',
    'water': 'This model is a combination of the three core data layers in the Surface Water Resource Category: Significant Surface Waters, Natural Floodplain, and Wetlands.  (See pg. 15 of the CLIP Technical Report for the rules used to assign the core data layers into the Surface Water resource priority model.',
    dev: 'These development projections are derived from the Florida 2060 development dataset. This projections explores the physical reality and consequences of the population growth from 2005 to 2060 if existing land use policy or population growth patterns do not change.  The land use suitability analysis displayed in this dataset was performed by the University of Florida GeoPlan Center for 1000 Friends of Florida. The graph below reports the area affected for each of the three time steps used in this model, the existing extent of urbanization in 2005, and the area unaffected by urbanization. The hectares reported for each of the three time steps are cumulative figures.',
    slr: "These sea level rise projections were produced by the University of Florida Geoplan Center. These projections measure sea level rise in meter increments up until 3 meters. The graph below reports the area affected for each of these three scenarios (as well as the area unaffected). The hectares reported for each of these scenarios are cumulative figures.  <br/><br/>Time ranges were extrapolated from the High Bathtub Projections (for Mean Sea Level Rise) used in the University of Florida GeoPlan Center's Sea Level Rise Sketch tool"
};

var priorityLabels = ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];
var priorityLabels4 = priorityLabels.slice(0, 4).concat(priorityLabels[5]);
var priorityLabels6 = priorityLabels.slice(0, 5).concat(['Priority 6']).concat(priorityLabels[5]);


// common name|priority(4 levels, not 5)
var species = {
    AIBM: "Anastasia Island Beach Mouse|1",
    AMKE: "Southeastern American Kestrel|",
    ASMS: "Atlantic Salt Marsh Snake|1",
    ASTK: "Swallow-Tailed Kite|3",
    BCFS: "Big Cypress Fox Squirrel|2",
    BE: "Bald Eagle|",
    BEAR: "Florida Black Bear|2",
    BGFRG: "Bog Frog|",
    BOGFROG: "Bog Frog|",
    BWVI: "Black-Whiskered Vireo|",
    CHBM: "Choctawhatchee Beach Mouse|1",
    CKMS: "Cedar Key Mole Skink|",
    COHA: "Cooper's Hawk|4",
    CRCA: "Crested Caracara|",
    CROC: "American Crocodile|2",
    DUCK: "Mottled Duck|",
    FATSL: "Flatwoods Salamander|",
    FKMS: "Florida Keys Mole Skink|",
    FLATSAL: "Flatwoods Salamander|",
    FLOMO: "Florida Mouse|3",
    FSC: "Florida Sandhill Crane|",
    GBAT: "Gray Bat|1",
    GRAYBAT: "Gray Bat|1",
    GRSHPRSP: "Florida Grasshopper Sparrow|1",
    GSHP: "Florida Grasshopper Sparrow|1",
    GSMS: "Gulf Salt Marsh Snake|3",
    GTORT: "Gopher Tortoise|",
    KDEER: "Florida Key Deer|1",
    KMTURT: "Lower Keys Striped Mud Turtle|",
    KTURT: "Lower Keys Striped Mud Turtle|",
    LIMK: "Limpkin|",
    LIMPK: "Limpkin|",
    LKMR: "Lower Keys Marsh Rabbit|1",
    LOUSP: "Louisiana Seaside Sparrow|2",
    LOUSSP: "Louisiana Seaside Sparrow|2",
    LOWA: "Lousiana Waterthrush|",
    MACSP: "MacGillivray's Seaside Sparrow|2",
    MACU: "Mangrove Cuckoo|4",
    NEWT: "Striped Newt|2",
    OWL: "Florida Burrowing Owl|3",
    PABU: "Painted Bunting|",
    PANT: "Florida Panther|1",
    PANTHER: "Florida Panther|1",
    PBTF: "Pine Barrens Tree Frog|3",
    PBTFROG: "Pine Barrens Tree Frog|3",
    PLOVER: "Cuban Snowy Plover|2",
    PLOVR: "Cuban Snowy Plover|2",
    RCCSN: "Rim Rock Crowned Snake|",
    RCW: "Red-Cockaded Woodpecker|",
    RRCSNAKE: "Rim Rock Crowned Snake|",
    SABM: "St. Andrews Beach Mouse|1",
    SALTVOLE: "Florida Salt Marsh Vole|1",
    SAVOL: "Florida Salt Marsh Vole|1",
    SCOTTSP: "Scott's Seaside Sparrow|3",
    SCRJY: "Florida Scrub-Jay|2",
    SCRUBJAY: "Florida Scrub-Jay|2",
    SCTSP: "Scott's Seaside Sparrow|3",
    SEALSALM: "Seal Salamander|2",
    SEBAT: "Southeastern Bat|",
    SEBM: "Southeastern Beach Mouse|1",
    SESAL: "Seal Salamander|2",
    SHFS: "Sherman's Fox Squirrel|",
    SIRAT: "Sanibel Island Rice Rat|1",
    SKMR: "Black Skimmer|",
    SNKIT: "Florida Snail Kite|2",
    SNKITE: "Florida Snail Kite|2",
    SRRAT: "Silver Rice Rat|2",
    SSKINK: "Sand Skink|2",
    SSKNK: "Sand Skink|2",
    STHA: "Short-Tailed Hawk|2",
    STKI: "Swallow-Tailed Kite|3",
    WADE: "Wading Birds|",
    WCPI: "White-Crowned Pigeon|3"
};

var sppLabels = {};
d3.keys(species).forEach(function(d){
    sppLabels[d] = species[d].split('|')[0]
});

var speciesLinks = {
    GTORT: 'http://myfwc.com/wildlifehabitats/profiles/reptiles-and-amphibians/reptiles/gopher-tortoise/',
    PANTHER: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/florida-panther/',
    PANT: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/florida-panther/',
    KDEER: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/key-deer/',
    LKMR: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/marsh-rabbit/',
    GRAYBAT: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/bats/',
    GBAT: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/bats/',
    SEBAT: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/bats/',
    AMKE: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/american-kestrel/',
    BE: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/bald-eagle/',
    SNKIT: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/florida-snail-kite/',
    SNKITE: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/florida-snail-kite/',
    GRSHPRSP: 'http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-grasshopper-sparrow/',
    GSHP: 'http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-grasshopper-sparrow/',
    SCRJY: 'http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-scrub-jay/',
    LIMK: 'http://myfwc.com/wildlifehabitats/profiles/birds/waterbirds/limpkin/',
    RCW: 'http://myfwc.com/wildlifehabitats/profiles/birds/woodpeckers/red-cockaded-woodpecker/'
};

// subsets of the species into taxa
var sppGroups = {
    birds: ["COHA", "GSHP", "LOUSP", "MACSP", "MACU", "OWL", "PLOVR", "SCRJY", "SCTSP", "SNKIT", "STHA", "STKI", "WCPI"],
    mammals: ["AIBM", "BCFS", "BEAR", "CHBM", "FLOMO", "GBAT", "KDEER", "LKMR", "PANT", "SABM", "SAVOL", "SEBM", "SIRAT", "SRRAT"],
    herps: ["ASMS", "CROC", "GSMS", "NEWT", "PBTF", "SESAL", "SSKNK"]
};

var sppGroupLabels = {
    birds: 'Birds',
    mammals: 'Mammals',
    herps: 'Amphibians &amp; Reptiles'
};



var communities = {
    UGvh:"Upland Glade, very high",
    PRvh:"Pine Rockland, very high",
    PRh:"Pine Rockland, high",
    SSFvh:"Scrub and Scrubby Flatwoods, very high",
    SSFh:"Scrub and Scrubby Flatwoods, high",
    SSFm:"Scrub and Scrubby Flatwoods, moderate",
    RHvh:"Rockland Hammock, very high",
    RHh:"Rockland Hammock, high",
    RHm:"Rockland Hammock, moderate",
    DPvh:"Dry Prairie, very high",
    DPh:"Dry Prairie, high",
    DPm:"Dry Prairie, moderate",
    SSvh:"Seepage Slope, very high",
    SSh:"Seepage Slope, high",
    ICLvh:"Imperiled Coastal Lakes, very high",
    ICLh:"Imperiled Coastal Lakes, high",
    ICLm:"Imperiled Coastal Lakes, moderate",
    FCUvh:"Costal Uplands, very high",
    FCUh:"Coastal Uplands, high",
    FCUm:"Costal Uplands, moderate",
    Svh:"Sandhill, very high",
    Sh:"Sandhill, high",
    Sm:"Sandhill, moderate",
    SULvh:"Sandhill Upland Lakes, very high",
    SULh:"Sandhill Upland Lakes, high",
    SULm:"Sandhill Upland Lake, moderate",
    UPvh:"Upland Pine, very high",
    Uph:"Upland Pine, high",
    Upm:"Upland Pine, moderate",
    PFvh:"Pine Flatwoods, very high",
    PFh:"Pine Flatwoods, high",
    PFm:"Pine Flatwoods, moderate",
    Uhvh:"Upland Hardwood Forest, very high",
    Uhh:"Upland Hardwood Forest, high",
    Uhm:"Upland Hardwood Forest, moderate",
    CWvh:"Coastal Wetlands, very high",
    CWh:"Coastal Wetlands, high",
    CWm:"Coastal Wetlands, moderate"
};

var communityLinks = {

};

var priorityResourceLabels = {
    C: 'Cultural',
    E: 'Estuarine',
    FNFW: 'Freshwater Non-forested Wetlands',
    PFDP: 'Pine Flatwoods and Dry Prairie',
    HPS: 'High Pine and Scrub',
    M: 'Marine',
    WL2: 'Working Lands 2',
    HFU: 'Hardwood Forested Uplands',
    FA: 'Freshwater Aquatic',
    WL1: 'Working Lands 1',
    FFW: 'Freshwater Forested Wetlands',
    CU: 'Coastal Uplands'
};

var priorityResourceTooltips = {
    C: 'Important features of the environment or landscape related to social practices, customary beliefs, or economic activity that is influenced by social values.',
    E: 'Deepwater tidal habitats and adjacent tidal wetlands. Usually semi-enclosed by land with open, partly obstructed, or sporadic ocean access, with ocean derived water at least occasionally diluted by freshwater land runoff. The upstream and landward limit is where ocean-derived salts measure ˂ .5 ppt during average annual low flow. The seaward limit is: 1) an imaginary line closing the mouth of a river, bay, or sound; and 2) the seaward limit of wetland emergents, shrubs, or trees when not included in 1).',
    FNFW: 'Herbaceous or shrubby palustrine communities in floodplains or depressions; canopy trees, if present, very sparse and often stunted.',
    PFDP: 'Mesic pine woodland or mesic shrubland on flat sandy or limestone substrates, often with a hard pan that impedes drainage.',
    HPS: 'Hills with mesic or xeric woodlands or shrublands; canopy, if present, open and consisting of pine or a mixture of pine and deciduous hardwoods.',
    M: 'Open ocean over the continental shelf, and coastline exposed to waves and currents of the open ocean shoreward to: 1) extreme high water of spring tides; 2) seaward limit of wetland emergents, trees, or shrubs; or 3) seaward limit of the estuarine system, other than vegetation. Salinities exceed 30 parts per thousand (ppt). Includes reef/hardbottom, submersed aquatic vegetation, and unconsolidated sediment habitats.',
    WL2: 'Landscapes where production of market goods and ecosystem services are mutually reinforcing, such as private agricultural land (Agriculture, Improved Pasture, etc.).',
    HFU: 'Mesic or xeric forest dominated mainly by hardwood trees.',
    FA: 'Natural rivers and streams where stream flow, morphometry, and water chemistry are not substantially modified by human activities, or native biota are dominant1. Natural inland lakes and ponds where the trophic state, morphometry, and water chemistry are not substantially modified by human activities, or native biota are dominant.',
    WL1: 'Landscapes where production of market goods and ecosystem services are mutually reinforcing, such as private agricultural land (Timberland, Unimproved Pasture, etc.).',
    FFW: 'Floodplain or depression wetlands dominated by hydrophytic trees.',
    CU: 'Mesic or xeric communities restricted to barrier islands and near shore; woody or herbaceous vegetation, or other communities.'
};



var priorityResourceColors = {
    C: d3.rgb(200, 195, 255).toString(),
    E: d3.rgb(80, 185, 160).toString(),
    FNFW: d3.rgb(125, 210, 255).toString(),
    PFDP: d3.rgb(35, 150, 0).toString(),
    HPS: d3.rgb(0, 85, 0).toString(),
    M: d3.rgb(0, 95, 120).toString(),
    WL2: d3.rgb(255, 150, 25).toString(),
    HFU: d3.rgb(190, 95, 0).toString(),
    FA: d3.rgb(0, 80, 235).toString(),
    WL1: d3.rgb(255, 255, 125).toString(),
    FFW: d3.rgb(185, 160, 130).toString(),
    CU: d3.rgb(255, 190, 190).toString()
};


var ownershipTypes = [
    {
        type: 'F',
        label: 'Federal'
    },
    {
        type: 'S',
        label: 'State'
    },
    {
        type: 'L',
        label: 'Local'
    },
    {
        type: 'P',
        label: 'Private Conserved Land'
    }

];


// in sorted order
var landUseLabels = {
    10: 'Natural Upland',
    20: 'Wetland',
    30: 'Freshwater Aquatic',
    60: 'Marine',
    70: 'Rural (High Intensity)',
    80: 'Rural (Low Intensity)',
    85: 'Tree Plantations',
    90: 'Developed / Altered'
};
var landUseTypes = d3.keys(landUseLabels);
var landUseColors = {
    10: d3.rgb(35, 150, 0).toString(),
    20: d3.rgb(160, 250, 255).toString(),
    30: d3.rgb(25, 150, 100).toString(),
    60: d3.rgb(0, 95, 120).toString(),
    70: d3.rgb(255, 150, 25).toString(),
    80: d3.rgb(255, 255, 125).toString(),
    85: d3.rgb(0, 85, 0).toString(),
    90: d3.rgb(165, 165, 165).toString()
};

var landUseTooltips = {
    10: 'Includes all upland natural communities and landcover types included in the CLC. (e.g. Sandhill, Dry Prairie, Coastal Strand, Rockland Hammock, etc.).',
    20: 'Includes all herbaceous/shrub freshwater wetland communities and landcover types (e.g. Marshes, Mixed Shrub/Scrub Wetland, Floating/Emergent Aquatic Vegetation, Non-vegetated Wetland, etc.), all woody freshwater wetland communities and landcover types in the CLC (e.g. Hydric Hammock, Basin Swamp, Cypress, Wet Flatwoods, etc.), and all brackish aquatic communities and landcover types in the CLC (e.g. Tidal Flat, Mangrove Swamp, Salt Marsh, Oyster Bar, etc.).',
    30: 'Includes all open freshwater communities and landcover types in the CLC. (e.g. Spring-run Stream,  Riverine, Sinkhole Lake, Coastal Dune Lake, etc.).',
    60: 'Consists of the marine landcover classification in the CLC.',
    70: 'Includes all high-intensity agriculture and other rural landcover practices in the CLC. (e.g. Croplands/Pasture, Orchards/Groves, Citrus, Improved Pasture, etc.).',
    80: 'Includes all low-intensity rural landcover practices (excluding timber) in the CLC. (e.g. Rural Open, Unimproved/Woodland Pasture, etc.).',
    85: 'Includes all tree plantations and timber related landcover practices in the CLC. (e.g. Coniferous Plantations, Hardwood Plantations, etc.).',
    90: 'Includes all urban and highly developed landcover types in the CLC. (e.g. Transportation, Extractive, High Intensity Urban, Low Intensity Urban, etc.).'
};


var partnerLabels = {
    'llp_conp': 'Longleaf Pine Ecosystem Geodatabase Protection Priorities|http://www.freshfromflorida.com/Divisions-Offices/Florida-Forest-Service/Our-Forests/The-Florida-Longleaf-Pine-Ecosystem-Geodatabase',
    'tnc_a': 'The Nature Conservancy Ecoregional Priority Areas|http://www.landscope.org/focus/understand/tnc_portfolio/',
    'gcconvis': 'Land Conservation Vision for the Gulf of Mexico Region|http://gulfpartnership.org/index.php/site/issue/strategic-conservation',
    'salcc': 'South Atlantic LCC Conservation Blueprint|http://www.southatlanticlcc.org/blueprint/',
    'acjv': 'Atlantic Coast Joint Venture|http://acjv.org/planning/bird-conservation-regions/sambi/',
    'epaprishd': 'Environmental Protection Agency Priority Watersheds|http://nepis.epa.gov/Exe/ZyNET.exe/P100BF0Q.TXT?ZyActionD=ZyDocument&Client=EPA&Index=2011+Thru+2015&Docs=&Query=&Time=&EndTime=&SearchMethod=1&TocRestrict=n&Toc=&TocEntry=&QField=&QFieldYear=&QFieldMonth=&QFieldDay=&IntQFieldOp=0&ExtQFieldOp=0&XmlQuery=&File=D%3A%5Czyfiles%5CIndex%20Data%5C11thru15%5CTxt%5C00000001%5CP100BF0Q.txt&User=ANONYMOUS&Password=anonymous&SortMethod=h%7C-&MaximumDocuments=1&FuzzyDegree=0&ImageQuality=r75g8/r75g8/x150y150g16/i425&Display=p%7Cf&DefSeekPage=x&SearchBack=ZyActionL&Back=ZyActionS&BackDesc=Results%20page&MaximumPages=1&ZyEntry=1&SeekPage=x&ZyPURL',
    'tnc_r': 'The Nature Conservancy Above Average Terrestrial Resilient Sites|https://www.conservationgateway.org/ConservationByGeography/NorthAmerica/UnitedStates/edc/reportsdata/terrestrial/resilience/Pages/default.aspx',
    'ncbi': 'National Bobwhite Conservation Initiative|http://bringbackbobwhites.org/images/stories/nbci_florida.jpg'

};
var partners = ['acjv', 'epaprishd', 'gcconvis', 'llp_conp_', 'salcc', 'tnc_a', 'tnc_r'];