/** Colors **/
// highest to lowest
var colorMap = {
    priority: ["#006837", "#31a354", "#78c679", "#c2e699", "#ffffcc"],
    dev: ["#993404", "#d95f0e", "#fe9929", "#fed98e", "#ffffd4"],
    slr: ["#253494", "#2c7fb8", "#41b6c4", "#a1dab4", "#ffffcc"],
    general4: ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff"],
    general5: [
        "#08519c",
        "#3182bd",
        "#6baed6",
        "#bdd7e7",
        "#eff3ff",
        "#ffffcc",
    ],
    general6: [
        "#08519c",
        "#3182bd",
        "#6baed6",
        "#9ecae1",
        "#c6dbef",
        "#eff3ff",
        "#ffffcc",
    ],
    general7: [
        "#084594",
        "#2171b5",
        "#4292c6",
        "#6baed6",
        "#9ecae1",
        "#c6dbef",
        "#eff3ff",
        "#ffffcc",
    ],
    land_integrity: ["#3182bd", "#6baed6", "#bdd7e7", "#eff3ff", "#ffffcc"],
};

var labelColorMap = {
    general4: ["#FFF", "#FFF", "#FFF", "#333", "#333"],
    general5: ["#FFF", "#FFF", "#FFF", "#333", "#333", "#333"],
    general6: ["#FFF", "#FFF", "#FFF", "#333", "#333", "#333", "#333"],
    general7: ["#FFF", "#FFF", "#FFF", "#333", "#333", "#333", "#333", "#333"],
    land_integrity: ["#FFF", "#FFF", "#333", "#333", "#333"],
};

var priorityLabels4 = [
    "Priority 1",
    "Priority 2",
    "Priority 3",
    "Priority 4",
    "Not a Priority",
];
var priorityLabels5 = [
    "Priority 1",
    "Priority 2",
    "Priority 3",
    "Priority 4",
    "Priority 5",
    "Not a Priority",
];
var priorityLabels6 = [
    "Priority 1",
    "Priority 2",
    "Priority 3",
    "Priority 4",
    "Priority 5",
    "Priority 6",
    "Not a Priority",
];
var priorityLabels7 = [
    "Priority 1",
    "Priority 2",
    "Priority 3",
    "Priority 4",
    "Priority 5",
    "Priority 6",
    "Priority 7",
    "Not a Priority",
];

// These represent the breaks between quantile classes.  q=0 where value <= bin[0]
// Except for dev and slr, which are hard-coded breaks
// The breaks are calculated using extract_HUC_summary.py
var quantiles = {
    priority: [23, 51, 75, 92, 101], // known issue for > 100
    bio: [10, 23, 44, 72, 100],
    land: [0, 9, 47, 82, 101],
    water: [6, 17, 31, 50, 103],
    clip: [22, 44, 68, 92, 101],

    devCur: [1, 10, 25, 50, 100],
    dev2020: [1, 10, 25, 50, 100],
    dev2040: [1, 10, 25, 50, 100],
    dev2060: [1, 10, 25, 50, 100],

    slr1: [1, 10, 25, 50, 100],
    slr2: [1, 10, 25, 50, 100],
    slr3: [1, 10, 25, 50, 100],
};

var summaryFields = {
    priority: ["priority", "clip", "bio", "land", "water"],
    threats: [
        "slr1",
        "slr2",
        "slr3",
        "devCur",
        "dev2020",
        "dev2040",
        "dev2060",
    ],
    slr: ["slr1", "slr2", "slr3"],
    dev: ["devCur", "dev2020", "dev2040", "dev2060"],
};

var selectedField = "priority";
var selectedGroup = "priority";

var fieldLabels = {
    bio: "CLIP Biodiversity",
    clip: "Overall CLIP",
    land: "CLIP Landscape",
    priority: "Blueprint v. 1.0 Conservation Assets",
    water: "CLIP Surface Water",

    dev: "Urban Development / Population Growth",
    devCur: "Existing",
    dev2020: "2020",
    dev2040: "2040",
    dev2060: "2060",

    slr: "Projected Sea Level Rise",
    slr1: "1 meter (2070 - 2090)",
    slr2: "2 meters (2100 - 2120)",
    slr3: "3 meters (2130 - 2150)",
};

var slrLevels = ["slr1", "slr2", "slr3"];
var devLevels = ["devCur", "dev2020", "dev2040", "dev2060"];

var fieldTooltips = {
    bio: "This model is a combination of the four CLIP core data layers in the Biodiversity Resource Category: Strategic Habitat Conservation Areas (SHCA), Vertebrate Potential Habitat Richness (VertRich), Rare Species Habitat Conservation Priorities (FNAIHAB), and Priority Natural Communities (Natcom).  See pg. 14 of the CLIP Technical Report for the rules used to assign the core data layers into the Biodiversity resource priority model.",
    clip: "The Critical Lands and Waters Identification Project (CLIP) is a collection of spatial data that identify statewide priorities for a broad range of natural resources in Florida. CLIP 4.0 is organized into a set of core natural resource data layers which are combined into resource categories, three of which (biodiversity, landscapes, surface water) have been combined into the Aggregated CLIP model, which identifies five priority levels for natural resource conservation.",
    land: "This model is a combination of the two core data layers in the Landscapes Resource Category: Florida Ecological Greenways Network, and Landscape Integrity Index.  See pg. 14-15 of the CLIP Technical Report for the rules used to assign the core data layers into the Landscape resource priority model.",
    priority:
        "Blueprint v. 1.0 delineates Conservation Assets (CAs) the biological, ecological, and cultural features and ecological processes that are the focus of the Florida Landscape Conservation Design effort.  Twelve Conservation Assets were collaboratively identified.  Nine are based on natural land covers from the Cooperative Land Cover (CLC v. 3.2): High Pine and Scrub, Pine Flatwoods and Dry Prairie, Freshwater Forested Wetlands, Hardwood Forested Uplands, Coastal Uplands, Freshwater Non-forested Wetlands, Estuarine, Marine, and Freshwater Aquatic.  The other three are Landscape Connectivity, Cultural Features and Working Lands.  The Marine, Estuarine and Cultural Conservation Assets are not yet fully developed, however partial Estuarine is shown.",
    water: "This model is a combination of the three core data layers in the Surface Water Resource Category: Significant Surface Waters, Natural Floodplain, and Wetlands.  See pg. 15 of the CLIP Technical Report for the rules used to assign the core data layers into the Surface Water resource priority model.",
    dev: "These development projections are derived from the Florida 2060 development dataset. This projections explores the physical reality and consequences of the population growth from 2005 to 2060 if existing land use policy or population growth patterns do not change.  The land use suitability analysis displayed in this dataset was performed by the University of Florida GeoPlan Center for 1000 Friends of Florida. The graph below reports the area affected for each of the three time steps used in this model, the existing extent of urbanization in 2005, and the area unaffected by urbanization. The hectares reported for each of the three time steps are cumulative figures.",
    slr: "These sea level rise projections were produced by the University of Florida Geoplan Center. These projections measure sea level rise in meter increments up until 3 meters. The graph below reports the area affected for each of these three scenarios (as well as the area unaffected). The hectares reported for each of these scenarios are cumulative figures.  <br/><br/>Time ranges were extrapolated from the High Bathtub Projections (for Mean Sea Level Rise) used in the University of Florida GeoPlan Center's Sea Level Rise Sketch tool",
};

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
    WCPI: "White-Crowned Pigeon|3",
};

var sppLabels = {};
d3.keys(species).forEach(function (d) {
    sppLabels[d] = species[d].split("|")[0];
});

var speciesLinks = {
    // birds
    AMKE: "http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/american-kestrel/",
    BE: "http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/bald-eagle/",
    BWVI: "http://legacy.myfwc.com/bba/docs/bba_BWVI.pdf", //'https://www.allaboutbirds.org/guide/Black-whiskered_Vireo/id',
    COHA: "http://legacy.myfwc.com/bba/docs/bba_COHA.pdf", //'https://www.allaboutbirds.org/guide/Coopers_Hawk/id',
    CRCA: "http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/crested-caracara/",
    DUCK: "http://myfwc.com/wildlifehabitats/profiles/birds/waterfowl/mottled-ducks/",
    FSC: "http://myfwc.com/wildlifehabitats/profiles/birds/cranes/sandhill-crane/",
    GSHP: "http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-grasshopper-sparrow/",
    LIMK: "http://myfwc.com/wildlifehabitats/profiles/birds/waterbirds/limpkin/",
    LOUSP: "http://legacy.myfwc.com/bba/docs/bba_sesp.pdf",
    LOWA: "http://legacy.myfwc.com/bba/docs/bba_LOWA.pdf", //'https://www.allaboutbirds.org/guide/Louisiana_Waterthrush/id',
    OWL: "https://myfwc.com/wildlifehabitats/profiles/birds/owls/burrowing-owl/",
    MACSP: "https://www.fws.gov/southeast/wildlife/birds/macgillivrays-seaside-sparrow/",
    MACU: "http://legacy.myfwc.com/bba/docs/bba_MACU.pdf", //'https://www.allaboutbirds.org/guide/Mangrove_Cuckoo/id',
    RCW: "http://myfwc.com/wildlifehabitats/profiles/birds/woodpeckers/red-cockaded-woodpecker/",
    SCRJY: "http://myfwc.com/wildlifehabitats/profiles/birds/songbirds/florida-scrub-jay/",
    SCTSP: "https://myfwc.com/wildlifehabitats/profiles/birds/songbirds/scotts-seaside-sparrow/",
    SKMR: "http://myfwc.com/wildlifehabitats/profiles/birds/shorebirdsseabirds/black-skimmer/",
    SNKIT: "http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/florida-snail-kite/",
    STHA: "http://legacy.myfwc.com/bba/docs/bba_STHA.pdf", //'https://www.audubon.org/field-guide/bird/short-tailed-hawk',
    STKI: "http://myfwc.com/wildlifehabitats/profiles/birds/raptors-and-vultures/swallow-tailed-kite/",
    //WADE: 'http://myfwc.com/wildlifehabitats/profiles/birds/waterbirds/', //can find no good match.  See tech report
    WCPI: "https://myfwc.com/wildlifehabitats/profiles/birds/white-crowned-pigeon/", //'https://www.allaboutbirds.org/guide/White-crowned_Pigeon/id',

    // mammals
    BCFS: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/big-cypress-fox-squirrel/",
    BEAR: "http://myfwc.com/wildlifehabitats/profiles/mammals/land/black-bear/",
    CHBM: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/choctawhatchee-beach-mouse/",
    FLOMO: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/florida-mouse/",
    GBAT: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/gray-bat/",
    KDEER: "http://myfwc.com/wildlifehabitats/profiles/mammals/land/key-deer/",
    LKMR: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/lower-keys-rabbit/",
    PANT: "http://myfwc.com/wildlifehabitats/profiles/mammals/land/florida-panther/",
    SABM: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/st-andrew-beach-mouse/",
    SAVOL: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/florida-salt-marsh-vole/",
    SEBAT: "https://myfwc.com/conservation/you-conserve/wildlife/bats/field-guide/southeastern-myotis/",
    SEBM: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/southeastern-beach-mouse/",
    SHFS: "http://myfwc.com/wildlifehabitats/profiles/mammals/land/fox-squirrel/",
    SIRAT: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/sanibel-island-rice-rat/",
    SRRAT: "https://myfwc.com/wildlifehabitats/profiles/mammals/land/rice-rat/",

    // herps
    ASMS: "https://myfwc.com/wildlifehabitats/profiles/reptiles/snakes/atlantic-salt-marsh-snake/",
    BGFRG: "https://myfwc.com/wildlifehabitats/profiles/amphibians/florida-bog-frog/",
    CKMS: "https://myfwc.com/wildlifehabitats/profiles/reptiles/florida-keys-mole-skink/",
    CROC: "http://myfwc.com/wildlifehabitats/managed/american-crocodile/",
    FATSL: "https://myfwc.com/wildlifehabitats/profiles/amphibians/frosted-flatwoods-salamander/",
    FKMS: "https://myfwc.com/wildlifehabitats/profiles/reptiles/florida-keys-mole-skink/",
    GSMS: "https://myfwc.com/wildlifehabitats/profiles/reptiles/snakes/atlantic-salt-marsh-snake/",
    GTORT: "http://myfwc.com/wildlifehabitats/profiles/reptiles-and-amphibians/reptiles/gopher-tortoise/",
    KTURT: "https://myfwc.com/wildlifehabitats/profiles/reptiles/freshwater-turtles/striped-mud-turtle/",
    NEWT: "http://myfwc.com/research/wildlife/amphibians-reptiles/striped-newt/",
    PBTF: "https://myfwc.com/research/wildlife/amphibians-reptiles/pine-barrens-treefrog/",
    RCCSN: "https://myfwc.com/wildlifehabitats/profiles/reptiles/snakes/rim-rock-crowned-snake/",
    //SESAL: '', //can't find good match
    SSKNK: "https://myfwc.com/wildlifehabitats/profiles/reptiles/sand-skink/",
};

// subsets of the species into taxa
var sppGroups = {
    birds: [
        "COHA",
        "GSHP",
        "LOUSP",
        "MACSP",
        "MACU",
        "OWL",
        "PLOVR",
        "SCRJY",
        "SCTSP",
        "SNKIT",
        "STHA",
        "STKI",
        "WCPI",
    ],
    mammals: [
        "AIBM",
        "BCFS",
        "BEAR",
        "CHBM",
        "FLOMO",
        "GBAT",
        "KDEER",
        "LKMR",
        "PANT",
        "SABM",
        "SAVOL",
        "SEBM",
        "SIRAT",
        "SRRAT",
    ],
    herps: ["ASMS", "CROC", "GSMS", "NEWT", "PBTF", "SESAL", "SSKNK"],
};

var sppGroupLabels = {
    birds: "Birds",
    mammals: "Mammals",
    herps: "Amphibians &amp; Reptiles",
};

var communities = {
    UGvh: "Upland Glade, very high",
    PRvh: "Pine Rockland, very high",
    PRh: "Pine Rockland, high",
    SSFvh: "Scrub and Scrubby Flatwoods, very high",
    SSFh: "Scrub and Scrubby Flatwoods, high",
    SSFm: "Scrub and Scrubby Flatwoods, moderate",
    RHvh: "Rockland Hammock, very high",
    RHh: "Rockland Hammock, high",
    RHm: "Rockland Hammock, moderate",
    DPvh: "Dry Prairie, very high",
    DPh: "Dry Prairie, high",
    DPm: "Dry Prairie, moderate",
    SSvh: "Seepage Slope, very high",
    SSh: "Seepage Slope, high",
    ICLvh: "Imperiled Coastal Lakes, very high",
    ICLh: "Imperiled Coastal Lakes, high",
    ICLm: "Imperiled Coastal Lakes, moderate",
    FCUvh: "Costal Uplands, very high",
    FCUh: "Coastal Uplands, high",
    FCUm: "Costal Uplands, moderate",
    Svh: "Sandhill, very high",
    Sh: "Sandhill, high",
    Sm: "Sandhill, moderate",
    SULvh: "Sandhill Upland Lakes, very high",
    SULh: "Sandhill Upland Lakes, high",
    SULm: "Sandhill Upland Lake, moderate",
    UPvh: "Upland Pine, very high",
    Uph: "Upland Pine, high",
    Upm: "Upland Pine, moderate",
    PFvh: "Pine Flatwoods, very high",
    PFh: "Pine Flatwoods, high",
    PFm: "Pine Flatwoods, moderate",
    Uhvh: "Upland Hardwood Forest, very high",
    Uhh: "Upland Hardwood Forest, high",
    Uhm: "Upland Hardwood Forest, moderate",
    CWvh: "Coastal Wetlands, very high",
    CWh: "Coastal Wetlands, high",
    CWm: "Coastal Wetlands, moderate",
};

var priorityResourceLabels = {
    Conx: "Connectivity",
    C: "Cultural",
    E: "Estuarine",
    FNFW: "Freshwater Non-forested Wetlands",
    PFDP: "Pine Flatwoods and Dry Prairie",
    HPS: "High Pine and Scrub",
    M: "Marine",
    WL2: "Working Lands - Low Intensity",
    HFU: "Hardwood Forested Uplands",
    FA: "Freshwater Aquatic",
    WL1: "Working Lands - High Intensity",
    FFW: "Freshwater Forested Wetlands",
    CU: "Coastal Uplands",
};

var priorityResourceTooltips = {
    Conx: "Linkages between Conservation Asset Habitats, based on the P3 priority level of the CLIP Landscape Priorities.",
    C: "Important features of the environment or landscape related to social practices, customary beliefs, or economic activity that is influenced by social values.",
    E: "Deepwater tidal habitats and adjacent tidal wetlands. Usually semi-enclosed by land with open, partly obstructed, or sporadic ocean access, with ocean derived water at least occasionally diluted by freshwater land runoff. The upstream and landward limit is where ocean-derived salts measure ˂ .5 ppt during average annual low flow. The seaward limit is: 1) an imaginary line closing the mouth of a river, bay, or sound; and 2) the seaward limit of wetland emergents, shrubs, or trees when not included in 1).",
    FNFW: "Herbaceous or shrubby palustrine communities in floodplains or depressions; canopy trees, if present, very sparse and often stunted.",
    PFDP: "Mesic pine woodland or mesic shrubland on flat sandy or limestone substrates, often with a hard pan that impedes drainage.",
    HPS: "Hills with mesic or xeric woodlands or shrublands; canopy, if present, open and consisting of pine or a mixture of pine and deciduous hardwoods.",
    M: "Open ocean over the continental shelf, and coastline exposed to waves and currents of the open ocean shoreward to: 1) extreme high water of spring tides; 2) seaward limit of wetland emergents, trees, or shrubs; or 3) seaward limit of the estuarine system, other than vegetation. Salinities exceed 30 parts per thousand (ppt). Includes reef/hardbottom, submersed aquatic vegetation, and unconsolidated sediment habitats.",
    WL2: "Landscapes where production of market goods and ecosystem services are mutually reinforcing, such as private agricultural land (High Intensity: Agriculture, Improved Pasture, etc.).",
    HFU: "Mesic or xeric forest dominated mainly by hardwood trees.",
    FA: "Natural rivers and streams where stream flow, morphometry, and water chemistry are not substantially modified by human activities, or native biota are dominant. Natural inland lakes and ponds where the trophic state, morphometry, and water chemistry are not substantially modified by human activities, or native biota are dominant.",
    WL1: "Landscapes where production of market goods and ecosystem services are mutually reinforcing, such as private agricultural land (Low Intensity: Timberland, Unimproved Pasture, etc.).",
    FFW: "Floodplain or depression wetlands dominated by hydrophytic trees.",
    CU: "Mesic or xeric communities restricted to barrier islands and near shore; woody or herbaceous vegetation, or other communities.",
};

var priorityResourceColors = {
    Conx: d3.rgb(215, 158, 158).toString(),
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
    CU: d3.rgb(255, 190, 190).toString(),
};

var ownershipTypes = [
    {
        type: "F",
        label: "Federal",
    },
    {
        type: "S",
        label: "State",
    },
    {
        type: "L",
        label: "Local",
    },
    {
        type: "P",
        label: "Private Conserved Land",
    },
];

// in sorted order
var landUseLabels = {
    10: "Natural Upland",
    20: "Wetland",
    30: "Freshwater Aquatic",
    60: "Marine",
    70: "Rural - High Intensity",
    80: "Rural - Low Intensity",
    85: "Tree Plantations",
    90: "Developed / Altered",
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
    90: d3.rgb(165, 165, 165).toString(),
};

var landUseTooltips = {
    10: "Includes all upland natural communities and landcover types included in the CLC. (e.g. Sandhill, Dry Prairie, Coastal Strand, Rockland Hammock, etc.).",
    20: "Includes all herbaceous/shrub freshwater wetland communities and landcover types (e.g. Marshes, Mixed Shrub/Scrub Wetland, Floating/Emergent Aquatic Vegetation, Non-vegetated Wetland, etc.), all woody freshwater wetland communities and landcover types in the CLC (e.g. Hydric Hammock, Basin Swamp, Cypress, Wet Flatwoods, etc.), and all brackish aquatic communities and landcover types in the CLC (e.g. Tidal Flat, Mangrove Swamp, Salt Marsh, Oyster Bar, etc.).",
    30: "Includes all open freshwater communities and landcover types in the CLC. (e.g. Spring-run Stream,  Riverine, Sinkhole Lake, Coastal Dune Lake, etc.).",
    60: "Consists of the marine landcover classification in the CLC.",
    70: "Includes all high-intensity agriculture and other rural landcover practices in the CLC. (e.g. Croplands/Pasture, Orchards/Groves, Citrus, Improved Pasture, etc.).",
    80: "Includes all low-intensity rural landcover practices (excluding timber) in the CLC. (e.g. Rural Open, Unimproved/Woodland Pasture, etc.).",
    85: "Includes all tree plantations and timber related landcover practices in the CLC. (e.g. Coniferous Plantations, Hardwood Plantations, etc.).",
    90: "Includes all urban and highly developed landcover types in the CLC. (e.g. Transportation, Extractive, High Intensity Urban, Low Intensity Urban, etc.).",
};

var partnerLabels = {
    llp_conp:
        "Longleaf Pine Ecosystem Geodatabase Protection Priorities|https://www.fdacs.gov/Forest-Wildfire/Our-Forests/The-Florida-Longleaf-Pine-Ecosystem-Geodatabase",
    tnc_a: "The Nature Conservancy Ecoregional Priority Areas|http://www.landscope.org/focus/understand/tnc_portfolio/",
    gcconvis:
        "Land Conservation Vision for the Gulf of Mexico Region|http://gulfpartnership.org/index.php/site/issue/strategic-conservation",
    salcc: "South Atlantic LCC Conservation Blueprint|http://www.southatlanticlcc.org/blueprint/",
    acjv: "Atlantic Coast Joint Venture|http://acjv.org/planning/bird-conservation-regions/sambi/",
    epaprishd:
        "Environmental Protection Agency Priority Watersheds|http://nepis.epa.gov/Exe/ZyNET.exe/P100BF0Q.TXT?ZyActionD=ZyDocument&Client=EPA&Index=2011+Thru+2015&Docs=&Query=&Time=&EndTime=&SearchMethod=1&TocRestrict=n&Toc=&TocEntry=&QField=&QFieldYear=&QFieldMonth=&QFieldDay=&IntQFieldOp=0&ExtQFieldOp=0&XmlQuery=&File=D%3A%5Czyfiles%5CIndex%20Data%5C11thru15%5CTxt%5C00000001%5CP100BF0Q.txt&User=ANONYMOUS&Password=anonymous&SortMethod=h%7C-&MaximumDocuments=1&FuzzyDegree=0&ImageQuality=r75g8/r75g8/x150y150g16/i425&Display=p%7Cf&DefSeekPage=x&SearchBack=ZyActionL&Back=ZyActionS&BackDesc=Results%20page&MaximumPages=1&ZyEntry=1&SeekPage=x&ZyPURL",
    tnc_r: "The Nature Conservancy Above Average Terrestrial Resilient Sites|https://www.conservationgateway.org/ConservationByGeography/NorthAmerica/UnitedStates/edc/reportsdata/terrestrial/resilience/Pages/default.aspx",
    ncbi: "National Bobwhite Conservation Initiative|http://bringbackbobwhites.org/images/stories/nbci_florida.jpg",
};
var partners = [
    "acjv",
    "epaprishd",
    "gcconvis",
    "llp_conp_",
    "salcc",
    "tnc_a",
    "tnc_r",
];

var barLabelPrefix = {
    4: "Most",
    3: "More",
    2: "Intermediate",
    1: "Less",
    0: "Least",
};

/* info for categories, ordered from first to last category */
var clipInfo = [
    "Highest conservation priorities in the Biodiversity, Landscape, or Surface Water OR high conservation priorities across all categories.",
    "High conservation priorities in Biodiversity, Landscape, or Surface Water OR moderate conservation priorities across all categories.",
    "Moderate conservation priorities in Biodiversity, Landscape, or Surface Water.",
    "Low conservation priorities in Biodiversity, Landscape or Surface Water.",
    "Lowest conservation priorities in Biodiversity, Landscape or Surface Water.",
    "Not designated as a conservation priority.",
];

var clipBioInfo = [
    "Highest conservation priorities for Strategic Habitat Conservation Areas, Vertebrate Habitat Richness, Rare Species, or Priority Natural Communities.",
    "High conservation priorities for Strategic Habitat Conservation Areas, Vertebrate Habitat Richness, Rare Species, or Priority Natural Communities.",
    "Moderate conservation priorities for Strategic Habitat Conservation Areas, Vertebrate Habitat Richness, Rare Species, or Priority Natural Communities.",
    "Lowest conservation priorities for Strategic Habitat Conservation Areas, Rare Species, or Priority Natural Communities. Low conservation priorities for Vertebrate Habitat Richness.",
    "Lowest conservation priorities for Vertebrate Habitat Richness.",
    "Not designated as a conservation priority.",
];

var clipLandInfo = [
    "High conservation priorities for Florida Ecological Greenways Network.",
    "High conservation priorities for Landscape Integrity Index.",
    "Moderate conservation priorities for Florida Ecological Greenways or Landscape Integrity Index.",
    "Low conservation priorities for Florida Ecological Greenways Network or Landscape Integrity Index.",
    "Lowest conservation priorities for Landscape Integrity Index.",
    "Not designated as a conservation priority.",
];

var clipWaterInfo = [
    "Highest conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.",
    "High conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.",
    "Moderate conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.",
    "Low conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.",
    "Lowest conservation priorities for Significant Surface Waters, Floodplains, or Wetlands.",
    "Not designated as a conservation priority.",
];
//
var clipRareSppInfo = [
    "Species models were scored by weighted Global and State rarity rank multiplied by the habitat suitability score (10-point scale).  Six priority classes were developed using class breaks along the continuum:  Priority 1 is highest and Priority 6 is the lowest.  See Appendix C of CLIP 4.0 Technical Report for further details.",
    "Species models were scored by weighted Global and State rarity rank multiplied by the habitat suitability score (10-point scale).  Six priority classes were developed using class breaks along the continuum:  Priority 1 is highest and Priority 6 is the lowest.  See Appendix C of CLIP 4.0 Technical Report for further details.",
    "Species models were scored by weighted Global and State rarity rank multiplied by the habitat suitability score (10-point scale).  Six priority classes were developed using class breaks along the continuum:  Priority 1 is highest and Priority 6 is the lowest.  See Appendix C of CLIP 4.0 Technical Report for further details.",
    "Species models were scored by weighted Global and State rarity rank multiplied by the habitat suitability score (10-point scale).  Six priority classes were developed using class breaks along the continuum:  Priority 1 is highest and Priority 6 is the lowest.  See Appendix C of CLIP 4.0 Technical Report for further details.",
    "Species models were scored by weighted Global and State rarity rank multiplied by the habitat suitability score (10-point scale).  Six priority classes were developed using class breaks along the continuum:  Priority 1 is highest and Priority 6 is the lowest.  See Appendix C of CLIP 4.0 Technical Report for further details.",
    "Species models were scored by weighted Global and State rarity rank multiplied by the habitat suitability score (10-point scale).  Six priority classes were developed using class breaks along the continuum:  Priority 1 is highest and Priority 6 is the lowest.  See Appendix C of CLIP 4.0 Technical Report for further details.",
    "Not designated as a conservation priority.",
];

var clipSHCAInfo = [
    "Strategic habitat conservation areas for species with Heritage ranks of S1 and G1-G3.",
    "Strategic habitat conservation areas for species with Heritage ranks of S1, G4-G5 or S2, G2- G3.",
    "Strategic habitat conservation areas for species with Heritage ranks of S2, G4-G5 or S3, G3.",
    "Strategic habitat conservation areas for species with Heritage ranks of S3, G4.",
    "Strategic habitat conservation areas for species with Heritage ranks of S3, G5 or S4, G4.",
    "None of the species included in the SHCA analysis fit these criteria.",
];

var clipPNCAreaInfo = [
    "Highest priority for underrepresented natural communities.",
    "High priority for underrepresented natural communities.",
    "Moderate priority for underrepresented natural communities.",
    "Low priority for underrepresented natural communities.",
    "Not designated as a conservation priority.",
];

var clipSppRichInfo = [
    "Highest priority potential habitat (8-13  SHCA vertebrate species).",
    "High priority potential habitat (7 SHCA vertebrate species).",
    "Moderate priority potential habitat (5-6 SHCA vertebrate species).",
    "Low priority potential habitat (2-4 SHCA vertebrate species).",
    "Potential habitat for (1 SHCA vertebrate species).",
    "Not designated as a conservation priority.",
];

var clipGreenwayInfo = [
    "The Florida Ecological Greenways Network was prioritized by assigning individual corridors to priority classes, based on contribution to a statewide ecological network.  Highest priorities (Priority 1) were given to areas most suitable to facilitate function ecological connectivity connecting major conservation lands throughout the state.  Updates for CLIP 4.0 were designed to address potential changes due to climate change, linking across state boundaries, and focusing on higher priority linkages.  The number of priority levels was reduced to 5.  Additional details are available in Appendix E of the CLIP 4.0 Technical Report.", // P1
    "The Florida Ecological Greenways Network was prioritized by assigning individual corridors to priority classes, based on contribution to a statewide ecological network.  Highest priorities (Priority 1) were given to areas most suitable to facilitate function ecological connectivity connecting major conservation lands throughout the state.  Updates for CLIP 4.0 were designed to address potential changes due to climate change, linking across state boundaries, and focusing on higher priority linkages.  The number of priority levels was reduced to 5.  Additional details are available in Appendix E of the CLIP 4.0 Technical Report.", // P2
    "The Florida Ecological Greenways Network was prioritized by assigning individual corridors to priority classes, based on contribution to a statewide ecological network.  Highest priorities (Priority 1) were given to areas most suitable to facilitate function ecological connectivity connecting major conservation lands throughout the state.  Updates for CLIP 4.0 were designed to address potential changes due to climate change, linking across state boundaries, and focusing on higher priority linkages.  The number of priority levels was reduced to 5.  Additional details are available in Appendix E of the CLIP 4.0 Technical Report.", // P3
    "The Florida Ecological Greenways Network was prioritized by assigning individual corridors to priority classes, based on contribution to a statewide ecological network.  Highest priorities (Priority 1) were given to areas most suitable to facilitate function ecological connectivity connecting major conservation lands throughout the state.  Updates for CLIP 4.0 were designed to address potential changes due to climate change, linking across state boundaries, and focusing on higher priority linkages.  The number of priority levels was reduced to 5.  Additional details are available in Appendix E of the CLIP 4.0 Technical Report.", // P4
    "The Florida Ecological Greenways Network was prioritized by assigning individual corridors to priority classes, based on contribution to a statewide ecological network.  Highest priorities (Priority 1) were given to areas most suitable to facilitate function ecological connectivity connecting major conservation lands throughout the state.  Updates for CLIP 4.0 were designed to address potential changes due to climate change, linking across state boundaries, and focusing on higher priority linkages.  The number of priority levels was reduced to 5.  Additional details are available in Appendix E of the CLIP 4.0 Technical Report.", // P5
    "Not designated as a conservation priority.",
];

var clipLIInfo = [
    "Landscape Integrity index was prioritized into 4 categories based on the non-weighted average of the patch score and land use intensity indices.  Priority values range from 2 to 5, with priority 2 being the highest and priority 5 being the lower.", // P2
    "Landscape Integrity index was prioritized into 4 categories based on the non-weighted average of the patch score and land use intensity indices.  Priority values range from 2 to 5, with priority 2 being the highest and priority 5 being the lower.", // P3
    "Landscape Integrity index was prioritized into 4 categories based on the non-weighted average of the patch score and land use intensity indices.  Priority values range from 2 to 5, with priority 2 being the highest and priority 5 being the lower.", // P4
    "Landscape Integrity index was prioritized into 4 categories based on the non-weighted average of the patch score and land use intensity indices.  Priority values range from 2 to 5, with priority 2 being the highest and priority 5 being the lower.", // P5
    "Not designated as a conservation priority.",
];

var clipSigSurfWaterInfo = [
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "The Significant Surface Waters model is a combination of seven water resource submodels:  Special Outstanding Florida Water (OFW) rivers as defined by DEP, Other OFWs (on conservation lands), OFW lakes and Aquatic Preserves, coastal surface waters, the Florida Keys, springs, and rare fish basins.  For each resource category, drainage basins that contributed to the resource were selected and buffers to water bodies applied.  The final model was grouped into seven priority levels:  Priority 1 is the highest level and Priority 7 is the lowest.  See Appendix A of CLIP 4.0 Technical Report for further details.",
    "Not designated as a conservation priority.",
];

var clipNatFldInfo = [
    "The Natural Floodplain data layer was prioritized using the Land Use Intensity Index as used in the Landscape Integrity Layer and by FNAI Potential Natural Areas. CLIP 4.0 natural floodplain corresponds to FNAI’s Florida Forever Conservation Needs Assessment Functional Wetlands layer v. 4.1. The highest priority areas, with the greatest statewide significance for protection of natural floodplain, are in the Priority 1 level and the lowest priority areas are assigned Priority 6.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The Natural Floodplain data layer was prioritized using the Land Use Intensity Index as used in the Landscape Integrity Layer and by FNAI Potential Natural Areas. CLIP 4.0 natural floodplain corresponds to FNAI’s Florida Forever Conservation Needs Assessment Functional Wetlands layer v. 4.1. The highest priority areas, with the greatest statewide significance for protection of natural floodplain, are in the Priority 1 level and the lowest priority areas are assigned Priority 6.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The Natural Floodplain data layer was prioritized using the Land Use Intensity Index as used in the Landscape Integrity Layer and by FNAI Potential Natural Areas. CLIP 4.0 natural floodplain corresponds to FNAI’s Florida Forever Conservation Needs Assessment Functional Wetlands layer v. 4.1. The highest priority areas, with the greatest statewide significance for protection of natural floodplain, are in the Priority 1 level and the lowest priority areas are assigned Priority 6.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The Natural Floodplain data layer was prioritized using the Land Use Intensity Index as used in the Landscape Integrity Layer and by FNAI Potential Natural Areas. CLIP 4.0 natural floodplain corresponds to FNAI’s Florida Forever Conservation Needs Assessment Functional Wetlands layer v. 4.1. The highest priority areas, with the greatest statewide significance for protection of natural floodplain, are in the Priority 1 level and the lowest priority areas are assigned Priority 6.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The Natural Floodplain data layer was prioritized using the Land Use Intensity Index as used in the Landscape Integrity Layer and by FNAI Potential Natural Areas. CLIP 4.0 natural floodplain corresponds to FNAI’s Florida Forever Conservation Needs Assessment Functional Wetlands layer v. 4.1. The highest priority areas, with the greatest statewide significance for protection of natural floodplain, are in the Priority 1 level and the lowest priority areas are assigned Priority 6.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The Natural Floodplain data layer was prioritized using the Land Use Intensity Index as used in the Landscape Integrity Layer and by FNAI Potential Natural Areas. CLIP 4.0 natural floodplain corresponds to FNAI’s Florida Forever Conservation Needs Assessment Functional Wetlands layer v. 4.1. The highest priority areas, with the greatest statewide significance for protection of natural floodplain, are in the Priority 1 level and the lowest priority areas are assigned Priority 6.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "Not designated as a conservation priority.",
];

var clipWetlandsInfo = [
    "The wetlands layer was assigned priorities based on natural quality using a Land Use Intensity index (LUI) and the FNAI Potential Natural Areas (PNA).  Combinations of these two indices were used to assign Priority level 1 through 6 to wetlands, with Priority 1 being the highest and Priority 6 being the lowest.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The wetlands layer was assigned priorities based on natural quality using a Land Use Intensity index (LUI) and the FNAI Potential Natural Areas (PNA).  Combinations of these two indices were used to assign Priority level 1 through 6 to wetlands, with Priority 1 being the highest and Priority 6 being the lowest.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The wetlands layer was assigned priorities based on natural quality using a Land Use Intensity index (LUI) and the FNAI Potential Natural Areas (PNA).  Combinations of these two indices were used to assign Priority level 1 through 6 to wetlands, with Priority 1 being the highest and Priority 6 being the lowest.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The wetlands layer was assigned priorities based on natural quality using a Land Use Intensity index (LUI) and the FNAI Potential Natural Areas (PNA).  Combinations of these two indices were used to assign Priority level 1 through 6 to wetlands, with Priority 1 being the highest and Priority 6 being the lowest.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The wetlands layer was assigned priorities based on natural quality using a Land Use Intensity index (LUI) and the FNAI Potential Natural Areas (PNA).  Combinations of these two indices were used to assign Priority level 1 through 6 to wetlands, with Priority 1 being the highest and Priority 6 being the lowest.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "The wetlands layer was assigned priorities based on natural quality using a Land Use Intensity index (LUI) and the FNAI Potential Natural Areas (PNA).  Combinations of these two indices were used to assign Priority level 1 through 6 to wetlands, with Priority 1 being the highest and Priority 6 being the lowest.  See CLIP 4.0 technical report and the Florida Forever Conservation Needs Assessment Report for further details.",
    "Not designated as a conservation priority.",
];

var aquiferInfo = [
    "Highest recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.",
    "Highest recharge areas that do not overlap; OR high recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.",
    "High recharge areas that do not overlap; OR moderate recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.",
    "Moderate recharge areas that do not overlap; OR moderately low recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.",
    "Moderately low recharge areas that do not overlap; OR low recharge areas that overlap with either Spring Protection Areas and/or public water supply buffers.",
    "Low recharge areas that do not overlap with Springs Protection Areas, public water supply buffers, and/or swallets.",
    "Not designated as a conservation priority.",
];

var landOwnershipInfo = [
    "Lands owned by a federal agency.",
    "Lands owned by a state agency.",
    "Lands owned by a local agency.",
    "Lands recorded as privately conserved.",
    "Areas not owned by federal, state, or local agencies, and not recorded as private conserved land.",
];

/* The following are used for saving and recovering the state of the page */
var filterCategories = {
    "FilterChart-priority": "p",
    "FilterChart-clip": "p",
    "FilterChart-bio": "p",
    "FilterChart-land": "p",
    "FilterChart-water": "p",
    "FilterChart-slr": "t",
    "FilterChart-dev": "t",
};

var slrRadioOrder = ["slr1", "slr2", "slr3"];
var devRadioOrder = ["devCur", "dev2020", "dev2040", "dev2060"];

var legendSubheading = {
    priority: {
        priority: "% of watershed covered by combined conservation assets",
        default: "% of watershed covered by Priority 1 and 2",
    },
    slr: "% of watershed inundated",
    dev: "% of watershed with urban / suburban development",
};

// Conservation Opportunities
var COconfig = {
    FSP: {
        label: "Forest Stewardship Program (FL Forest Service, FL Fish & Wildlife Cons. Comm.)",
        group: "All Forests",
        url: "http://floridalandsteward.org/contacts.html",
    },

    SBMP: {
        label: "FL Forest Service - Silviculture BMPs",
        group: "All Forests",
        url: "https://www.fdacs.gov/Forest-Wildfire/Silviculture-Best-Management-Practices",
    },
    SPBP: {
        label: "Southern Pine Beetle Prevention Program",
        group: "All Pine",
        url: "https://www.fdacs.gov/Forest-Wildfire/For-Landowners/Programs-for-Landowners/Southern-Pine-Beetle-Prevention",
    },
    FL_USFS: {
        label: "Longleaf Pine Landowner Incentive Program",
        group: "Longleaf Pine / Upland Pine",
        url: "https://www.fdacs.gov/Forest-Wildfire/For-Landowners/Programs-for-Landowners/Longleaf-Pine-Private-Landowner-Incentive-Program",
    },
    LLP_Focus_Area: {
        label: "Partners for Fish & Wildlife - Longleaf Pine/Groundcover Restoration",
        group: "Longleaf Pine / Upland Pine",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
    },
    NRCS: {
        label: "Working Lands for Wildlife - Environmental Quality Incentives Program",
        group: "Longleaf Pine / Upland Pine",
        url: "https://www.nrcs.usda.gov/wps/portal/nrcs/detail/fl/programs/landscape/?cid=stelprdb1266008",
    },
    sandhill: {
        label: "Sandhill / Upland Pine Species",
        group: "Longleaf Pine / Upland Pine",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true, // if true, use the field value as the link text, and this label as the subheading
    },
    wetland: {
        label: "Ephemeral Wetland Species",
        group: "Longleaf Pine / Upland Pine",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    scrubrestore: {
        label: "Partners for Fish & Wildlife - Scrub Restoration/Listed Plant Recovery",
        group: "Scrub and Scrubby Flatwoods",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
    },
    scrubspp: {
        label: "Scrub Species",
        group: "Scrub and Scrubby Flatwoods",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    dryprairierestore: {
        label: "Partners for Fish and Wildlife - Dry Prairie Restoration",
        group: "Dry Prairie and South Florida Slash Pine",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
    },
    dryprairiespps: {
        label: "Dry Prairie Species",
        group: "Dry Prairie and South Florida Slash Pine",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    aquaticrestore: {
        label: "Partners for Fish & Wildlife - Stream/Riparian Restoration",
        group: "Riparian and Streams",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
    },
    aquaticspps: {
        label: "Aquatic Species",
        group: "Riparian and Streams",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
    },
    BMPs: {
        label: "Department of Agriculture and Consumer Services Best Management Practices",
        group: "All Working Lands",
        url: "https://www.fdacs.gov/Agriculture-Industry/Water/Agricultural-Best-Management-Practices",
    },
    WLFWGT: {
        label: "NRCS Environmental Quality Incentives Program",
        group: "All Working Lands",
        url: "https://www.nrcs.usda.gov/wps/portal/nrcs/main/fl/programs/financial/eqip/",
    },
    partnersfw: {
        label: "Partners for Fish and Wildlife",
        group: "All Working Lands",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    forestedwetland: {
        label: "Forested Wetland",
        group: "Wetlands",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    nonforestedwetland: {
        label: "Non-Forested Wetland",
        group: "Wetlands",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    springs: {
        label: "Spring and Aquatic Cave Species",
        group: "Springs and Aquatic Caves",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    pinerockland: {
        label: "Pine Rockland",
        group: "Pine Rockland",
        url: "https://www.fws.gov/northflorida/Partners/index.html",
        fieldLabel: true,
    },
    // New fields provided by FWC on 5/19/2021
    FLWBMP: {
        label: "Florida Forestry Wildlife Best Management Practices",
        group: "All Forests",
        url: "https://www.fdacs.gov/Forest-Wildfire/Silviculture-Best-Management-Practices/Florida-Forestry-Wildlife-Best-Management-Practices-for-State-Imperiled-Species",
    },
    NFLPBA: {
        label: "North Florida Prescribed Burn Association",
        group: "All Forests",
        url: "http://www.northfloridapba.org/",
    },
    FWCLAP: {
        label: "Florida Fish and Wildlife Conservation Commission Landowner Assistance Program",
        group: "All Working Lands",
        url: "https://myfwc.com/conservation/special-initiatives/lap/",
    },
    AGBMP: {
        label: "Agriculture Wildlife Best Management Practices for State Imperiled Species",
        group: "All Working Lands",
        url: "https://www.fdacs.gov/content/download/61100/file/WildlifeBMP_final.pdf",
    },
    RFLP: {
        label: "Rural and Family Lands Protection Program",
        group: "All Working Lands",
        url: "https://www.fdacs.gov/Consumer-Resources/Protect-Our-Environment/Rural-and-Family-Lands-Protection-Program",
    },
    NRCSSP: {
        label: "USDA/NRCS Conservation Stewardship Program",
        group: "All Working Lands",
        url: "https://www.nrcs.usda.gov/wps/portal/nrcs/main/national/programs/financial/csp/",
    },
    NRCSCEP: {
        label: "USDA/NRCS Agricultural Conservation Easement Program",
        group: "All Working Lands",
        url: "https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/programs/easements/acep/?cid=stelprdb1242695",
    },
};
