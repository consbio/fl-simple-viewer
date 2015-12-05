var summaryFields = ['priority', 'clip', 'bio', 'land', 'water'];
var selectedField = 'priority';

var fieldLabels = {
    'bio': 'CLIP Biodiversity',
    'clip': 'Overall CLIP',
    'land': 'CLIP Landscape',
    'priority': 'PFLCC DRAFT Priority Resources',
    'water': 'CLIP Surface Water'
};


priorityLabels = ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];

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


