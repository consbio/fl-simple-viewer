var pageLoadStart = new Date().getTime();
var foo = false;
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
var selectedID = null;

// store current level of threat filters
var threatLevel = {
    slr: summaryFields['slr'][0],
    dev: summaryFields['dev'][0]
};


// Microsoft dropped IE < 11 so we should too
if (L.Browser.ielt9 || (L.Browser.ie && ((/MSIE 9/i).test(navigator.userAgent) || (/MSIE 10/i).test(navigator.userAgent)))){
    d3.select('#IEAlert').classed('hidden', false);
    throw 'UnsupportedBrowser';
}




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
    d3.select('#Sidebar').classed('dark', false);//.style('background', '#FFF');
    deselectUnit();
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


/************* Tooltips *******************/
function connectTooltip(node, data) {
    node.on('mouseenter', function() {
        var anchorNode = d3.select(this);
        var bndRect = anchorNode.node().getBoundingClientRect();
        var tooltip = d3.select('#Tooltip');
        tooltip.select('h4').html(data.title);
        tooltip.select('p').html(data.text); //TODO

        var tooltipBnd = tooltip.node().getBoundingClientRect();
        var top = bndRect.top + window.pageYOffset;
        if (top + tooltipBnd.height > window.innerHeight){  // TODO
            top = top - (top + tooltipBnd.height - window.innerHeight);
        }
        top = Math.max(top, 0);
        tooltip.style({
            left: bndRect.right + 'px',
            'top': top + 'px'
        });

        tooltip.select('.tooltip-pointer').style('top', (Math.abs(bndRect.top - top) + 14) + 'px')
    })
    .on('mouseleave', function() {
        d3.select('#Tooltip').style({'left': '-9999px', 'top': '-9999px'});
    });
}

d3.selectAll('.js-hasTooltip').each(function() {
    var node = d3.select(this);
    connectTooltip(node, {title: node.attr('data-tooltip-title'), text: node.attr('data-tooltip')});
});



/******* Map Configuration *********/
var basemaps = [
    L.tileLayer('//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        subdomains: ['server', 'services'],
        label: 'ESRI Topo'
    }),
    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        label: 'ESRI Imagery'
    }),
    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        label: 'ESRI Streets'
    }),
    L.tileLayer('//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
        subdomains: ['server', 'services'],
        label: 'ESRI Gray'
    })
];


map = L.map('Map', {
    layers: [basemaps[0]],
    maxZoom: 12,
    center: [27.68, -81.69],
     zoom: 7
});
map.zoomControl.setPosition('topright');
map.addControl(L.control.zoomBox({modal: false, position:'topright'}));
map.addControl(L.control.geonames({username: 'cbi.test', position:'topright'}));

// Legend is setup as a control to coordinate layout within Leaflet
//TODO: changed - add to leaflet-quickstart, dm-quickstart, and other controls
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    this._container = L.DomUtil.get('Legend');
    L.DomEvent.disableClickPropagation(this._container);
    if (!L.Browser.touch) {
        L.DomEvent.disableScrollPropagation(this._container);
    }
    return this._container;
};
legend.addTo(map);

//map.addControl(L.control.layers(basemaps, null, {position: 'bottomright', autoZIndex: false}));
//d3.select('.leaflet-control-layers-toggle').html('<i class="fa fa-globe"></i> <i class="fa fa-globe quiet"></i>'); // basemaps


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
    features.addTo(map);

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

            container.classed('node-highlight', true);
            connectTooltip(container, {title: fieldLabels[d], text: fieldTooltips[d]});

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

            container.classed('node-highlight', true);
            connectTooltip(container, {title: fieldLabels[d], text: fieldTooltips[d]});

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
                .classed('radio-container', true)
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

                    node.append('label').html(fieldLabels[e].replace('(', '<span class="small quiet">(').replace(')', ')</span>'));
                });

            var subheading = (i === 0 )? 'percent of watershed inundated': 'percent of watershed with urban / suburban development';
            //if (i === 0) {
            //    //subheading = "Time ranges were extrapolated from the High Bathtub Projections (for Mean Sea Level Rise) used in the University of Florida GeoPlan Center's <a href='http://sls.geoplan.ufl.edu/' target='_blank'>Sea Level Rise Sketch tool</a>.<br/><br/>" + subheading;
            //}
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
                createSliderFilter(
                    itemsList.append('li').attr('id', 'Filter-' + spp),
                    dimension,
                    species[spp].split('|')[0],
                    null,
                    function(){
                        d3.select('#Filter-' + spp).remove();
                        d3.select('option[value="' + spp + '"]').property('disabled', false);  // TODO: optimize select
                        dimensions[spp].dispose();
                        delete dimensions[spp];
                        updateMap();
                    }
                );
                self.select('option[value="' + spp + '"]').property('disabled', true);
                self.property('value', '-');
            })
        });

    // Land use
    d3.select('#LandUseFilterList').selectAll('div')
        .data(landUseTypes).enter()
        .append('div')//.classed('table-row', true)
        .each(function(d) {
            var node = d3.select(this);
            var dimension = dimensions['lu' + d];
            var label = landUseLabels[d];
            createSliderFilter(node.append('li').attr('id', 'Filter-' + d), dimension, label, landUseTooltips[d], null);
        });
}


function createSliderFilter(node, dimension, label, tooltip, removeCallback) {
    var extent = d3.extent(_.map(dimension.group().all(), 'key')); // TODO: round ranges to nicer values

    var scale = d3.scale.linear().domain(extent).range([0, 300]); // based on width of slider

    var header = node.append('h4').text(label);

    if (removeCallback) {
        header.append('span').classed('small italic', true).text('[remove]')
            .on('click', removeCallback);
    }

    var sliderContainer = node.append('div');

    if (tooltip) {
        node.classed('node-highlight', true);
        connectTooltip(node, {title:label, text: tooltip});
    }

    var slider = sliderContainer.append('input')
        .attr('type', 'range')
        .attr('min', extent[0])
        .attr('max', extent[1])
        .attr('step', 1)
        .property('value', extent[0])
        .on('change', function(){
            var self = d3.select(this);
            var quantityNode = d3.select(self.node().parentNode).select('.slider-value');
            //quantityNode.html('');

            var value = slider.property('value');
            if (value == 0) {
                dimension.filterAll();
            }
            else {
                //filter range from value to max
                dimension.filterRange([value, extent[1] + 1]);
            }

            if (quantityNode.property('value') != value) {
                quantityNode.property('value', value);
            }
            //quantityNode.text(d3.format(',')(value) + ' ha'); //'at least ' +

            dc.redrawAll();
            updateMap();
        });

    //function updateRange(self) {
    //    //var self = (self)? self: d3.select(this);
    //        var value = self.property('value');
    //        if (value > extent[1]) {
    //            value = extent[1];
    //            self.property('value', value);
    //        }
    //        else if (value < extent[0]) {
    //            value = extent[0];
    //            self.property('value', value);
    //        }
    //        console.log(value)
    //        if (slider.property('value') != value) {
    //            slider.property('value', value);
    //        }
    //}

    var inputContainer = sliderContainer.append('div').classed('inline-middle', true);

    inputContainer.append('div').classed('small quieter input-label', true).text('at least');

    inputContainer.append('input')
        .classed('inline-middle slider-value small', true)
        .attr('type', 'number')
        .attr('min', extent[0])
        .attr('max', extent[1])
        .attr('step', 1)
        .property('value', extent[0])
        .on('change', function(){
            var self = d3.select(this);
            var value = self.property('value');
            if (value > extent[1]) {
                value = extent[1];
                self.property('value', value);
            }
            else if (value < extent[0]) {
                value = extent[0];
                self.property('value', value);
            }
            console.log(value)
            if (slider.property('value') != value) {
                slider.property('value', value);
            }
        });
        //.on('change', function() {
        //    updateRange(d3.select(this))
        //})
        //.on('keypress', function(){
        //    console.log(d3.select(this))
        //    if (d3.event.key == 'Enter' || d3.event.keyCode == 13) updateRange(d3.select(this));
        //    console.log(d3.event)
        //})
        //.on('blur', function() {
        //    var value = d3.select(this).property('value');
        //    if (value < extent[0] || value > extent[1]) {
        //
        //    }
        //});

    inputContainer.append('span').classed('small quieter', true).text(' ha');


        //.text(d3.format(',')(extent[0]) + ' ha');
    //sliderContainer.append('div').classed('inline-middle slider-value small', true).text(d3.format(',')(extent[0]) + ' ha');

    var labelContainer = node.append('div').classed('slider-label', true);//.style('width', '300px').style('margin-top', '-14px'); // TODO: move to CSS
    var formatter = d3.format(',');
    labelContainer.append('span').classed('small quieter', true).text(d3.format(',')(extent[0]) + ' ha');
    labelContainer.append('span').classed('small right quieter', true).text('max: ' + d3.format(',')(extent[1]) + ' ha');
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

function onFilter(header, chart, filter) {
    console.log("onfilter", arguments);
    header.classed('filtered', filter != null);
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
            var label = labels[d].split(' ')[0];
            var modifier = labels[d].replace(label, '');

            node.append('div')
                .classed('colorpatch', true)
                .style('background', function(d){return colors[i]});

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
    //d3.select('#Sidebar').classed('dark', true);
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

function deselectUnit() {
    if (!selectedID) { return; }
    d3.select(featureIndex.get(selectedID)._path).classed('selected', false);
    selectedID = null;
}


function showDetails(id) {
    var record = index.get('id');
    var details = featureCache[id];
    console.log('details', details);

    d3.selectAll('path.selected').classed('selected', false);

    var feature = featureIndex.get(id);
    selectedID = id;
    feature.bringToFront();
    var path = d3.select(feature._path);
    path.classed('selected', true);

    d3.select('#Unit').text(details.name);
    d3.select('#UnitID').text('HUC 12: ' + id);
    d3.select('#UnitArea').text(d3.format(',')(details.hectares));

    var chartColors = colorMap.general;
    var chartColors4 = chartColors.slice(0, 4).concat(chartColors[5]);
    var chartColors6 = ["#08519c", "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff", '#ffffcc'];  // same version as colorMap.general but over 7 classes

    // Priority resources tab
    var pr_data = d3.entries(details.pflcc_pr).map(function(d) {
        return {
            value: d.value,
            label: priorityResourceLabels[d.key],
            color: priorityResourceColors[d.key],
            tooltip: priorityResourceTooltips[d.key]
        }
    });
    createInlineBarChart(d3.select('#PFLCC_PR_Bars'), pr_data, ' ha', true);

    // CLIP tab
    createPieChart(d3.select('#CLIP_Chart'), zipIntoObj(['value', 'label', 'color'], details.clip, priorityLabels, chartColors), '%');
    createPieChart(d3.select('#Bio_Chart'), zipIntoObj(['value', 'label', 'color'], details.bio, priorityLabels, chartColors), '%');

    createPieChart2(d3.select('#CLIP_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.clip, priorityLabels, chartColors, clipInfo), ' ha', details.hectares);
    createPieChart2(d3.select('#Bio_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio, priorityLabels, chartColors, clipBioInfo), 'ha', details.hectares);

    createPieChart(d3.select('#BioRareSpp_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio_rare_spp, priorityLabels4, chartColors4, clipRareSppInfo), '%');
    createPieChart(d3.select('#BioSHCA_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio_shca, priorityLabels4, chartColors4, clipSHCAInfo), '%');

    //createPieChart2(d3.select('#BioRareSpp_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio_rare_spp, priorityLabels4, chartColors4, clipRareSppInfo), 'ha', details.hectares);
    //createPieChart2(d3.select('#BioSHCA_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio_shca, priorityLabels4, chartColors4, clipSHCAInfo), 'ha', details.hectares);

    var tableNode = d3.select('#BioSHCATable');
    tableNode.html('');
    d3.range(1, 5).forEach(function(d, i){
        var values = details.bio_shca2[d];
        if (!values) return;

        tableNode.append('h5').text(priorityLabels4[i]);
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), createTableLabeLinks(values, species, speciesLinks), true);
    });

    createPieChart(d3.select('#BioPNC_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio_pnc, priorityLabels4, chartColors4, clipPNCAreaInfo), '%');

    tableNode = d3.select('#BioPNC_Table');
    tableNode.html('');
    d3.range(1, 5).forEach(function(d, i){
        var values = details.bio_pnc2[d];
        if (!values) return;

        tableNode.append('h5').text(priorityLabels4[i]);
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), createTableLabeLinks(values, communities, {}), true);
    });


    createPieChart(d3.select('#BioSppRich_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.bio_spp_rich, priorityLabels, chartColors, clipSppRichInfo), '%');

    tableNode = d3.select('#BioSppRichTable');
    tableNode.html('');
    if (details.bio_spp_rich2){
        tableNode.append('h5').text('Species Present');
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), createTableLabeLinks(details.bio_spp_rich2, species, speciesLinks), true);
    }


    // Landscape tab
    createPieChart(d3.select('#Land_Chart'), zipIntoObj(['value', 'label', 'color'], details.land, priorityLabels, chartColors), '%');
    //createPieChart2(d3.select('#Land_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.land, priorityLabels, chartColors, clipLandInfo), 'ha', details.hectares);

    // greenways have different priority categories
    var greenwaysLabels = ['Priority 1', 'Priority 3', 'Priority 4', 'Not a Priority'];
    var greenwaysColors = ["#08519c", "#6baed6", "#bdd7e7", '#ffffcc'];
    createPieChart(d3.select('#Greenways_Chart'), zipIntoObj(['value', 'label', 'color'], details.land_greenways, greenwaysLabels, greenwaysColors), '%');

    // land integrity has different priority categories
    var liLabels = ['Priority 2', 'Priority 3', 'Priority 4', 'Priority 5', 'Not a Priority'];
    var liColors = ["#3182bd", "#6baed6", "#bdd7e7", "#eff3ff", '#ffffcc'];
    createPieChart(d3.select('#LI_Chart'), zipIntoObj(['value', 'label', 'color'], details.land_integrity, liLabels, liColors), '%');

    // Surface water tab
    createPieChart(d3.select('#Water_Chart'), zipIntoObj(['value', 'label', 'color'], details.water, priorityLabels, chartColors), '%');
    //createPieChart2(d3.select('#Water_Chart'), zipIntoObj(['value', 'label', 'color', 'info'], details.water, priorityLabels, chartColors, clipWaterInfo), 'ha', details.hectares);
    createPieChart(d3.select('#SSW_Chart'), zipIntoObj(['value', 'label', 'color'], details.water_significant, priorityLabels, chartColors), '%');
    createPieChart(d3.select('#Floodplain_Chart'), zipIntoObj(['value', 'label', 'color'], details.water_floodplain, priorityLabels, chartColors), '%');
    createPieChart(d3.select('#Wetlands_Chart'), zipIntoObj(['value', 'label', 'color'], details.water_wetland, priorityLabels, chartColors), '%');
    if (details.water_aquifer) {
        createPieChart(d3.select('#Aquifer_Chart'), zipIntoObj(['value', 'label', 'color'], details.water_aquifer, priorityLabels6, chartColors6), '%');
    }
    else {
        d3.select('#Aquifer_Chart').append('div').classed('quiet center', true).html('No data available');
    }



    // Land use tab
    record = index.get(id); //FIXME: somehow this variable is getting hijacked before we get here
    var luData = landUseTypes.filter(function(d) { return record['lu' + d] > 0 })
        .map(function(d) {
            return {
                value: record['lu' + d],
                label: landUseLabels[d],
                color: landUseColors[d],
                tooltip: landUseTooltips[d]
            }
        });
    createInlineBarChart(d3.select('#LU_Bars'), luData, ' ha', true);


    // Threats tab

    var slrData = [];
    var slrHa = d3.max(details.slr);
    var notAffectedBySLR = details.hectares - slrHa;
    if (slrHa) {
        // only keep nonzero entries
        slrData = slrLevels.map(function (d, i) {
            return {
                value: details.slr[i],
                label: 'Projected - ' + fieldLabels[d],
                color: colorMap.slr[i]
            }
        }).filter(function(d){ return d.value > 0});
    }
    if (notAffectedBySLR > 0) {
        slrData.push({
            value: notAffectedBySLR,
            label: 'Not affected by up to 3 meters',
            color: colorMap.slr[4]
        })
    }
    createInlineBarChart(d3.select('#SLR_Bars'), slrData, ' ha', false, true);


    var devData = [];
    var devHa = d3.max(details.dev);
    var notDeveloped = details.hectares - devHa;
    if (devHa > 0) {
        devData = devLevels.map(function (d, i) {
            return {
                value: details.dev[i],
                label: ((i === 0) ? '' : 'Projected - ') + fieldLabels[d],
                color: colorMap.dev[i]
            }
        }).filter(function(d){ return d.value > 0});
    }
    if (notDeveloped > 0) {
        devData.push({
            value: notDeveloped,
            label: 'Not developed by 2060',
            color: colorMap.dev[4]
        });
    }
    createInlineBarChart(d3.select('#Dev_Bars'), devData, ' ha', false, true);




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

    // Partners
    var partnersList = d3.select('#PartnersList');
    partnersList.html('');
    var partnerNodes = partnersList.selectAll('li').data(details.partners);
    partnerNodes.enter()
        .append('li')
        .html(function(d) {
            var partnerInfo = partnerLabels[d].split('|');
            return '<a href="' + partnerInfo[1] + '" target="_blank">' + partnerInfo[0] + '</a>';
        });
    //partnerNodes.exit().remove();

    if (partnerNodes.empty()) {
        partnersList.append('li').classed('quiet', true).html('No information available');
    }

    // Land trusts
    var landTrustList = d3.select('#LTList');
    landTrustList.html('');
    var landTrustNodes = landTrustList.selectAll('li').data(d3.keys(details.counties || {}));
    landTrustNodes.enter()
        .append('li')
        .html(function(d) {
            return '<a href="http://findalandtrust.org/counties/' + d + '" target="_blank">' + details.counties[d] + '</a>';
        });
    if (landTrustNodes.empty()) {
        landTrustNodes.append('li').classed('quiet', true).html('No information available');
    }
}


// meant to be called from an object of spp: area
// returns data ready to put into a table
function createTableLabeLinks(values, labels, links){
    return d3.entries(values).map(function(d) {
        var label = labels[d.key].split('|')[0];
        return {
            value: d.value,
            label: (links[d.key]) ? '<a href="' + links[d.key] + '" target="_blank">' + label + '</a>' : label
        }
    });
}



// expects array of objects with value, label, color already present
//redo handling of sort flag or require things to be sorted on input
function createInlineBarChart(node, data, units, sortByValue, noSort) {
    width = 324;

    var formatter = d3.format(',');
    var values = data.map(function(d){ return d.value });
    var scale = d3.scale.linear().range([0, width]).domain([0, d3.max(values)]);

    if (!noSort) {
        if (sortByValue){
            data.sort(function(a, b){ return d3.descending(a.value, b.value) });
        }
        else {
            data.sort(function(a, b){ return d3.ascending(a.label, b.label) });
        }
    }

    node.html('');
    node.selectAll('div')
        .data(data).enter()
        .append('div')
        .each(function(d) {
            node = d3.select(this);

            node.append('div')
                .classed('horiz-bar-title', true)
                .text(d.label);

            var row = node.append('div');

            row.append('div')
                .classed('bar inline-middle', true)
                .style('width', scale(d.value) + 'px')
                .style('background-color', d.color);

            row.append('label')
                .classed('quieter horiz-bar-label', true)
                .text(formatter(d.value) + units);

            if (d.tooltip) {
                //node.classed('node-highlight', true);
                connectTooltip(node, {title: d.label, text: d.tooltip});
            }

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
                    node.append('div').classed('colorpatch', true).style('background', d.color);
                    node.append('div').classed('inline-top', true).html(d.label)
                        .append('span').classed('small quiet', true).text(' (' + formatter(d.value) + ')');
                }
                else {
                    //absent
                    node.append('div').classed('colorpatch', true).style({background: 'none', 'border-color': '#EEE'});
                    node.append('div').classed('inline-top quieter', true).html(d.label)
                        .append('span').classed('small quieter', true).text(' (absent)');
                }

                if (d.info) {
                    node.classed('node-highlight', true);
                    connectTooltip(node, {
                        title: d.label + '<span class="right quieter small font-weight-normal">(' + formatter(d.value) + ')</span>',
                        text: (d.info)? d.info: d.label
                    });
                }

            });

        return chart;
    });
}




function createPieChart2(node, data, units, area){ //TODO: remove units; not used
    var width = 180,
        height = 180;

    //calculate areas from percents
    data.forEach(function(d){
        d.area = area * d.value / 100.0;
    });

    function pctFormatter(d){
        if (d < 1) {
            return '<span class="smaller">&lt;</span>1%';
        }
        return d3.format('.0f')(d) + '%';
    }

    var intFormatter = d3.format(',.0f');

    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .margin({top: 0, right: 0, bottom: 0, left: 0})
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLegend(false)
            .showLabels(false)
            .color(function(d){ return d.color })
            .valueFormat(pctFormatter);

        node.html('');
        node.append('svg')
            .style({
                width: width + 'px',
                height: height + 'px'
            })
            .datum(data.filter(function(d){return d.value >= 1}))
            .call(chart);


        node.append('ul')
            .classed('legend legend-table', true)
            .selectAll('li')
            .data(data)
            .enter().append('li')
            .classed('small', true)
            .each(function(d, i){
                var node = d3.select(this);

                var headerNode = node.append('div');
                //var infoNode = node.append('div').classed('info quieter clear', true).style('border-top', '1px solid #DDD');

                if (d.value > 0) {
                    headerNode.append('div').classed('colorpatch has-text', true).style('background', d.color)
                        .html(pctFormatter(d.value))
                        .style('color', (i < 3)? '#FFF': '#333'); //TODO: better flip colors

                    headerNode.append('h4').classed('inline-middle', true).html(d.label);

                    headerNode.append('span').classed('right small quieter', true)
                        .html(intFormatter(d.area) + ' ha');

                    node.append('div').classed('info quieter clear', true).html(d.info);
                }
                //else {
                //    //absent
                //    headerNode.append('h4').classed('inline-middle quieter', true).html(d.label);
                //    headerNode.append('span').classed('right small quieter', true).text('absent')
                //}
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



var intFormatter = d3.format('.0f');
function barLabels(field) {
    var breaks = quantiles[field];
    return breaks.map(function(d, i){
        var prefix = barLabelPrefix[i];

        var first = (i === 0)? 0: breaks[i-1];
        var last = breaks[i];

        var firstLabel = intFormatter(first);
        var lastLabel = intFormatter(last)

        if (last === 0) { return prefix + ' (0%)' }
        if (i === 0 || first == 0){ return prefix + ' (<' + lastLabel + '% of watershed)' }
        if (i === breaks.length - 1){ return prefix + ' (>' + firstLabel + '% of watershed)' }
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


/**************** NEW BASEMAP CONTROL HERE *****************/

function createControl(domNode, map, config) {
    var control = L.control(config);
    control.onAdd = function (map) {
        var container = domNode;
        L.DomEvent.disableClickPropagation(container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(container);
        }
        this._container = container;
        return container;
    };
    control.addTo(map);
}

var curBasemap = null;

function initBasemaps(node, map, basemaps){
    createControl(node.node(), map, {position: 'bottomright'});
    basemaps.forEach(function(d, i){
        if (i === 0) {
            curBasemap = d;
        }

        var coords = {x:8, y:13};

        //pt = new L.Point(center.lng, center.lat)



        var zoom = 5; //map.getZoom();
        //TODO: get center of map and two zooms level out or 0

        var url = L.Util.template(d._url, L.extend({
			s: d._getSubdomain(coords),
			x: coords.x,
			y: d.options.tms ? d._globalTileRange.max.y - coords.y : coords.y,
			z: zoom
		}, d.options));

        console.log(url)

        var container = node.append('div').classed('basemap', true).classed('active', i === 0).classed('alt', i === 1);
        //container.append('h4').classed('center', true).html(d.options.label);

        var img = container.append('img')
            .attr('src', url)
            .attr('title', d.options.label);

        container.on('click', function(){
                console.log(d, i)

                //if different, remove previous basemap, and add new one
                if (d != curBasemap) {
                    map.removeLayer(curBasemap);
                    map.addLayer(d);
                    map.fire('baselayerchange', curBasemap); //TODO: need to sync up attribution after this
                    curBasemap = d;

                    d3.selectAll('.basemap.active').classed('active', false);
                    d3.select(this).classed('active', true);

                    d3.selectAll('.basemap.alt').classed('alt', false);
                    var altIdx = (i === 0)? 1: 0;
                    d3.select(d3.selectAll('.basemap')[0][altIdx]).classed('alt', true);

                    //node.classed('closed', true);//.classed('map-panel', false);
                }
            });

    });

    node.on('mouseenter', function() {
            d3.select(this).classed('closed', false);//.classed('map-panel', true);
        })
        .on('mouseleave', function() {
            d3.select(this).classed('closed', true);//.classed('map-panel', false);
        })


}

var selectedBasemapIdx = 0;
initBasemaps(d3.select('#Basemaps'), map, basemaps);
