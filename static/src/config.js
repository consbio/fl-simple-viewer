/** Colors **/
// highest to lowest
var colorMap = {
    priority: ["#006837", "#31a354", "#78c679", "#c2e699", "#ffffcc"],
    dev: ["#993404", "#d95f0e", "#fe9929", "#fed98e", "#ffffd4"],
    slr: ["#253494", "#2c7fb8", "#41b6c4", "#a1dab4", "#ffffcc"],
    general: ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff", '#ffffcc'] //blue
};

var labelColorMap = {
    general: ['#FFF', '#FFF', '#FFF', '#333', '#333', '#333']
};


// These represent the breaks between quantile classes.  q=0 where value <= bin[0]
// Except for dev and slr, which are hard-coded breaks
var quantiles = {
    priority: [59, 75, 85, 92, 101], // known issue for > 100
    bio: [11, 24, 46, 73, 100],
    land: [0, 12, 49, 81, 100],
    water: [7, 18, 33, 55, 100],
    clip: [23, 45, 70, 92, 100],

    devCur: [1, 10, 25, 50, 100],
    dev2020: [1, 10, 25, 50, 100],
    dev2040: [1, 10, 25, 50, 100],
    dev2060: [1, 10, 25, 50, 100],

    slr1: [1, 10, 25, 50, 100],
    slr2: [1, 10, 25, 50, 100],
    slr3: [1, 10, 25, 50, 100]
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
    'bio': 'This model is a combination of the four CLIP core data layers in the Biodiversity Resource Category: Strategic Habitat Conservation Areas (SHCA), Vertebrate Potential Habitat Richness (VertRich), Rare Species Habitat Conservation Priorities (FNAIHAB), and Priority Natural Communities (Natcom).  See pg. 14 of the CLIP Technical Report for the rules used to assign the core data layers into the Biodiversity resource priority model.',
    'clip': 'The Critical Lands and Waters Identification Project (CLIP) is a collection of spatial data that identify statewide priorities for a broad range of natural resources in Florida. CLIP 3.0 is organized into a set of core natural resource data layers which are combined into resource categories, three of which (biodiversity, landscapes, surface water) have been combined into the Aggregated CLIP model, which identifies five priority levels for natural resource conservation.',
    'land': 'This model is a combination of the two core data layers in the Landscapes Resource Category: Florida Ecological Greenways Network, and Landscape Integrity Index.  See pg. 14-15 of the CLIP Technical Report for the rules used to assign the core data layers into the Landscape resource priority model.',
    'priority': 'Priority resources are the set of biological, ecological, and cultural features and ecological processes collaboratively identified as most important, and are the focus of the PFLCC’s planning.  Priority resources will provide a simple way to measure the overall condition of the Peninsular Florida’s complex systems.  There are currently 12 DRAFT Priority Resources, 9 based on land cover types from the Cooperative Land Cover map (v. 3.1): High Pine and Scrub, Pine Flatwoods and Dry Prairie, Freshwater Forested Wetlands, Hardwood Forested Uplands, Coastal Uplands, Freshwater non-forested Wetlands, Estuarine, Marine, Freshwater Aquatic; and 3 non-CLC based resource types:  Landscape Connectivity, Cultural and Socio-economic, and Working Lands.',
    'water': 'This model is a combination of the three core data layers in the Surface Water Resource Category: Significant Surface Waters, Natural Floodplain, and Wetlands.  See pg. 15 of the CLIP Technical Report for the rules used to assign the core data layers into the Surface Water resource priority model.',
    dev: 'These development projections are derived from the Florida 2060 development dataset. This projections explores the physical reality and consequences of the population growth from 2005 to 2060 if existing land use policy or population growth patterns do not change.  The land use suitability analysis displayed in this dataset was performed by the University of Florida GeoPlan Center for 1000 Friends of Florida. The graph below reports the area affected for each of the three time steps used in this model, the existing extent of urbanization in 2005, and the area unaffected by urbanization. The hectares reported for each of the three time steps are cumulative figures.',
    slr: "These sea level rise projections were produced by the University of Florida Geoplan Center. These projections measure sea level rise in meter increments up until 3 meters. The graph below reports the area affected for each of these three scenarios (as well as the area unaffected). The hectares reported for each of these scenarios are cumulative figures.  <br/><br/>Time ranges were extrapolated from the High Bathtub Projections (for Mean Sea Level Rise) used in the University of Florida GeoPlan Center's Sea Level Rise Sketch tool"
};

var priorityLabels = ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];
var priorityLabels4 = priorityLabels.slice(0, 4).concat(priorityLabels[5]);
var priorityLabels6 = priorityLabels.slice(0, 5).concat(['Priority 6']).concat(priorityLabels[5]);


// greenways and landscape integrity have different priority categories
var greenwaysLabels = ['Priority 1', 'Priority 3', 'Priority 4', 'Not a Priority'];
var greenwaysColors = ["#08519c", "#6baed6", "#bdd7e7", '#ffffcc'];
var greenwaysLabelColors = ['#FFF', '#FFF', '#333', '#333'];

var liLabels = ['Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];
var liColors = ["#3182bd", "#6baed6", "#bdd7e7", "#eff3ff", '#ffffcc'];
var liLabelColors = ['#FFF', '#FFF', '#333', '#333', '#333'];



// common name|priority(4 levels, not 5)
var species = {
    AIBM: "Anastasia Island Beach Mouse|1",
    AMKE: "Southeastern American Kestrel|",
    ASMS: "Atlantic Salt Marsh Snake|1",
    BCFS: "Big Cypress Fox Squirrel|2",
    BE: "Bald Eagle|",
    BEAR: "Florida Black Bear|2",
    BGFRG: "Bog Frog|",
    BWVI: "Black-Whiskered Vireo|",
    CHBM: "Choctawhatchee Beach Mouse|1",
    CKMS: "Cedar Key Mole Skink|",
    COHA: "Cooper's Hawk|4",
    CRCA: "Crested Caracara|",
    CROC: "American Crocodile|2",
    DUCK: "Mottled Duck|",
    FATSL: "Flatwoods Salamander|",
    FKMS: "Florida Keys Mole Skink|",
    FLOMO: "Florida Mouse|3",
    FSC: "Florida Sandhill Crane|",
    GBAT: "Gray Bat|1",
    GSHP: "Florida Grasshopper Sparrow|1",
    GSMS: "Gulf Salt Marsh Snake|3",
    GTORT: "Gopher Tortoise|",
    KDEER: "Florida Key Deer|1",
    KTURT: "Lower Keys Striped Mud Turtle|",
    LIMK: "Limpkin|",
    LKMR: "Lower Keys Marsh Rabbit|1",
    LOUSP: "Louisiana Seaside Sparrow|2",
    LOWA: "Lousiana Waterthrush|",
    MACSP: "MacGillivray's Seaside Sparrow|2",
    MACU: "Mangrove Cuckoo|4",
    NEWT: "Striped Newt|2",
    OWL: "Florida Burrowing Owl|3",
    PABU: "Painted Bunting|",
    PANT: "Florida Panther|1",
    PBTF: "Pine Barrens Tree Frog|3",
    PLOVR: "Cuban Snowy Plover|2",
    RCCSN: "Rim Rock Crowned Snake|",
    RCW: "Red-Cockaded Woodpecker|",
    SABM: "St. Andrews Beach Mouse|1",
    SAVOL: "Florida Salt Marsh Vole|1",
    SCRJY: "Florida Scrub-Jay|2",
    SCTSP: "Scott's Seaside Sparrow|3",
    SEBAT: "Southeastern Bat|",
    SEBM: "Southeastern Beach Mouse|1",
    SESAL: "Seal Salamander|2",
    SHFS: "Sherman's Fox Squirrel|",
    SIRAT: "Sanibel Island Rice Rat|1",
    SKMR: "Black Skimmer|",
    SNKIT: "Florida Snail Kite|2",
    SRRAT: "Silver Rice Rat|2",
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
    // birds
    AMKE: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/american-kestrel/',
    BE: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/bald-eagle/',
    BWVI: 'http://legacy.myfwc.com/bba/docs/bba_BWVI.pdf', //'https://www.allaboutbirds.org/guide/Black-whiskered_Vireo/id',
    COHA: 'http://legacy.myfwc.com/bba/docs/bba_COHA.pdf', //'https://www.allaboutbirds.org/guide/Coopers_Hawk/id',
    CRCA: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/crested-caracara/',
    DUCK: 'http://myfwc.com/wildlifehabitats/profiles/birds/waterfowl/mottled-ducks/',
    FSC: 'http://myfwc.com/wildlifehabitats/profiles/birds/cranes/sandhill-crane/',
    GSHP: 'http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-grasshopper-sparrow/',
    LIMK: 'http://myfwc.com/wildlifehabitats/profiles/birds/waterbirds/limpkin/',
    LOUSP: 'http://fwcg.myfwc.com/docs/seaside_sparrows.pdf',
    LOWA:  'http://legacy.myfwc.com/bba/docs/bba_LOWA.pdf', //'https://www.allaboutbirds.org/guide/Louisiana_Waterthrush/id',
    OWL: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/birds/burrowing-owl/',
    MACSP: 'http://fwcg.myfwc.com/docs/seaside_sparrows.pdf',
    MACU: 'http://legacy.myfwc.com/bba/docs/bba_MACU.pdf', //'https://www.allaboutbirds.org/guide/Mangrove_Cuckoo/id',
    RCW: 'http://myfwc.com/wildlifehabitats/profiles/birds/woodpeckers/red-cockaded-woodpecker/',
    SCRJY: 'http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-scrub-jay/',
    SCTSP: 'http://fwcg.myfwc.com/docs/seaside_sparrows.pdf',
    SKMR: 'http://myfwc.com/wildlifehabitats/profiles/birds/shorebirdsseabirds/black-skimmer/',
    SNKIT: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/florida-snail-kite/',
    STHA:  'http://legacy.myfwc.com/bba/docs/bba_STHA.pdf', //'https://www.audubon.org/field-guide/bird/short-tailed-hawk',
    STKI: 'http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/swallow-tailed-kite/',
    //WADE: 'http://myfwc.com/wildlifehabitats/profiles/birds/waterbirds/', //can find no good match.  See tech report
    WCPI: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/birds/white-crowned-pigeon/', //'https://www.allaboutbirds.org/guide/White-crowned_Pigeon/id',

    // mammals
    BCFS: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/big-cypress-fox-squirrel/',
    BEAR: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/black-bear/',
    CHBM: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/choctawhatchee-beach-mouse/',
    FLOMO: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/florida-mouse/',
    GBAT: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/gray-bat/',
    KDEER: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/key-deer/',
    LKMR: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/lower-keys-rabbit/',
    PANT: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/florida-panther/',
    SABM: 'http://myfwc.com/media/2211911/St-Andrew-beach-mouse.pdf',
    SAVOL: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/florida-salt-marsh-vole/',
    SEBAT: 'http://www.myfwc.com/wildlifehabitats/profiles/mammals/land/bats/information/field-guide/southeastern-myotis/',
    SEBM: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/southeastern-beach-mouse/',
    SHFS: 'http://myfwc.com/wildlifehabitats/profiles/mammals/land/fox-squirrel/',
    SIRAT: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/sanibel-island-rice-rat/',
    SRRAT: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/mammals/rice-rat/',

    // herps
    ASMS: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/reptiles/atlantic-salt-marsh-snake/',
    BGFRG: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/amphibians/florida-bog-frog/',
    CKMS: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/reptiles/florida-keys-mole-skink/',
    CROC: 'http://myfwc.com/wildlifehabitats/managed/american-crocodile/',
    FATSL: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/amphibians/frosted-flatwoods-salamander/',
    FKMS: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/reptiles/florida-keys-mole-skink/',
    GSMS: 'http://fwcg.myfwc.com/docs/At_salt_marsh_snake.pdf',
    GTORT: 'http://myfwc.com/wildlifehabitats/profiles/reptiles-and-amphibians/reptiles/gopher-tortoise/',
    KTURT: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/reptiles/striped-mud-turtle/',
    NEWT: 'http://myfwc.com/research/wildlife/amphibians-reptiles/striped-newt/',
    PBTF: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/amphibians/pine-barrens-treefrog/',
    RCCSN: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/reptiles/rim-rock-crowned-snake/',
    //SESAL: '', //can't find good match
    SSKNK: 'http://myfwc.com/wildlifehabitats/imperiled/profiles/reptiles/sand-skink/'
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


var priorityResourceLabels = {
    C: 'Cultural',
    E: 'Estuarine',
    FNFW: 'Freshwater Non-forested Wetlands',
    PFDP: 'Pine Flatwoods and Dry Prairie',
    HPS: 'High Pine and Scrub',
    M: 'Marine',
    WL2: 'Working Lands - Low Intensity',
    HFU: 'Hardwood Forested Uplands',
    FA: 'Freshwater Aquatic',
    WL1: 'Working Lands - High Intensity',
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
    WL2: 'Landscapes where production of market goods and ecosystem services are mutually reinforcing, such as private agricultural land (High Intensity: Agriculture, Improved Pasture, etc.).',
    HFU: 'Mesic or xeric forest dominated mainly by hardwood trees.',
    FA: 'Natural rivers and streams where stream flow, morphometry, and water chemistry are not substantially modified by human activities, or native biota are dominant. Natural inland lakes and ponds where the trophic state, morphometry, and water chemistry are not substantially modified by human activities, or native biota are dominant.',
    WL1: 'Landscapes where production of market goods and ecosystem services are mutually reinforcing, such as private agricultural land (Low Intensity: Timberland, Unimproved Pasture, etc.).',
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
    70: 'Rural - High Intensity',
    80: 'Rural - Low Intensity',
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


var barLabelPrefix = {
    4: 'Most',
    3: 'More',
    2: 'Intermediate',
    1: 'Less',
    0: 'Least'
};


/* info for categories, ordered from first to last category */
var clipInfo = [
    'Highest conservation priorities in the Biodiversity, Landscape, or Surface Water OR high conservation priorities across all categories.',
    'High conservation priorities in Biodiversity, Landscape, or Surface Water OR moderate conservation priorities across all categories.',
    'Moderate conservation priorities in Biodiversity, Landscape, or Surface Water.',
    'Low conservation priorities in Biodiversity, Landscape or Surface Water.',
    'Lowest conservation priorities in Biodiversity, Landscape or Surface Water.',
    'Not designated as a conservation priority.'
];

var clipBioInfo = [
    'Highest conservation priorities for Strategic Habitat Conservation Areas, Vertebrate Habitat Richness, Rare Species, or Priority Natural Communities.',
    'High conservation priorities for Strategic Habitat Conservation Areas, Vertebrate Habitat Richness, Rare Species, or Priority Natural Communities.',
    'Moderate conservation priorities for Strategic Habitat Conservation Areas, Vertebrate Habitat Richness, Rare Species, or Priority Natural Communities.',
    'Lowest conservation priorities for Strategic Habitat Conservation Areas, Rare Species, or Priority Natural Communities. Low conservation priorities for Vertebrate Habitat Richness.',
    'Lowest conservation priorities for Vertebrate Habitat Richness.',
    'Not designated as a conservation priority.'
];

var clipLandInfo = [
    'High conservation priorities for Florida Ecological Greenways Network.',
    'High conservation priorities for Landscape Integrity Index.',
    'Moderate conservation priorities for Florida Ecological Greenways or Landscape Integrity Index.',
    'Low conservation priorities for Florida Ecological Greenways Network or Landscape Integrity Index.',
    'Lowest conservation priorities for Landscape Integrity Index.',
    'Not designated as a conservation priority.'
];

var clipWaterInfo = [
    'Highest conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.',
    'High conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.',
    'Moderate conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.',
    'Low conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.',
    'Lowest conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.',
    'Not designated as a conservation priority.'
];
//
var clipRareSppInfo = [
    'Highest conservation priorities for rare species habitat.',
    'High conservation priorities for rare species habitat.',
    'Moderate conservation priorities for rare species habitat.',
    'Low Conservation Priorities for rare species habitat.',
    'Not designated as a conservation priority.'
];

var clipSHCAInfo = [
    'SHCAs for species with highest conservation rankings.',
    'SHCAs for species with high conservation rankings.',
    'SHCAs for species with moderate conservation rankings.',
    'SHCAs for species with low conservation ranking.',
    'Not designated as a conservation priority.'
];

var clipPNCAreaInfo = [
    'Highest priority for underrepresented natural communities.',
    'High priority for underrepresented natural communities.',
    'Moderate priority for underrepresented natural communities.',
    'Low priority for underrepresented natural communities.',
    'Not designated as a conservation priority.'
];

var clipSppRichInfo = [
    'Highest priority potential habitat (8-13  SHCA vertebrate species).',
    'High priority potential habitat (7 SHCA vertebrate species).',
    'Moderate priority potential habitat (5-6 SHCA vertebrate species).',
    'Low priority potential habitat (2-4 SHCA vertebrate species).',
    'Potential habitat for (1 SHCA vertebrate species).',
    'Not designated as a conservation priority.'
];

var clipGreenwayInfo = [
    'Highest priority critical linkages.', // P1
    'High priority greenways that are not critical linkages.', // P3
    'Moderate priority regionally significant greenways.', // P4
    'Not designated as a conservation priority.'
];

var clipLIInfo = [
    'Areas with highest ecological landscape integrity with very large patches of natural lands.', // P2
    'Areas with highest ecological landscape integrity.', // P3
    'Areas with moderately-high to high ecological landscape integrity.', // P4
    'Areas with moderate ecological landscape integrity', // P5
    'Not designated as a conservation priority.'
];

var clipSigSurfWaterInfo = [
    'Highest conservation priorities for surface waters.',
    'High conservation priorities for surface waters.',
    'Moderate conservation priorities for surface waters.',
    'Low Conservation Priorities for surface waters.',
    'Lowest conservation priorities for surface waters.',
    'Not designated as a conservation priority.'
];

var clipNatFldInfo = [
    'Highest conservation priorities for natural floodplains.',
    'High conservation priorities for natural floodplains.',
    'Moderate conservation priorities for natural floodplains.',
    'Low Conservation Priorities for natural floodplains.',
    'Lowest conservation priorities for natural floodplains.',
    'Not designated as a conservation priority.'
];

var clipWetlandsInfo = [
    'Highest conservation priorities for wetlands.',
    'High conservation priorities for wetlands.',
    'Moderate conservation priorities for wetlands.',
    'Low Conservation Priorities for wetlands.',
    'Lowest conservation priorities for wetlands.',
    'Not designated as a conservation priority.'
];

var aquiferInfo = [
    'Highest recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.',
    'Highest recharge areas that do not overlap; OR high recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.',
    'High recharge areas that do not overlap; OR moderate recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.',
    'Moderate recharge areas that do not overlap; OR moderately low recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.',
    'Moderately low recharge areas that do not overlap; OR low recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.',
    'Low recharge areas that do not overlap.',
    'Not designated as a conservation priority.'
];

var landOwnershipInfo = [
    'Lands owned by a federal agency.',
    'Lands owned by a state agency.',
    'Lands owned by a local agency.',
    'Lands recorded as privately conserved.',
    'Areas not owned by federal, state, or local agencies, and not recorded as private conserved land.'
];

