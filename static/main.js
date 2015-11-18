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
var colors = ['#ffffcc','#c2e699','#78c679','#31a354','#006837'];
function filterColors(){ return '#9ecae1' }
var transparency = 25;  //on 0-100% scale

//var filterColors = {
//    'bio': function(){ return '#006837' },
//    'clip': function(){ return '#006837' },
//    'land': function(){ return '#006837' },
//    'water': function(){ return '#9ecae1' },
//}


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
    zoom: 7,
    maxZoom: 12,
    center: [27.84, -86.02]
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
            //scales[d] = d3.scale.quantile().range(classes).domain(values);  //d3.scale.quantile().range((d != 'land')? classes: d3.range(3)).domain(values);
            scales[d] = d3.scale.threshold().domain([20, 40, 60, 80, 101]).range([0, 1, 2, 3, 4]);
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

        container.append('h5').text(fieldLabels[d]);
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




function selectUnit(id) {
    console.log('select ', id);
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





