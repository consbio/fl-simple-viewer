var pageLoadStart = new Date().getTime();

var zoomOpacityScale = d3.scale.linear().domain([5,12]).range([1, 0.35]);
var features, data;
var scales = {};
var numClasses = 5;
var index = d3.map();
var featureIndex = d3.map();
var visibleFeatures = d3.map();
var cf = null;
var cfs = {};
var dimensions = {};
var idDimensions = [];
var barHeight = 20;
var chartWidth = 420;
function filterColors(){ return '#9ecae1' }
var transparency = 25;  //on 0-100% scale
var featureCache = {};
var pendingRequest = null;
var featuresURL = 'features/';


// store current level of threat filters
var threatLevel = {
    slr: summaryFields['slr'][0],
    dev: summaryFields['dev'][0]
};


/* DOM interactions powered by D3 */
//TODO: these have been updated, migrate to leaflet-quickstart and dm-quickstart
/******* Tabs *********/

d3.selectAll('.tabs li').on('click', function() {
    selectTab(d3.select(this));
});
function selectTab(node){
    var id = node.attr('data-tab');
    d3.select(node.node().parentNode).selectAll('li.active').classed('active', false);
    node.classed('active', true);

    // select all tabs in same container as our target, and toggle visibility
    var parentNode = d3.select('#' + id).node().parentNode;
    d3.select(parentNode)
        .selectAll('.tab')
        .filter(function(){ return this.parentNode == parentNode })
        .classed('hidden', function(d){
            return d3.select(this).attr('id') != id;
        });
}

/******* Open / Close buttons *********/
d3.selectAll('.button-open').on('click', function() {
    var ids = d3.select(this).attr('data-target').split(' ');
    ids.forEach(function(id){
        d3.select('#' + id).classed('hidden', false);
    });
});
d3.selectAll('.button-close').on('click', function() {
    var ids = d3.select(this).attr('data-target').split(' ');
    ids.forEach(function(id){
        d3.select('#' + id).classed('hidden', true);
    });
});
d3.select('#DetailsClose').on('click', function(){
    d3.select('#MainSidebar').classed('hidden', false);
    d3.select('#MainSidebarHeader').classed('hidden', false);
    d3.select('#Details').classed('hidden', true);
    d3.select('#DetailsHeader').classed('hidden', true);
    //d3.select('#Sidebar').style('width', '470px');
});

/******** Expandos *****************/
function initExpando(section, open) {
    var header = section.select('h4');
    var container = section.select('h4 + div');

    section.classed('expandable', true)
        .classed('expanded', open);

    header.html('<i class="fa fa-caret-' + ((open)? 'down': 'right') + '"></i>' + header.html());
    if (!open){
        container.classed('hidden', true);
    }

    header.on('click', function(){
        if (section.classed('expanded')){
            container.classed('hidden', true);
            section.classed('expanded', false);
            header.select('.fa-caret-down').classed('fa-caret-down', false).classed('fa-caret-right', true);
        }
        else {
            container.classed('hidden', false);
            section.classed('expanded', true);
            header.select('.fa-caret-right').classed('fa-caret-right', false).classed('fa-caret-down', true);
        }
    })
}

d3.selectAll('section.expandable').each(function(){
    var node = d3.select(this);
    initExpando(node, node.classed('expanded'));
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
    })
};

map = L.map('Map', {
    layers: [basemaps['ESRI Topo']],
    maxZoom: 12,
    center: [27.68, -81.69],
     zoom: 7
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

        //summary data contain pre-calculated quantiles
        cf = crossfilter(rows); // TODO: exclude species
        dimensions.id = cf.dimension(function(r){ return r['id']});
        idDimensions.push('id');
        d3.keys(quantiles).forEach(function(d){
            dimensions[d] = cf.dimension(function(r){ return r[d]});
        });

        landUseTypes.forEach(function(d) {
            d = 'lu' + d;
            dimensions[d] = cf.dimension(function(r){ return r[d] })
        });

        //d3.keys(sppGroups).forEach(function(g){
        //    cfs[g] = crossfilter(rows.map(function(row){ return _.pick(row, 'id', sppGroups[g]) }));
        //    var idDimName = g + '_id';
        //    dimensions[idDimName] = cfs[g].dimension(function(r){ return r.id });
        //    idDimensions.push(idDimName);
        //
        //    sppGroups[g].forEach(function(d){
        //        dimensions[d] = cfs[g].dimension(function(r){ return r[d] })
        //    });
        //});

        onLoad();
        console.log('loaded csv by',new Date().getTime() - pageLoadStart, 'ms');
    }
);

// Use lodash to call load function after 2 prior async requests are complete
var onLoad = _.after(2, load);
function load() {
    setSelectedField(selectedField, 'priority');

    d3.select('#PriorityFilter').selectAll('div')
        .data(summaryFields.priority).enter()
        .append('div')
        .each(function(d, i){
            var container = d3.select(this).append('section');

            var header = container.append('h4')
                .classed('mapped', i == 0)
                .text(fieldLabels[d]);
            var chartContainer = container.append('div');

            initExpando(container, i <= 1);

            var subheading = (i === 0)? 'percent covered by combined priority resources': 'percent covered by Priority 1 &amp; 2';
            chartContainer.append('div')
                .classed('quiet small filter-subheading', true)
                .html(subheading);

            header.append('div')
                .classed('right', true)
                .html('<i class="fa fa-map"></i>')
                .attr('title', 'Click to show on map')
                .on('click', function(){
                    d3.event.stopPropagation();
                    setSelectedField(d, 'priority');
                    d3.select('.mapped').classed('mapped', false);
                    header.classed('mapped', true);
                });

            var chartID = 'FilterChart-' + d;
            var chartNode = chartContainer.append('div').classed('chart', true).attr('id', chartID);
            header.append('div')
                .classed('filter-reset small', true)
                .text('[clear filter]')
                .on('click', _.partial(handleChartReset, chartID));

            chartContainer.append('div').classed('small quiet center', true).text('number of watersheds');

            createFilterChart(chartNode, d, header);
        });


    //Threats
    d3.select('#ThreatsFilter').selectAll('div')
        .data(['slr', 'dev']).enter()
        .append('div')
        .each(function(d, i){
            var curLevel = summaryFields[d][0];

            var container = d3.select(this).append('section').attr('id', 'Filter-' + d);

            var header = container.append('h4').text(fieldLabels[d]);
            var chartContainer = container.append('div');

            initExpando(container, true);

            header.append('div')
                .classed('right', true)
                .html('<i class="fa fa-map"></i>')
                .attr('title', 'Click to show on map')
                .on('click', function(d){
                    d3.event.stopPropagation();
                    setSelectedField(threatLevel[d], d);
                    d3.select('.mapped').classed('mapped', false);
                    header.classed('mapped', true);
                });

            chartContainer.append('div').classed('filter-radio-container', true)
                .selectAll('span')
                .data(summaryFields[d]).enter()
                .append('span')
                .each(function(e, j){
                    var node = d3.select(this);
                    node.append('input')
                        .attr('type', 'radio')
                        .attr('name', d)
                        .property('checked', j === 0)
                        .on('click', function(level){
                            console.log('radio clicked', arguments)
                            var threat = level.slice(0, 3);
                            var curLevel = threatLevel[threat];

                            if (level === curLevel) return;

                            // reset filter and map
                            dimensions[curLevel].filterAll();
                            updateMap();

                            // recreate chart
                            var chartID = 'FilterChart-' + threat;
                            var chart = _.find(dc.chartRegistry.list(), function(d){ return d.root().node().id === chartID });
                            dc.deregisterChart(chart);  // have to deregister manually, otherwise it sticks around
                            var chartNode = d3.select(chart.root().node());
                            chartNode.empty();
                            createFilterChart(chartNode, level, header);

                            // update header and map
                            var h = d3.select('#Filter-' + threat + ' h4').classed('filtered', false);
                            if (h.classed('mapped')) {
                                setSelectedField(level, threat);
                            }

                            threatLevel[threat] = level;
                        });

                    node.append('label').text(fieldLabels[e]);
                });

            var subheading = (i === 0 )? 'percent of watershed inundated': 'percent of watershed with urban / suburban development';
            chartContainer.append('div')
                .classed('quiet small filter-subheading', true)
                .html(subheading);

            var chartID = 'FilterChart-' + d;
            var chartNode = chartContainer.append('div').classed('chart', true).attr('id', chartID);
            createFilterChart(chartNode, curLevel, header);
            header.append('div')
                .classed('filter-reset small', true)
                .text('[clear filter]')
                .on('click', _.partial(handleChartReset, chartID));

            chartContainer.append('div').classed('small quiet center', true).text('number of watersheds');
        });


    // Species
    var sppGroupsList = d3.keys(sppGroups);
    //d3.select('#SppFilter ul').selectAll('li')
    //    .data(sppGroupsList).enter()
    //    .append('li')
    //    .classed('active', function(d, i){ return i === 0} )
    //    .attr('data-tab', function(d){ return 'Filter-' + d} )
    //    .html(function(d){ return sppGroupLabels[d]})
    //    .on('click', function(d) {
    //        selectTab(d3.select(this));
    //    });

    var itemsList = d3.select('#SppFilter .slider-list');

    d3.select('#SppFilter > div').selectAll('div')
        .data(sppGroupsList).enter()
        .append('div')
        .classed('select-row', true)
        .each(function(group, i){
            var node = d3.select(this);
            node.append('label').html(sppGroupLabels[group]);
            var selector = node.append('select');
            selector.selectAll('option')
                .data(['-'].concat(sppGroups[group])).enter()
                .append('option')
                .attr('value', function(d){ return d })
                .html(function(d, i){ return (i === 0)? 'choose a species': species[d].split('|')[0]})
                .classed('quiet italic', function(d, i){ return i === 0 });

            selector.on('change', function() {
                var self = d3.select(this);
                var spp = self.property('value');
                if (spp === '-') { return }

                // TODO: remove from list and /or prevent from duplicate add
                //temporary hack
                if (dimensions[spp] != null) { return; }

                // TODO: find a nicer UI for this
                if (d3.keys(dimensions).length >= 32) {
                    alert('We are sorry, there is a limit to the number of species that you can combine.  Please remove ' +
                        'a species to make room for another');
                    return;
                }
                console.log('add spp filter', spp);

                var dimension = cf.dimension(function(d){ return d[spp] });
                dimensions[spp] = dimension;
                createSliderFilter2(itemsList.append('li').attr('id', 'Filter-' + spp), dimension, spp, species[spp].split('|')[0]);
                self.select('option[value="' + spp + '"]').property('disabled', true);
                self.property('value', '-');
            })
        });


        //.classed('tab', true)
        //.each(function(group, i) {
        //    var node = d3.select(this);
        //    node.attr('id', 'Filter-' + group);
        //
        //    if (i > 0) {
        //        node.classed('hidden', true);
        //    }
        //
        //    node.append('div')
        //        .classed('small', true)
        //        .style({
        //            margin: '0 0 14px 110px',
        //            'font-weight': 'bold'
        //        })
        //        .text('Show only watersheds with at least:');
        //
        //    // TODO: sort these alphabetically or grouped by priority class
        //    var container = node.append('div').classed('table-slider', true);
        //    container.selectAll('div').data(sppGroups[group]).enter()
        //        .append('div').classed('table-row', true)
        //        .each(function(d) {
        //            var node = d3.select(this);
        //            var dimension = dimensions[d];
        //            var label = species[d].split('|')[0];
        //            //createSliderFilter(node, dimension, group, label);
        //        });
        //});


    // Land use
    d3.select('#LandUseFilter .table-slider').selectAll('div.table-row')
    //d3.select('#LandUseFilterList').selectAll('div')
        .data(landUseTypes).enter()
        .append('div').classed('table-row', true)
        .each(function(d) {
            var node = d3.select(this);
            var dimension = dimensions['lu' + d];
            var label = landUseLabels[d];

            //createNumberSpinnerTable(node, dimension, label);
            createSliderFilter(node, dimension, null, label); //TODO: LU is in main filters for now
        });
}



function createNumberSpinnerTable(node, dimension, label) {
    var extent = [0, d3.max(_.map(dimension.group().all(), 'key'))];

    node.append('label')
        //.classed('table-cell', true)
        .text(label); // species[d].split('|')[0]

    node.append('input')
        //.classed('inline-middle', true)
        .attr('type', 'number')
        .attr('min', extent[0])
        .attr('max', extent[1])
        .attr('step', 10)
        .property('value', extent[0])
        .on('change', function(){
            var self = d3.select(this);
            var quantityNode = d3.select(self.node().parentNode).select('div');
            quantityNode.html('');
            var value = self.property('value');
            if (value < extent[0]) {
                value = extent[0];
                self.property('value', value);
            }
            if (value > extent[1]) {
                value = extent[1];
                self.property('value', value);
            }

            console.log('spinner value', value);
            if (value == 0) {
                dimension.filterAll();
            }
            else {
                //filter range from value to max
                dimension.filterRange([value, extent[1] + 1]);
                //quantityNode.text(d3.format(',')(value) + ' ha')
            }

            dc.redrawAll();
            updateMap();
        });

    node.append('span').text('ha');
}


function createSliderFilter2(node, dimension, spp, label) {
    var extent = d3.extent(_.map(dimension.group().all(), 'key')); // TODO: round ranges to nicer values

    node.append('h4')
        .text(label)
        //remove link
        .append('span').classed('small italic', true).text('[remove]')
        .on('click', function(){

            d3.select('#Filter-' + spp).remove();
            d3.select('option[value="' + spp + '"]').property('disabled', false);  // TODO: optimize select
            dimensions[spp].dispose();
            delete dimensions[spp];
            updateMap();
        });

    var sliderContainer = node.append('div');
    //sliderContainer.append('span').classed('small', true).text(d3.format(',')(extent[0]) + ' ha');

    var slider = sliderContainer.append('input')
        .attr('type', 'range')
        .attr('min', extent[0])
        .attr('max', extent[1])
        .attr('step', 1)
        .property('value', extent[0])
        .on('change', function(){
            console.log('event', d3.event)
            var self = d3.select(this);
            //var quantityNode = d3.select(self.node().parentNode).select('.slider-tooltip');
            var quantityNode = d3.select(self.node().parentNode).select('.slider-value');
            quantityNode.html('');
            var value = slider.property('value');
            if (value == 0) {
                dimension.filterAll();
            }
            else {
                //filter range from value to max
                dimension.filterRange([value, extent[1] + 1]);
            }
            quantityNode.text(d3.format(',')(value) + ' ha');


            //coordinateFilters(group);
            dc.redrawAll();
            updateMap();
        });
    sliderContainer.append('div').classed('inline-middle slider-value', true).text(d3.format(',')(extent[0]) + ' ha');

    //sliderContainer.append('span').classed('small', true).text(d3.format(',')(extent[1]) + ' ha');

    var labelContainer = node.append('div').style('width', '300px');
    var formatter = d3.format(',');
    labelContainer.append('span').classed('small', true).text(d3.format(',')(extent[0]) + ' ha');
    labelContainer.append('span').classed('small right', true).text(d3.format(',')(extent[1]) + ' ha');
}



function createSliderFilter(node, dimension, group, label) {
    var extent = [0, d3.max(_.map(dimension.group().all(), 'key'))];

    node.append('div')
        .classed('table-cell', true)
        .text(label);

    var sliderContainer = node.append('div').classed('table-cell', true);

    var slider = sliderContainer.append('input')
        .attr('type', 'range')
        .attr('min', extent[0])
        .attr('max', extent[1])
        .attr('step', 1)
        .property('value', extent[0])
        .on('change', function(){
            var self = d3.select(this);
            var quantityNode = d3.select(self.node().parentNode).select('div');
            quantityNode.html('');
            var value = slider.property('value');
            if (value == 0) {
                dimension.filterAll();
            }
            else {
                //filter range from value to max
                dimension.filterRange([value, extent[1] + 1]);
                quantityNode.text(d3.format(',')(value) + ' ha')
            }

            //coordinateFilters(group);
            dc.redrawAll();
            updateMap();
        });

    sliderContainer.append('div');

    node.append('div')
        .classed('table-cell quiet', true)
        .text(d3.format(',')(extent[1]) + ' ha');
}



function createFilterChart(node, dimension, header) {
    var labels = barLabels(dimension);
    createCountChart(node, dimensions[dimension], {
        barHeight: barHeight,
        colors: filterColors,
        label: function(g) { return labels[g.key]},
        onFilter: _.partial(onFilter, header),
        width: chartWidth,
        ordering: function(d) { return -d.key }
    });
}


// Need a reset case too?
function coordinateFilters(group) {
    var idDimName = (group == null)? 'id': group + '_id';
    var ids = d3.set(_.map(dimensions[idDimName].top(Infinity), 'id'));

    var filterFunc = function(d) { return ids.has(d) };

    idDimensions.forEach(function(d){
        if (d != idDimName) {
            // this may or may not be the right thing to do here
            dimensions[d].filterAll();


            dimensions[d].filterFunction(filterFunc);
        }
    });


    //To coordinate these filters:
    //var bird_ids = _.map(dimensions.birds_id.top(Infinity), 'id');
    //dimensions.id.filterFunction(function(d){ return bird_ids.indexOf(d) != -1 });
}



function onFilter(header, chart, filter) {
    console.log("onfilter", arguments);
    header.classed('filtered', filter != null);
    coordinateFilters();  // TODO: only applies to main filters
    updateMap();
}


function updateMap() {
    var visibleIDs = d3.set(_.map(dimensions.id.top(Infinity), 'id'));
    console.log(visibleIDs.size() + ' now visible');
    featureIndex.keys().forEach(function(id){
        var wasVisible = visibleFeatures.get(id);
        var isVisible = visibleIDs.has(id);
        if (isVisible != wasVisible) {
            d3.select(featureIndex.get(id)._path).classed('hidden', !isVisible);
            visibleFeatures.set(id, isVisible);
        }
    });

    // Update legend with count of visible watersheds
    var visibleCount = visibleIDs.size();
    var totalCount = index.size();
    var countNode = d3.select('#Legend > h5');
    if (visibleCount < totalCount) {
        countNode.classed('hidden', false);
        var formatter = d3.format(',');
        countNode.html(formatter(visibleCount) + ' of ' + formatter(totalCount) + ' watersheds visible')
    }
    else {
        countNode.classed('hidden', true);
    }
}


// reset handler
function handleChartReset(id) {
    console.log('reset', id)
    d3.event.stopPropagation();
    var chart = _.find(dc.chartRegistry.list(), function(d){ return d.root().node().id === id });
    chart.filterAll();
    chart.redrawGroup();  // for whatever reason, this is not done automatically
    d3.select('#' + id).select('h4.filtered').classed('filtered', false);
}


d3.select('#Legend input').on('change', function(){
    var value = d3.select('#Legend input').property('value') * 100;
    d3.select('.leaflet-overlay-pane')
        .classed('t_' + transparency, false)
        .classed('t_' + value, true);
    transparency = value;
});

function setSelectedField(field, group) {
    selectedField = field;
    selectedGroup = group;
    var colors = colorMap[group];
    features.getLayers().forEach(function(feature){
        var record = index.get(feature.feature.id);
        feature.setStyle({
            //TODO: cleanup assignment of color!
            fillColor: colors[4 - record[selectedField]]
        });
    });


    var prefix = (group === 'slr' || group === 'dev')? fieldLabels[group] + ':<br/>': '';
    d3.select('#Legend > h4').html(prefix + fieldLabels[field]);
    var legendNode = d3.select('#Legend > div');
    legendNode.html('');
    var labels = barLabels(selectedField);
    legendNode.selectAll('div')
        .data([4, 3, 2, 1, 0])// quantile indices, in reverse order
        .enter()
        .append('div')
        .each(function(d, i){
            var node = d3.select(this);
            node.append('div')
                .classed('colorpatch', true)
                .style('background', function(d){return colors[i]});

            var label = labels[d].split(' ')[0];
            var modifier = labels[d].replace(label, '');

            node.append('div')
                .text(label)
                .append('span')
                .classed('quieter small', true)
                .text(modifier);

        });
}



function selectUnit(id){
    console.log('select ', id);

    d3.select('#MainSidebar').classed('hidden', true);
    d3.select('#MainSidebarHeader').classed('hidden', true);
    d3.select('#Details').classed('hidden', false);
    d3.select('#DetailsHeader').classed('hidden', false);
    //d3.select('#Sidebar').style('width', '600px');

    if (pendingRequest != null) {
        pendingRequest.abort();
    }

    if (featureCache[id] != null){
        //d3.select('#DetailsLoadingScrim').classed('hidden', true);
        //d3.select('#DetailsContainer').classed('hidden', false);
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
    var path = d3.select(feature._path);
    path.classed('selected', true);

    d3.select('#Unit').text(details.name);
    d3.select('#UnitID').text('HUC 12: ' + id);
    d3.select('#UnitArea').text(d3.format(',')(details.hectares));

    var chartColors = colorMap.general;
    var chartColors4 = chartColors.slice(0, 4).concat(chartColors[5]);

    // Priority resources tab
    var pr_data = d3.entries(details.pflcc_pr).map(function(d) {
        return {
            value: d.value,
            label: priorityResourceLabels[d.key],
            color: priorityResourceColors[d.key]
        }
    });
    createInlineBarChart(d3.select('#PFLCC_PR_Bars'), pr_data, ' ha', true);

    // CLIP tab
    createPieChart(d3.select('#CLIP_Chart'), zipIntoObj(['value', 'label', 'color'], details.clip, priorityLabels, chartColors), '%');
    createPieChart(d3.select('#Bio_Chart'), zipIntoObj(['value', 'label', 'color'], details.bio, priorityLabels, chartColors), '%');
    createPieChart(d3.select('#BioRareSpp_Chart'), zipIntoObj(['value', 'label', 'color'], details.bio_rare_spp, priorityLabels4, chartColors4), '%');
    createPieChart(d3.select('#BioSHCA_Chart'), zipIntoObj(['value', 'label', 'color'], details.bio_shca, priorityLabels4, chartColors4), '%');

    var tableNode = d3.select('#BioSHCATable');
    tableNode.html('');
    d3.range(1, 5).forEach(function(d, i){
        var values = details.bio_shca2[d];
        if (!values) return;

        tableNode.append('h5').text(priorityLabels4[i]);
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), speciesTable(values), true);
    });

    createPieChart(d3.select('#BioPNC_Chart'), zipIntoObj(['value', 'label', 'color'], details.bio_pnc, priorityLabels4, chartColors4), '%');
    createPieChart(d3.select('#BioSppRich_Chart'), zipIntoObj(['value', 'label', 'color'], details.bio_spp_rich, priorityLabels, chartColors), '%');

    tableNode = d3.select('#BioSppRichTable');
    tableNode.html('');
    if (details.bio_spp_rich2){
        tableNode.append('h5').text('Species Present');
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), speciesTable(details.bio_spp_rich2), true);
    }


    // Landscape tab
    createPieChart(d3.select('#Land_Chart'), zipIntoObj(['value', 'label', 'color'], details.land, priorityLabels, chartColors), '%');

    // Surface water tab
    createPieChart(d3.select('#Water_Chart'), zipIntoObj(['value', 'label', 'color'], details.water, priorityLabels, chartColors), '%');



    // Land use tab
    record = index.get(id); //FIXME: somehow this is getting hijacked before we get here
    var lu_data = landUseTypes.filter(function(d) { return record['lu' + d] > 0 })
        .map(function(d) {
            return {
                value: record['lu' + d],
                label: landUseLabels[d],
                color: landUseColors[d]
            }
        });
    createInlineBarChart(d3.select('#LU_Bars'), lu_data, ' ha', true);


    // Threats tab



    // Partners tab
    tableNode = d3.select('#Owner_Table');
    tableNode.html('');
    var ownershipData = [];
    var totalManaged = 0;
    ownershipTypes.forEach(function(d, i){
        if (details.ownership_detailed && details.ownership_detailed[d.type] != null) {
            var values = details.ownership_detailed[d.type];
            var totalByOwnerType = d3.sum(d3.values(values));
            totalManaged += totalByOwnerType;
            ownershipData.push(
                {
                    value: totalByOwnerType,
                    label: d.label,
                    color: chartColors4[i]
                }
            );

            var detailedOwnerData = d3.entries(details.ownership_detailed[d.type]).map(function(d){
                return {
                    label: d.key,
                    value: d.value
                }
            });

            tableNode.append('h5').text(d.label);
            createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), detailedOwnerData, true);
        }
    });
    if (totalManaged < details.hectares) {
        ownershipData.push({label: 'Other Lands', value: details.hectares - totalManaged, color: chartColors4[4]});
    }
    var total = d3.sum(_.pluck(ownershipData, 'value'));
    ownershipData = ownershipData.map(function(d){
        d.value = 100 * d.value / total;
        return d;
    });

    createPieChart(d3.select('#Owner_Chart'), ownershipData, '%');

}


// meant to be called from an object of spp: area
// returns data ready to put into a table
function speciesTable(values){
    return d3.entries(values).map(function(d) {
        var label = species[d.key].split('|')[0];
        return {
            value: d.value,
            label: (speciesLinks[d.key]) ? '<a href="' + speciesLinks[d.key] + '" target="_blank">' + label + '</a>' : label
        }
    });
}



// expects array of objects with value, label, color already present
function createInlineBarChart(node, data, units, sortByValue) {
    width = 324;

    var formatter = d3.format(',');
    var values = data.map(function(d){ return d.value });
    var scale = d3.scale.linear().range([0, width]).domain(d3.extent(values));

    if (sortByValue){
        data.sort(function(a, b){ return d3.descending(a.value, b.value) });
    }
    else {
        data.sort(function(a, b){ return d3.ascending(a.label, b.label) });
    }

    node.html('');
    node.selectAll('div')
        .data(data).enter()
        .append('div')  //.classed('table-row', true)
        .each(function(d) {
            node = d3.select(this);

            node.append('div')
                //.classed('table-cell', true)
                .text(d.label);

            var row = node.append('div');

            row.append('div')
                .classed('bar inline-middle', true)
                .style('width', scale(d.value) + 'px')
                .style('background-color', d.color);

            row.append('label')
                .classed('quieter', true)
                .text(formatter(d.value) + units)

        });

}




function createPieChart(node, data, units){
    var width = 240,
        height = 240;

    function formatter(d){
        if (d >= 5 || Math.round(d) === d){
            return d3.format('.0f')(d) + units;
        }
        if (d < 1) {
            return '< 1' + units;
        }
        return d3.format('.1f')(d) + units;
    }

    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .margin({top: 0, right: 0, bottom: 0, left: 0})
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLegend(false)
            .showLabels(false)
            .color(function(d){ return d.color })
            .valueFormat(formatter);

        node.html('');
        node.append('svg')
            .classed('inline-middle', true)
            .style({
                width: width + 'px',
                height: height + 'px'
            })
            .datum(data.filter(function(d){return d.value >= 1}))
            .call(chart);


        node.append('ul')
            .classed('inline-middle legend', true)
            .selectAll('li')
            .data(data)
            .enter().append('li')
            .classed('legendElement small', true)
            .each(function(d){
                var node = d3.select(this);

                if (d.value > 0) {
                    node.append('div').classed('inline-top', true).style('background', d.color);
                    node.append('div').classed('inline-top', true).html(d.label)
                        .append('span').classed('small quiet', true).text(' (' + formatter(d.value) + ')');
                }
                else {
                    //absent
                    node.append('div').classed('inline-top', true).style({background: 'none', 'border-color': '#EEE'});
                    node.append('div').classed('inline-top quieter', true).html(d.label)
                        .append('span').classed('small quieter', true).text(' (absent)');
                }
            });

        return chart;
    });
}






// labels in this case are an object
function createAreaTable(node, entries, sortArea){
    node.html('');

    if (sortArea){
        entries.sort(function(a, b){ return d3.descending(a.value, b.value) });
    }
    else {
        entries.sort(function(a, b){ return d3.ascending(a.label, b.label) });
    }

    var formatter = d3.format(',');

    node.selectAll('tr').data(entries).enter()
        .append('tr')
        .each(function(d, i){
            var node = d3.select(this);
            node.append('td')
                .html(d.label)
                .classed('col-name', true);

            node.append('td')
                .text(function(d){ return formatter(d.value) + ' ha' })
                .classed('col-area', true);
        });
}




var barLabelPrefix = {
    4: 'Most',
    3: 'More',
    2: 'Intermediate',
    1: 'Less',
    0: 'Least'
};


var intFormatter = d3.format('.0f');
function barLabels(field) {
    //var numBins = scale.range().length;
    //return scale.range().map(function(d, i){
    var breaks = quantiles[field];
    return breaks.map(function(d, i){
        var prefix = barLabelPrefix[i];

        var first = (i === 0)? 0: breaks[i-1];
        var last = breaks[i];

        var firstLabel = intFormatter(first);
        var lastLabel = intFormatter(last)

        //var invert = scale.invertExtent(d);
        //var first = intFormatter(invert[0]);
        //var last = intFormatter(invert[1]);
        if (last === 0) { return prefix + ' (0%)' }
        if (i === 0 || first == 0){ return prefix + ' (<' + lastLabel + '%)' }
        if (i === breaks.length - 1){ return prefix + ' (>' + firstLabel + '%)' }
        lastLabel--;
        return prefix + ' (' + firstLabel + " - " + lastLabel + '%)';
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





function createHorizBarChart(node, data, labels, colors, units, leftMargin){
    nv.addGraph(function() {
        var chart = nv.models.multiBarHorizontalChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .barColor(colors)
            .margin({top: 0, right: 0, bottom: 0, left: (leftMargin == null)? 100: leftMargin})
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
            .style({height: 24 * data.length, width: chartWidth})
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





