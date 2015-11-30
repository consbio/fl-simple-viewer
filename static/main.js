var pageLoadStart = new Date().getTime();

var zoomOpacityScale = d3.scale.linear().domain([5,12]).range([1, 0.35]);
var features, data;
var summaryFields = ['priority', 'clip', 'bio', 'land', 'water'];
var selectedField = 'priority';
var scales = {};
var numClasses = 5;
var index = d3.map();
var featureIndex = d3.map();
var visibleFeatures = d3.map();
var cf = null;
var dimensions = {};
var fieldLabels = {
    'bio': 'Biodiversity',
    'clip': 'Overal CLIP',
    'land': 'Landscape',
    'priority': 'PFLCC Priority Resources',
    'water': 'Surface Water'
};
var barHeight = 20;
var chartWidth = 440;
var colors = ['#ffffcc','#c2e699','#78c679','#31a354','#006837'];  //lowest to hightest
function filterColors(){ return '#9ecae1' }
var transparency = 25;  //on 0-100% scale
var featureCache = {};
var pendingRequest = null;
var featuresURL = 'features/';


//var filterColors = {
//    'bio': function(){ return '#006837' },
//    'clip': function(){ return '#006837' },
//    'land': function(){ return '#006837' },
//    'water': function(){ return '#9ecae1' },
//}


//config of data
priorityLabels = ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];

// common name|priority
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
    COHA: "Cooper's Hawk|4",   //differs between report and attribute table
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
    GSMS: "Gulf Salt Marsh Snake|3",  //differs between report and attribute table
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
    MACU: "Mangrove Cuckoo|4",   //differs between report and attribute table
    NEWT: "Striped Newt|2",
    OWL: "Florida Burrowing Owl|3",
    PABU: "Painted Bunting|",
    PANT: "Florida Panther|1",
    PANTHER: "Florida Panther|1",
    PBTF: "Pine Barrens Tree Frog|3",  //differs between report and attribute table
    PBTFROG: "Pine Barrens Tree Frog|3",   //differs between report and attribute table
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
    SRRAT: "Silver Rice Rat|1",  //differs in report vs attribute table (occurs in P1 & P2) //
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


/* DOM interactions powered by D3 */
/******* Tabs *********/

d3.selectAll('.tabs li').on('click', function() {
    selectTab(d3.select(this));
});
function selectTab(node){
    var id = node.attr('data-tab');
    d3.select(node.node().parentNode).selectAll('li.active').classed('active', false);
    node.classed('active', true);
    d3.select(node.node().parentNode.parentNode).selectAll('.tab').classed('hidden', function(d){
        return d3.select(this).attr('id') != id;
    });
}

/******* Open / Close buttons *********/
d3.selectAll('.button-open').on('click', function() {
    d3.select('#' + d3.select(this).attr('data-target')).classed('hidden', false);
});
d3.selectAll('.button-close').on('click', function() {
    d3.select('#' + d3.select(this).attr('data-target')).classed('hidden', true);
});




/******* Map Configuration *********/
var basemaps = {
    'ESRI Topo': L.tileLayer('//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        subdomains: ['server', 'services']
    }),
    'ESRI Gray': L.tileLayer('//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
        subdomains: ['server', 'services']
    }),
    'ESRI Imagery': L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    'ESRI - National Geographic': L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
        maxZoom: 16
    }),
    'ESRI Ocean': L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom: 13
    }),
    'ESRI Streets': L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    }),
    'Stamen Watercolor': L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 16,
        ext: 'png'
    }),
    'Mapbox Light': L.tileLayer('http://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1IjoiYmN3YXJkIiwiYSI6InJ5NzUxQzAifQ.CVyzbyOpnStfYUQ_6r8AgQ'
    }),
    'Mapbox Satellite': L.tileLayer('http://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        id: 'mapbox.streets-satellite',
        accessToken: 'pk.eyJ1IjoiYmN3YXJkIiwiYSI6InJ5NzUxQzAifQ.CVyzbyOpnStfYUQ_6r8AgQ'
    })
};

map = L.map('Map', {
    layers: [basemaps['ESRI Topo']],
    //zoom: 7,
    maxZoom: 12,
    //center: [27.84, -86.02]
    center: [30.86, -87.51],
    zoom: 11
});
map.zoomControl.setPosition('topright');
map.addControl(L.control.zoomBox({modal: false, position:'topright'}));
map.addControl(L.control.geonames({username: 'cbi.test', position:'topright'}));

// Legend is setup as a control to coordinate layout within Leaflet
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    this._container = L.DomUtil.get('Legend');
    if (!L.Browser.touch) {
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.on(this._container, 'mousewheel', L.DomEvent.stopPropagation);
    } else {
        L.DomEvent.on(this._container, 'click', L.DomEvent.stopPropagation);
    }
    return this._container;
};
legend.addTo(map);

map.addControl(L.control.layers(basemaps, null, {position: 'bottomright'}));
d3.select('.leaflet-control-layers-toggle').html('<i class="fa fa-globe"></i> basemaps');


omnivore.topojson('static/features.json')
    .on('ready', function(){
        this.getLayers().forEach(function(feature){
            feature.options.smoothFactor = 0.5;  //needed to prevent slivers
            feature.on('click', function (e) {
                selectUnit(e.target.feature.id);
            });
            var id = feature.feature.id;
            featureIndex.set(id, feature);
            visibleFeatures.set(id, true);
        });
        this.addTo(map);
        features = this;

        onLoad();
        console.log('loaded boundary by',new Date().getTime() - pageLoadStart, 'ms');
    });


d3.csv('static/summary.csv',
    function(row){
        try {
            castFields(row, ['id']);
            index.set(row.id, row);
        }
        catch (ex){
            console.error(ex);
        }

        return row;
    },
    function(rows){
        data = rows;

        var classes = d3.range(numClasses);
        // TODO: tune these loops
        summaryFields.forEach(function(d){
            var values = rows.map(function(r){ return r[d] });
            scales[d] = d3.scale.quantile().range(classes).domain(values);  //d3.scale.quantile().range((d != 'land')? classes: d3.range(3)).domain(values);
            //scales[d] = d3.scale.threshold().domain([20, 40, 60, 80, 101]).range([0, 1, 2, 3, 4]);
            rows.forEach(function(r) {
                r[d + '_q'] = scales[d](r[d]);
            });
        });

        cf = crossfilter(rows);
        dimensions.id = cf.dimension(function(r){ return r['id']});
        summaryFields.forEach(function(d){
            dimensions[d] = cf.dimension(function(r){ return r[d + '_q']});
        });


        onLoad();
        console.log('loaded csv by',new Date().getTime() - pageLoadStart, 'ms');
    }
);

// Use lodash to call load function after 2 prior async requests are complete
var onLoad = _.after(2, load);
function load() {
    setSelectedField(selectedField);

    d3.select('#Filter').selectAll('div')
    .data(summaryFields).enter()
    .append('div')
    .each(function(d){
        var container = d3.select(this);

        container.append('h4').text(fieldLabels[d]);
        var chartNode = container.append('div').classed('chart', true);
        chartNode.append('div')
            .append('div')
            .classed('reset small', true)
            .style('display', 'none')
            .text('reset')
            .on('click', handleChartReset);
        container.append('div').classed('small quiet center', true).text('number of watersheds');

        var labels = barLabels(scales[d]);
        createCountChart(chartNode, dimensions[d], {
            barHeight: barHeight,
            colors: filterColors,
            label: function(g) { return labels[g.key]},
            onFilter: updateMap,
            width: chartWidth,
            ordering: function(d) { return -d.key }
        });

    });


}



function updateMap() {
    var visibleIDs = d3.set(dimensions.id.top(Infinity).map(function (d) { return d.id }));
    console.log(visibleIDs.size() + ' now visible');
    featureIndex.keys().forEach(function(id){
        var wasVisible = visibleFeatures.get(id);
        var isVisible = visibleIDs.has(id);
        if (isVisible != wasVisible) {
            d3.select(featureIndex.get(id)._path).classed('hidden', !isVisible);
            visibleFeatures.set(id, isVisible);
        }
    })
}


// reset handler
function handleChartReset() {
    var chartNode = d3.select(this).node().parentNode.parentNode;
    console.log('chart node', chartNode)
    var chart = _.find(dc.chartRegistry.list(), function(d){
        return d.root().node() == chartNode});
    chart.filterAll();
    chart.redrawGroup();  // for whatever reason, this is not done automatically
}


d3.select('#LayerSelect').on('click', function(){
    setSelectedField(d3.select('#LayerSelect').property('value'));
});

d3.select('#Legend input').on('change', function(){
    var value = d3.select('#Legend input').property('value') * 100;
    d3.select('.leaflet-overlay-pane')
        .classed('t_' + transparency, false)
        .classed('t_' + value, true);
    transparency = value;
});

function setSelectedField(field) {
    selectedField = field;
    features.getLayers().forEach(function(feature){
        var record = index.get(feature.feature.id);
        feature.setStyle({
            fillColor: colors[record[selectedField + '_q']]
        });
    });

    var legendNode = d3.select('#Legend > div');
    legendNode.html('');
    var labels = barLabels(scales[selectedField]);
    legendNode.selectAll('div')
        .data(scales.clip.range().slice().reverse())
        .enter()
        .append('div')
        .each(function(d){
            var node = d3.select(this);
            node.append('div')
                .classed('colorpatch', true)
                .style('background', function(d){return colors[d]});
            node.append('div')
                .text(labels[d]);

        });



}



function selectUnit(id){
    console.log('select ', id);
    selectTab(d3.select('#Nav li[data-tab="Details"]'));
    d3.select('#Details > h2').classed('hidden', true);

    if (pendingRequest != null) {
        pendingRequest.abort();
    }

    if (featureCache[id] != null){
        //d3.select('#DetailsLoadingScrim').classed('hidden', true);
        d3.select('#DetailsContainer').classed('hidden', false);
        showDetails(id);
    }
    else {
        // TODO: do this in a timeout to prevent jitter
        //d3.select('#DetailsLoadingScrim').classed('hidden', false);
        //d3.select('#DetailsContainer').classed('hidden', true);

        pendingRequest = d3.json(featuresURL + id + '.json', function (r) {
            if (r == null || r == undefined) { return }  //should handle case where no data is available
            pendingRequest = null;
            featureCache[id] = r;
            selectUnit(id);
        });
    }
}


function showDetails(id) {
    console.log('show details');
    var record = index.get('id');
    var details = featureCache[id];
    console.log(details);

    d3.selectAll('path.selected').classed('selected', false);

    var feature = featureIndex.get(id);
    feature.bringToFront();
    var path = d3.select(feature._path)
    path.classed('selected', true);

    d3.select('#Unit').text(id);
    d3.select('#UnitArea').text(d3.format(',')(details.hectares));

    //var priorityColors = colors.slice().reverse();
    //priorityColors.push(['#EEE']);  //TODO: should probably be at top

    //var priorityColors = ["#006837", "#31a354", "#78c679", "#c2e699", "#ffffcc", '#EEE']; //green
    var priorityColors = ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff", '#ffffcc']; //blue
    var priorityLabels4 = priorityLabels.slice(0, 4);
    priorityLabels4.push(priorityLabels[5]);
    var priorityColors4 = priorityColors.slice(0, 4);
    priorityColors4.push(priorityColors[5]);


    var priorityData = [];
    details.clip.forEach(function(d, i){
            if (d > 0){
                priorityData.push({
                    label: priorityLabels[i],
                    percent: d,
                    color: priorityColors[i]
                });
            }
        });
    createPieChart(priorityData, d3.select("#CLIP_PieChart"), "200px", "200px");

    createHorizBarChart(d3.select('#CLIP_Chart'), details.clip, priorityLabels, priorityColors, '%');
    createHorizBarChart(d3.select('#Bio_Chart'), details.bio, priorityLabels, priorityColors, '%');
    createHorizBarChart(d3.select('#BioRareSpp_Chart'), details.bio_rare_spp, priorityLabels4, priorityColors4, '%');
    createHorizBarChart(d3.select('#BioSHCA_Chart'), details.bio_shca, priorityLabels4, priorityColors4, '%');

    var tableNode = d3.select('#BioSHCATable');
    tableNode.html('');
    //var groups = {};
    //d3.keys(details.bio_spp_rich2).forEach(function(d){
    //    var group = species[d].split('|')[1] || 0;
    //    if (groups[group] == null){
    //        groups[group] = {};
    //    }
    //    groups[group][d] = details.bio_spp_rich2[d];
    //});
    d3.range(1, 5).forEach(function(d, i){
        var values = details.bio_shca2[d];
        if (!values) return;

        tableNode.append('h5').text(priorityLabels4[i]);
        createThumbnailAreaTable(
            tableNode.append('table').attr('cellspacing', 0).append('tbody'),
            values, sppLabels, speciesLinks
        );
    });



    createHorizBarChart(d3.select('#BioPNC_Chart'), details.bio_pnc, priorityLabels4, priorityColors4, '%');
    createHorizBarChart(d3.select('#BioSppRich_Chart'), details.bio_spp_rich, priorityLabels, priorityColors, '%');

    tableNode = d3.select('#BioSppRichTable');
    tableNode.html('');
    var groups = {};
    d3.keys(details.bio_spp_rich2).forEach(function(d){
        var group = species[d].split('|')[1] || 0;
        if (groups[group] == null){
            groups[group] = {};
        }
        groups[group][d] = details.bio_spp_rich2[d];
    });
    d3.range(1, 6).concat([0]).forEach(function(d, i){
        if (groups[d] == null) return;

        tableNode.append('h5').text(priorityLabels[i]);
        createThumbnailAreaTable(
            tableNode.append('table').attr('cellspacing', 0).append('tbody'),
            groups[d], sppLabels, speciesLinks
        );
    });


    createHorizBarChart(d3.select('#Land_Chart'), details.land, priorityLabels, priorityColors, '%');
    createHorizBarChart(d3.select('#Water_Chart'), details.water, priorityLabels, priorityColors, '%');

    //if (d3.sum(details.ownership)) {
    //    createHorizBarChart(
    //        d3.select('#Owner_Chart'), details.ownership,
    //        ['Federal', 'State', 'Local', 'Private'],
    //        priorityColors.slice(0, 4),
    //        '%'
    //    );
    //}
    //else {
    //    // TODO
    //    d3.select('#Owner_Chart').html('');
    //}

}

function createHorizBarChart(node, data, labels, colors, units){
    nv.addGraph(function() {
        var chart = nv.models.multiBarHorizontalChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .barColor(colors)
            .margin({top: 0, right: 0, bottom: 0, left: 100})
            .showLegend(false)
            .showControls(false)
            .showValues(true)
            .valueFormat(function(d){
                if (Math.round(d) === d){
                    return d3.format('.0f')(d) + units;
                }
                return d3.format('.1f')(d) + units;
            })
            .showYAxis(false)
            .tooltips(false)
            .duration(0);


        chart.yAxis
            .axisLabel('Percent of Watershed')
            .tickFormat(d3.format('.0f'));

        chart.tooltip.contentGenerator(function(obj){
                return '<b>' + obj.data.label + ':</b> ' + obj.data.value + '%';
            });

        node.html('');
        node.append('svg')
            .style({height: 24 * data.length, width: '480'})
            .datum([{key:'', values: zipIntoObj(['value', 'label'], data, labels)}])
            .call(chart);

        node.selectAll('.nv-bar text').each(function(d, i){
            var node = d3.select(this);
            var x = parseFloat(node.attr('x'));
            if (x > 100){
                node.attr('x', x - 10).attr('text-anchor', 'end').style('fill-opacity', 1);
                if (i < 2) {
                    node.style('fill', '#FFF');
                }
            }
        });


        nv.utils.windowResize(chart.update);

        return chart;
      });
}

// labels in this case are an object
// TODO: probably should be handled better
function createThumbnailAreaTable(node, data, labels, links){
    node.html('');

    var keys = d3.keys(data);
    keys.sort(d3.ascending);
    var formatter = d3.format(',');

    node.selectAll('tr').data(keys).enter()
        .append('tr')
        .each(function(d, i){
            var node = d3.select(this);
            node.classed('even', i%2 == 1);

            var img = (i%2 == 1)? 'http://myfwc.com/media/88306/Eaglets_Nesting_F_TSteffer.jpg': 'http://myfwc.com/media/1389950/Cute-Tortoise.jpg';

            //node.append('td').append('img').attr('src', img);
            node.append('td')
                .html(function(d){
                    var html = labels[d];
                    if (links[d] != null) {
                        html = '<a href="' + links[d] + '" target="_blank">' + html + '</a>';
                    }
                    return html;
                })
                .classed('col-name', true);

            node.append('td')
                .text(function(d){ return formatter(data[d]) + ' ha' })
                .classed('col-area', true);
        });
}






var intFormatter = d3.format('.0f');
function barLabels(scale) {
    var numBins = scale.range().length;
    return scale.range().map(function(d, i){
        var invert = scale.invertExtent(d);
        var first = intFormatter(invert[0]);
        var last = intFormatter(invert[1]);
        if (invert[1] === 0) { return '0%' }
        if (i === 0 || invert[0] == 0){ return 'less than ' + last + '%' }
        if (i === numBins - 1){ return 'at least ' + first + '%' }
        last--;
        return first + " to " + last + '%';
    });
}


//data needs value, label, color, and percent
function createPieChart(data, node, width, height){
    node.html('');

    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .margin({top: 0, right: 0, bottom: 0, left: 0})
            .x(function(d) { return d.label })
            .y(function(d) { return d.percent })
            .showLegend(false)
            .showLabels(false)
            .color(data.map(function(d){return d.color}))
            .valueFormat(function(d){return d3.format('.0f')(d) + '%'})
            .width(width)
            .height(height);

        node.append('svg')
            .classed('inline-middle', true)
            .style({
                width: width,
                height: height
            })
            .datum(data)
            .call(chart);

        //var sortedData = data.slice();
        //sortedData.sort(function(a, b){return a.percent < b.percent});
        node.append('ul')
            .classed('inline-middle legend', true)
            .selectAll('li')
            .data(data)
            .enter().append('li')
            .classed('legendElement small', true)
            .each(function(d){
                var node = d3.select(this);
                node.append('div').classed('inline-top', true).style('background', d.color);
                var percentLabel = ((d.percent >= 1)? Math.round(d.percent): '< 1') + '%';
                var label = '<b>' + percentLabel + ' ' + d.label;
                if (d.value != null){
                    label += '</b><br/>(' + formatNumber(d.value) + ' acres)';
                }
                node.append('div').classed('inline-top', true).html(label);
                if (d.tooltip){
                    node.attr('title', d.tooltip);
                }
            });

        return chart;
    });
}




function createCountChart(node, dimension, options){
    options = _.merge({
        width: node.style('width').replace('px', '') || 200,
        barHeight: 20,
        renderTitle: false,
        xTicks: 4,
        group: dimension.group().reduceCount()
        // colors: function that returns colors
        // label: function that returns labels, gets {key, value} as input
        // onFilter: function to callback when filter is (un)applied
        // other options applied directly to the chart object
    }, options);

    if (options.title) {
        options.renderTitle = true;
    }

    var chart = dc.rowChart(node.node());
    var values = options.group.all().map(function(d){return d.key; });
    var height = values.length * options.barHeight + 30;

    chart
        //.width(options.width)  // set below
        .height(height)
        .margins({
            top: 0,
            right: 10,
            bottom: 20,
            left: 10
        })
        .dimension(dimension)
        .group(options.group)
        .elasticX(true)
        .xAxis().ticks(options.xTicks);

    d3.keys(options).forEach(function(d){
        if (chart[d]) {
            chart[d](options[d]);
        }
    });

    if (options.xTickFormatter) {
        chart.xAxis().tickFormat(options.xTickFormatter);
    }

    if (options.onFilter){
        chart.on('filtered', options.onFilter);
    }

    chart.render();
    return chart;
}





