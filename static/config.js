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
    //devCur: 'Existing Urban Area',
    //dev2020: 'Projected Development (2020)',
    //dev2040: 'Projected Development (2040)',
    //dev2060: 'Projected Development (2060)',

    slr: 'Projected Sea Level Rise',
    slr1: '1 meter',
    slr2: '2 meters',
    slr3: '3 meters'
    //slr1: 'Projected Sea Level Rise (1m)',
    //slr2: 'Projected Sea Level Rise (2m)',
    //slr3: 'Projected Sea Level Rise (3m)'
};


var priorityLabels = ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];
var priorityLabels4 = priorityLabels.slice(0, 4).concat(priorityLabels[5]);


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
    GTORT: 'http://myfwc.com/wildlifehabitats/profiles/reptiles-and-amphibians/reptiles/gopher-tortoise/'
};

// subsets of the species into taxa
var birds = ['COHA', 'GSHP', 'LOUSP', 'MACSP', 'MACU', 'OWL', 'PLOVR', 'SCRJY', 'SCTSP', 'SNKIT', 'STHA', 'STKI', 'WCPI']; //TODO:


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