var DEBUG = true; //FIXME

var pageLoadStart = new Date().getTime();
var features, data;
var index = d3.map();
var featureIndex = d3.map();
var visibleFeatures = d3.map();
var cf = null;
var dimensions = {};
var idDimensions = [];
var barHeight = 20;
var chartWidth = 420;
function filterColors(){ return '#9ecae1' }
var transparency = 25;  //on 0-100% scale
var featureCache = {};
var pendingRequest = null;
var featuresURL = 'features/';
var loadingUnit = false;
var detailsShowing = false;
var selectedIds = [];


// Have to tell Leaflet where the marker images are
L.Icon.Default.imagePath = 'static/dist/images';

// store current state of filtered dimensions by tab
var activeFiltersByTab = {};
d3.select('#MainSidebarHeader').selectAll('li').each(function(d){
    activeFiltersByTab[d3.select(this).attr('data-tab')] = {};
});
function hasFilters(){
    return _.some(_.values(activeFiltersByTab).map(function(d){return _.some(d)}));
}



// store current level of threat filters
var threatLevel = {
    slr: summaryFields['slr'][0],
    dev: summaryFields['dev'][0]
};

function pctFormatter(d){
    if (d < 1) {
        return '<span class="smaller">&lt;</span>1%';
    }
    return d3.format('.0f')(d) + '%';
}
var intFormatter = d3.format(',.0f');


var valueSort = function(a, b){ return d3.descending(a.value, b.value) };
var labelSort = function(a, b){ return d3.ascending(a.label, b.label) };


// Microsoft dropped IE < 11 so we should too
if (L.Browser.ielt9 || (L.Browser.ie && ((/MSIE 9/i).test(navigator.userAgent) || (/MSIE 10/i).test(navigator.userAgent)))){
    updateNodeVisibility(['#IEAlert'], ['#LoadingScrim']);
    if (!DEBUG) {
        ga('send', 'event', 'Unsupported Browser', 'IE < 11');
    }
    throw 'UnsupportedBrowser';
}

if (L.Browser.ie) {
    d3.select('#PDFButton').classed('disabled', true).on('mouseover', function() {
        d3.select('#PdfSupportTooltipContainer').style('display', 'block');
    }).on('mouseout', function() {
        d3.select('#PdfSupportTooltipContainer').style('display', 'none');
    });
    d3.select('#PdfSupportTooltipContainer').on('mouseover', function() {
        d3.select('#PdfSupportTooltipContainer').style('display', 'block');
    }).on('mouseout', function() {
        d3.select('#PdfSupportTooltipContainer').style('display', 'none');
    });
    d3.select('#CreateReportInstruction').classed('disabled', true);
    d3.select('#IEWarning').classed('hidden', false);
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
    closeOutDetails();
});


/** Clear all button **/
d3.select('#ClearAllButton').on('click', function() {
    d3.select('#ClearFilterContainer').classed('hidden', true);

    // clear all charts
    dc.chartRegistry.list().forEach(function(chart) {
        chart.filterAll();
    });

    // clear all sliders
    d3.selectAll('.slider-list input.slider-value')[0].filter(function(d){ return d.value > 0}).forEach(function(d){d3.select(d).property('value', 0)});
    d3.selectAll('.slider-list input[type="range"]')[0].filter(function(d){ return d.value > 0}).forEach(function(d){d3.select(d).property('value', 0)});
    var sliderTabs =['LandUseFilter', 'SppFilter'];
    sliderTabs.forEach(function(tab) {
        var dims = _.entries(activeFiltersByTab[tab]).filter(function(d){return d[1] == true}).map(function(d){return d[0]});
        dims.forEach(function(d) {
            dimensions[d].filterAll();
            // updateTabIndicator(d, false);
            activeFiltersByTab[tab] = {};
        })
    });

    d3.selectAll('.indicator').remove();
    d3.select('#ClearFilterContainer').classed('hidden', true);
    dc.redrawAll();
    updateMap();

    if (!DEBUG) {
        // log via google analytics
        ga('send', 'event', 'Filters: clear all', 'clear all filters');
    }
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
        tooltip.html('');
        tooltip.append('div').classed('tooltip-pointer', true);
        tooltip.append('h4')
            .classed('tooltip-title', true)
            .html(data.title);

        if (data.subtitle) {
            var tooltipSubtitle = tooltip.append('div')
                .classed('tooltip-subtitle', true)
                .html(data.subtitle);

            if (data.subtitleClass) {
                tooltipSubtitle.classed(data.subtitleClass, true);
            }
        }

        if (data.text) {
            tooltip.append('div')
                .classed('tooltip-text', true)
                .html(data.text);
        }

        var tooltipBnd = tooltip.node().getBoundingClientRect();
        var top = bndRect.top + window.pageYOffset;
        if (top + tooltipBnd.height > window.innerHeight){
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
    maxZoom: 12,
    minZoom: 5,
    maxBounds: L.latLngBounds(L.latLng(23, -90), L.latLng(32, -76)),
    center: [27.68, -81.69],
    zoom: 7
});
map.zoomControl.setPosition('topright');
map.addControl(L.control.zoomBox({modal: false, position:'topright'}));
var geonamesControl = L.control.geonames(
    {
        username: 'cbi.test',
        position:'topright',
        adminCodes: {
            country: 'us',
            adminCode1: 'fl'
        }
    }
);
map.addControl(geonamesControl);

var basemapsControl = L.control.basemaps({
    basemaps: basemaps,
    tileX: 8,
    tileY: 13,
    tileZ: 5,
    position: 'bottomleft'
});
map.addControl(basemapsControl);


if (!DEBUG) {
    // log via google analytics
    geonamesControl.on('search', function (e) {
        if (!(e.params && e.params.q)) return;

        ga('send', 'event',
            'Geonames',
            'search',
            e.params.q
        );
    });

    map.on('baselayerchange', function () {
        ga('send', 'event',
            'Basemaps',
            'set',
            basemapsControl.basemap.options.label
        );
    });
}


// Legend is setup as a control to coordinate layout within Leaflet
//TODO: changed - add to leaflet-quickstart, dm-quickstart, and other controls
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    this._container = L.DomUtil.get('Legend');
    L.DomUtil.removeClass(this._container, 'hidden');
    L.DomEvent.disableClickPropagation(this._container);
    if (!L.Browser.touch) {
        L.DomEvent.disableScrollPropagation(this._container);
    }
    return this._container;
};
legend.addTo(map);

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
        cf = crossfilter(rows);
        dimensions.id = cf.dimension(function(r){ return r['id']});
        idDimensions.push('id');
        d3.keys(quantiles).forEach(function(d){
            var dimension = cf.dimension(function(r){ return r[d]});
            // id needed for setting tab indicator on filter
            dimension.id = (d.indexOf('slr') != -1 || d.indexOf('dev') != -1)? d.slice(0, 3): d;
            dimensions[d] = dimension;
        });

        landUseTypes.forEach(function(d) {
            d = 'lu' + d;
            var dimension = cf.dimension(function(r){ return r[d] });
            dimension.id = d;
            dimensions[d] = dimension;
            // id intentionally left out here?? FIXME
        });

        onLoad();
        console.log('loaded csv by',new Date().getTime() - pageLoadStart, 'ms');
    }
);

// Use lodash to call load function after 2 prior async requests are complete
var onLoad = _.after(2, load);
function load() {
    d3.select('#LoadingScrim').classed('hidden', true);

    setSelectedField(selectedField, 'priority', '% of watershed covered by combined priority resources');
    features.addTo(map);

    d3.select('#PriorityFilter').selectAll('div')
        .data(summaryFields.priority).enter()
        .append('div')
        .each(function(d, i){
            var container = d3.select(this).append('section');

            var header = container.append('h4')
                .classed('mapped', i == 0)
                .text(fieldLabels[d])
                .attr('data-field', d);
            var chartContainer = container.append('div');

            initExpando(container, i <= 1);

            container.classed('node-highlight', true);
            connectTooltip(container, {title: fieldLabels[d], text: fieldTooltips[d]});

            var subheading = (i === 0)? '% of watershed covered by combined priority resources': '% of watershed covered by Priority 1 and 2';
            chartContainer.append('div')
                .classed('quiet small filter-subheading', true)
                .html(subheading);

            header.append('div')
                .classed('right', true)
                .html('<i class="fa fa-map"></i>')
                .attr('title', 'Click to show on map')
                .on('click', function(){
                    d3.event.stopPropagation();
                    setSelectedField(d, 'priority', subheading);
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

            createFilterChart(chartNode, d, header, fieldLabels[d]);
        });


    //Threats
    d3.select('#ThreatsFilter').selectAll('div')
        .data(['slr', 'dev']).enter()
        .append('div')
        .each(function(d, i){
            var curLevel = summaryFields[d][0];

            var container = d3.select(this).append('section').attr('id', 'Filter-' + d);

            var header = container.append('h4')
                .text(fieldLabels[d])
                .attr('data-field', threatLevel[d]);
            var subheading = (i === 0 )? '% of watershed inundated': '% of watershed with urban / suburban development';
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
                    setSelectedField(threatLevel[d], d, subheading);
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
                            var threat = level.slice(0, 3);
                            var curLevel = threatLevel[threat];

                            if (level === curLevel) return;

                            var chartID = 'FilterChart-' + threat;
                            var chart = _.find(dc.chartRegistry.list(), function(d){ return d.root().node().id === chartID });
                            var curFilters = chart.filters();

                            // reset filter and map
                            dimensions[curLevel].filterAll();
                            updateMap();

                            // recreate chart
                            dc.deregisterChart(chart);  // have to deregister manually, otherwise it sticks around
                            var chartNode = d3.select(chart.root().node());
                            chartNode.empty();
                            createFilterChart(chartNode, level, header, fieldLabels[d] + ': ' + fieldLabels[level]);

                            // TODO: reselect previous categories
                            var hasFilters = curFilters.length > 0;

                            if (hasFilters) {
                                chart = _.find(dc.chartRegistry.list(), function(d){ return d.root().node().id === chartID });
                                curFilters.forEach(function(d){
                                    chart.filter(d);
                                });
                                chart.redraw();
                            }

                            updateTabIndicator(d.id, hasFilters);  // intentionally using 'slr' and 'dev' instead of specific dimension here

                            // update header and map
                            if (d3.select('#Filter-' + threat + ' h4').classed('mapped')) {
                                setSelectedField(level, threat, subheading);
                            }

                            threatLevel[threat] = level;
                        });

                    node.append('label').html(fieldLabels[e].replace('(', '<span class="small quiet">(').replace(')', ')</span>'));
                });



            chartContainer.append('div')
                .classed('quiet small filter-subheading', true)
                .html(subheading);

            var chartID = 'FilterChart-' + d;
            var chartNode = chartContainer.append('div').classed('chart', true).attr('id', chartID);
            createFilterChart(chartNode, curLevel, header, fieldLabels[d] + ': ' + fieldLabels[curLevel]);
            header.append('div')
                .classed('filter-reset small', true)
                .text('[clear filter]')
                .on('click', _.partial(handleChartReset, chartID));

            chartContainer.append('div').classed('small quiet center', true).text('number of watersheds');
        });


    // Species
    var sppGroupsList = d3.keys(sppGroups);

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

            selector.on('change', speciesSelect);
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

    restorePage(window.location.href);
    window.onclick = function() {
        document.getElementById('SharePageContainer').style.display = '';
    };
}

function speciesSelect() {
    var self = d3.select(this);
    var spp = self.property('value');
    if (spp === '-') { return }

    var itemsList = d3.select('#SppFilter .slider-list');

    // prevent from duplicate add
    if (dimensions[spp] != null) { return; }

    // TODO: find a nicer UI for this
    if (d3.keys(dimensions).length >= 32) {
        alert('We are sorry, there is a limit to the number of species that you can combine.  Please remove ' +
            'a species to make room for another');
        return;
    }

    var dimension = cf.dimension(function(d){ return d[spp] });
    dimension.id = spp;
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
            updateTabIndicator(dimension.id, false);
            dc.redrawAll();
            updateMap();
        }
    );
    self.select('option[value="' + spp + '"]').property('disabled', true);
    self.property('value', '-');
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

            var value = slider.property('value');

            var quantityNode = d3.select(self.node().parentNode).select('.slider-value');
            if (quantityNode.property('value') != value) {
                quantityNode.property('value', value);
            }

            // this must happen after value is set
            updateSliderFilter(dimension, value, extent[1] + 1, label);
        });

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
            if (slider.property('value') !== value) {
                slider.property('value', value);
                updateSliderFilter(dimension, value, extent[1] + 1, label);
            }
        });

    inputContainer.append('span').classed('small quieter', true).text(' ha');

    var labelContainer = node.append('div').classed('slider-label', true);//.style('width', '300px').style('margin-top', '-14px'); // TODO: move to CSS
    var formatter = d3.format(',');
    labelContainer.append('span').classed('small quieter', true).text(d3.format(',')(extent[0]) + ' ha');
    labelContainer.append('span').classed('small right quieter', true).text('max: ' + d3.format(',')(extent[1]) + ' ha');
}

function updateSliderFilter(dimension, value, max, label) {
    var hasFilter = false;
    if (value == 0) {
        dimension.filterAll();
    }
    else {
        //filter range from value to max
        dimension.filterRange([value, max]);
        hasFilter = true;
    }

    dc.redrawAll();
    updateTabIndicator(dimension.id, hasFilter);
    updateMap();

    if (!DEBUG) {
        // log via google analytics
        ga('send', 'event',
            'Slider: ' + label,
            'update filter',
            (value > 0) ? 'set: ' + d3.format(',d')(value) + ' ha' : 'clear',
            value
        );
    }
}


function createFilterChart(node, dimension, header, dimensionName) {
    var labels = barLabels(dimension);
    return createCountChart(node, dimensions[dimension], {
        barHeight: barHeight,
        colors: filterColors,
        label: function(g) { return labels[g.key]},
        onFilter: _.partial(onFilter, header, dimensionName),
        width: chartWidth,
        ordering: function(d) { return -d.key }
    });
}

function onFilter(header, dimensionName, chart, filter) {
    var isFiltered = chart.hasFilter();
    header.classed('filtered', isFiltered);
    updateTabIndicator(chart.dimension().id, isFiltered);
    updateMap();

    if (!DEBUG) {
        // log via google analytics
        ga('send', 'event',
            'Filter: ' + dimensionName,
            'update filter',
            (isFiltered)? 'set: ' + chart.filters().slice().sort().join(','): 'clear'
        );
    }
}

function updateTabIndicator (dimensionID, isFiltered) {
    var activeTab = d3.select('#MainSidebarHeader li.active');
    var indicator = activeTab.select('.indicator');
    var tabState = activeFiltersByTab[activeTab.attr('data-tab')];

    // update with current filter state
    tabState[dimensionID] = isFiltered;

    if (_.some(d3.values(tabState))) {
        if (indicator.empty()) {
            activeTab.append('i')
                .classed('fa fa-circle indicator', true)
                .attr('title', 'has one or more active filters');
        }
    }
    else {
        indicator.remove();
    }

    d3.select('#ClearFilterContainer').classed('hidden', !hasFilters());
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
    var countNode = d3.select('#Legend .legend-count');
    if (visibleCount < totalCount) {
        countNode.classed('hidden', false);
        var formatter = d3.format(',');
        if (visibleCount > 0) {
            countNode.html(formatter(visibleCount) + ' of ' + formatter(totalCount) + ' watersheds visible')
        }
        else {
            countNode.text('no watersheds visible')
        }
    }
    else {
        countNode.classed('hidden', true);
    }
}


// reset handler
function handleChartReset(id) {
    // console.log('reset', id)
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

function setSelectedField(field, group, subtitle) {
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

    var subtitleNode = d3.select('#Legend > h5');
    if (subtitle) {
        subtitleNode.classed('hidden', false)
            .html(subtitle);
    }
    else {
        subtitleNode.classed('hidden', true);
    }


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

function mergeDataForIds2(ids) {
    var arrayFields = ['bio', 'bio_pnc', 'bio_rare_spp', 'bio_shca', 'bio_spp_rich', 'clip', 'dev', 'land',
        'land_greenways', 'land_integrity', 'names', 'slr', 'water', 'water_aquifer', 'water_floodplain',
        'water_significant', 'water_wetland'];
    var objFields = ['bio_pnc2', 'bio_shca2', 'bio_spp_rich2', 'counties', 'land_use', 'pflcc_pr' ];

    var records = ids.map(function(id){
        return featureCache[id];
    });

    var merged = {
        records: records,  // keep full records instead of selected info

        hectares: _.sum(_.map(records, 'hectares')),
        names: (records.length > 1)? records.length.toString() + ' selected watersheds': records[0].name,
        partners: _.spread(_.union)(_.map(records, 'partners')),  // merge partners into unique list
        selected_info: [],
    };

    arrayFields.forEach(function(field) {
        var values = _.map(records, field);
        merged[field] = sumArraysByIndex(values);
    });

    objFields.forEach(function(field) {
        var values = _.map(records, field);
        merged[field] = aggregateMerge(values);
    });

    // values for counties have an odd structure, need to flatten the single value arrays for each county code.
    merged.counties =_.mapValues(merged.counties, function(value){return value[0]});

    // Since the huc_id is not part of the records, we will add it here for displaying the Selected Watersheds
    ids.forEach( function(id) {
        var r = featureCache[id];
        //console.log("featureCache[id]: ", r);
        merged.selected_info.push({name: r.name, hectares: r.hectares, huc_id: id});
    });

    //console.log('merged: ', merged);

    return merged;
}


function closeOutDetails() {
    detailsShowing = false;
    updateNodeVisibility(['#MainSidebar', '#MainSidebarHeader'], ['#Details', '#DetailsHeader']);
    d3.select('#ClearFilterContainer').classed('hidden', !hasFilters());
    deselectUnits();
}


function selectUnit(id){
    //console.log('selectUnit ', id);
    //console.log('selectUnit - selectedIds ', selectedIds);

    var index = selectedIds.indexOf(id);
    if (index > -1) {
        if (selectedIds.length == 1) {
            // deselecting last unit. close everything out.
            closeOutDetails();
        }
        else {
            selectedIds.splice(index, 1);
            updateStats();
        }
    }
    else {
        selectedIds.push(id);
        updateStats();
    }
}


function updateStats() {

    if (!detailsShowing){
        updateNodeVisibility(['#SidebarLoadingScrim'], ['#SidebarContents', '#MainSidebar', '#MainSidebarHeader', '#ClearFilterContainer']);
    }
    detailsShowing = true;

    var allDone = _.after(selectedIds.length, function() {
        var success = true;
        selectedIds.forEach( function(id) {
            var r = featureCache[id];
            if (r == null || r == undefined) {
                // This may be called while other downloads are being completed, so we
                // may not have everything we need to display
                success = false;
            }
        })

        if (success) {
            loadingUnit = false;
            var mf = mergeDataForIds2(selectedIds);
            showDetails(mf);
        }
    });

    selectedIds.forEach( function(id) {
        if (featureCache[id] != null){
            allDone();
        }
        else {
            console.log('requesting json for: ', id);
            loadingUnit = true;
            pendingRequest = d3.json(featuresURL + id + '.json', function (r) {
                if (r == null || r == undefined) { return }  //should handle case where no data is available
                featureCache[id] = r;
                allDone();
            });
        }
    });

    _.delay(function(){
            if (loadingUnit){
                updateNodeVisibility(['#SidebarLoadingScrim'], ['#SidebarContents']);
            }
        },
        250
    );

}

function deselectUnits() {

    selectedIds.forEach( function(id) {
        if (!id) { return; }
        d3.select(featureIndex.get(id)._path).classed('selected', false);
    })

    selectedIds = [];
}


function showDetails(details) {

    if (!DEBUG) {
        // log via google analytics
        ga('send', 'event', 'Watersheds Map', 'view details', details.name + ' (' + id + ')');
    }

    d3.selectAll('path.selected').classed('selected', false);

    selectedIds.forEach( function(id) {
        var feature = featureIndex.get(id);
        feature.bringToFront();
        var path = d3.select(feature._path);
        path.classed('selected', true);
    })

    d3.select('#DetailsSelectedWS').classed('hidden', selectedIds.length < 2);
    var selectedWSList = d3.select('#PFLCC_SelectedWS_List');
    selectedWSList.html('');
    var selectedIDNodes = selectedWSList.selectAll('li').data(details.selected_info);
    selectedIDNodes.enter()
        .append('li')
        .html(function(d) {
            return '<div>' + d.name +
                        '<br><div style="font-weight: normal; font-size: small; Line-Height: 1.6em">(HUC 12: ' + d.huc_id.toString() + ', ' + d3.format(',')(d.hectares) + ' hectares)</div></br>' +
                    '</div>';
        });


    if (selectedIds.length == 1) {
        d3.select('#Unit').text(details.records[0].name);
        d3.select('#UnitID').text('HUC 12: ' + selectedIds[0]);
        d3.select('#UnitArea').text(d3.format(',')(details.hectares));
    }
    else {
        d3.select('#Unit').text(details.names);
        d3.select('#UnitID').text('');
        d3.select('#UnitArea').text(d3.format(',')(details.hectares));
    }

    var chartColors4 = colorMap.general4;
    var chartColors5 = colorMap.general5;
    var chartColors6 = colorMap.general6;
    var chartColors7 = colorMap.general7;

    var labelColors4 = labelColorMap.general4;
    var labelColors5 = labelColorMap.general5;
    var labelColors6 = labelColorMap.general6;
    var labelColors7 = labelColorMap.general7;

    // Priority resources tab
    var pr_data = d3.entries(details.pflcc_pr).map(function(d) {
        return {
            value: d.value,
            label: priorityResourceLabels[d.key],
            color: priorityResourceColors[d.key],
            tooltip: priorityResourceTooltips[d.key]
        }
    });
    pr_data.sort(valueSort);
    createInlineBarChart(d3.select('#PFLCC_PR_Bars'), pr_data, details.hectares);


    // CLIP tab
    createPieChart(d3.select('#CLIP_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.clip, priorityLabels5, chartColors5, labelColors5, clipInfo), details.hectares);
    createPieChart(d3.select('#Bio_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.bio, priorityLabels5, chartColors5, labelColors5, clipBioInfo), details.hectares);
    createPieChart(d3.select('#BioRareSpp_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.bio_rare_spp, priorityLabels6, chartColors6, labelColors6, clipRareSppInfo), details.hectares);
    createPieChart(d3.select('#BioSHCA_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.bio_shca, priorityLabels5, chartColors5, labelColors5, clipSHCAInfo), details.hectares);


    var tableNode = d3.select('#BioSHCATable');
    tableNode.html('');
    d3.range(1, 5).forEach(function(d, i){
        var values = details.bio_shca2[d];
        if (!values) return;

        tableNode.append('h5').text(priorityLabels4[i] + ' species');
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), createTableLabeLinks(values, species, speciesLinks), true);
    });

    createPieChart(d3.select('#BioPNC_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.bio_pnc, priorityLabels4, chartColors4, labelColors4, clipPNCAreaInfo), details.hectares);

    tableNode = d3.select('#BioPNC_Table');
    tableNode.html('');
    d3.range(1, 5).forEach(function(d, i){
        var values = details.bio_pnc2[d];
        if (!values) return;

        tableNode.append('h5').text(priorityLabels4[i] + ' communities');
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), createTableLabeLinks(values, communities, {}), true);
    });


    createPieChart(d3.select('#BioSppRich_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.bio_spp_rich, priorityLabels5, chartColors5, labelColors5, clipSppRichInfo), details.hectares);

    tableNode = d3.select('#BioSppRichTable');
    tableNode.html('');
    if (details.bio_spp_rich2){
        tableNode.append('h5').text('Species Present');
        createAreaTable(tableNode.append('table').attr('cellspacing', 0).append('tbody'), createTableLabeLinks(details.bio_spp_rich2, species, speciesLinks), true);
    }

    // Landscape tab
    createPieChart(d3.select('#Land_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.land, priorityLabels5, chartColors5, labelColors5, clipLandInfo), details.hectares);
    createPieChart(d3.select('#Greenways_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.land_greenways, priorityLabels5, chartColors5, labelColors5, clipGreenwayInfo), details.hectares);

    // land integrity has different priority categories
    createPieChart(d3.select('#LI_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.land_integrity, priorityLabels5.slice(1), colorMap.land_integrity, labelColorMap.land_integrity, clipLIInfo), details.hectares);

    // Surface water tab
    createPieChart(d3.select('#Water_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.water, priorityLabels5, chartColors5, labelColors5, clipWaterInfo), details.hectares);
    createPieChart(d3.select('#SSW_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.water_significant, priorityLabels7, chartColors7, labelColors7, clipSigSurfWaterInfo), details.hectares);
    createPieChart(d3.select('#Floodplain_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.water_floodplain, priorityLabels6, chartColors6, labelColors6, clipNatFldInfo), details.hectares);
    createPieChart(d3.select('#Wetlands_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.water_wetland, priorityLabels6, chartColors6, labelColors6, clipWetlandsInfo), details.hectares);
    if (details.water_aquifer) {
        createPieChart(d3.select('#Aquifer_Chart'), zipIntoObj(['value', 'label', 'color', 'labelColor', 'tooltip'], details.water_aquifer, priorityLabels6, chartColors6, labelColors6, aquiferInfo), details.hectares);
    }
    else {
        d3.select('#Aquifer_Chart').append('div').classed('quiet center', true).html('No data available');
    }

    // Land use tab
    var lu_data = d3.entries(details.land_use).map(function(d) {
        return {
            value: d.value,
            label: landUseLabels[d.key],
            color: landUseColors[d.key],
            tooltip: landUseTooltips[d.key]
        }
    });
    lu_data.sort(valueSort);
    createInlineBarChart(d3.select('#LU_Bars'), lu_data, details.hectares);

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
                color: colorMap.slr[i],
                tooltip: "Area affected by projected sea level rise of up to " + fieldLabels[d] + "<br/><br/>" +
                    "Time ranges were extrapolated from the High Bathtub Projections (for Mean Sea Level Rise) used " +
                    "in the University of Florida GeoPlan Center's Sea Level Rise Sketch tool.<br/><br/>" +
                    "The areas reported for each of these scenarios are cumulative figures."
            }
        }).filter(function(d){ return d.value > 0});
    }
    if (notAffectedBySLR > 0) {
        slrData.push({
            value: notAffectedBySLR,
            label: 'Not affected by up to 3 meters',
            color: colorMap.slr[4],
            tooltip: "Area not affected by projected sea level rise for the 1-3 meter sea level rise projections.  " +
            "May be impacted by higher levels of sea level rise."
        })
    }
    createInlineBarChart(d3.select('#SLR_Bars'), slrData, details.hectares);


    var devData = [];
    var devHa = d3.max(details.dev);
    var notDeveloped = details.hectares - devHa;
    if (devHa > 0) {
        devData = devLevels.map(function (d, i) {
            var tooltip = null;
            if (i === 0 ) {
                tooltip = 'Area affected by current urbanization as of 2005';
            }
            else {
                tooltip = 'Area affected by projected urban development projections from 2005 to ' + fieldLabels[d] + '.';
            }

            return {
                value: details.dev[i],
                label: ((i === 0) ? '' : 'Projected - ') + fieldLabels[d],
                color: colorMap.dev[i],
                tooltip: tooltip
            }
        }).filter(function(d){ return d.value > 0});
    }
    if (notDeveloped > 0) {
        devData.push({
            value: notDeveloped,
            label: 'Not developed by 2060',
            color: colorMap.dev[4],
            tooltip: 'Area not affected by development projections up to 2060.'
        });
    }
    createInlineBarChart(d3.select('#Dev_Bars'), devData, details.hectares);


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
                    color: chartColors4[i],
                    labelColor: labelColors4[i],
                    tooltip: landOwnershipInfo[i]
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
        ownershipData.push({
            label: 'Other Lands',
            value: details.hectares - totalManaged,
            color: chartColors4[4],
            labelColor: labelColors4[4],
            tooltip: landOwnershipInfo[4]
        });
    }

    createPieChart(d3.select('#Owner_Chart'), ownershipData, details.hectares);

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


    updateNodeVisibility(['#SidebarContents', '#Details', '#DetailsHeader'], ['#SidebarLoadingScrim']);
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
// TODO: expect inputs to be sorted properly
function createInlineBarChart(node, data, totalArea) {
    width = 324;

    var formatter = d3.format(',');
    var values = data.map(function(d){ return d.value });
    var scale = d3.scale.linear().range([0, width]).domain([0, d3.max(values)]);

    node.html('');
    node.selectAll('div')
        .data(data).enter()
        .append('div')
        .each(function(d) {
            node = d3.select(this);

            node.append('div')
                .classed('horiz-bar-title', true)
                .html(d.label);

            var row = node.append('div').classed('node-highlight', true);

            row.append('div')
                .classed('bar inline-middle', true)
                .style('width', scale(d.value) + 'px')
                .style('background-color', d.color);

            row.append('label')
                .classed('quieter horiz-bar-label inline-middle small', true)
                .html(pctFormatter(100 * d.value / totalArea));

            if (d.tooltip) {
                connectTooltip(row, {
                    title: d.label,
                    subtitle: '<div class="right quieter">' + intFormatter(d.value) + ' ha</div>' +
                        '<div class="colorpatch" style="background-color: ' + d.color + ' "></div>' +
                        pctFormatter(100 * d.value / totalArea),
                    subtitleClass: 'small',
                    text: d.tooltip
                });
            }
        });
}




function createPieChart(node, data, totalArea){
    var width = 240,
        height = 240;

    function dynamicPctFormatter(d){
        var pct = 100 * d / totalArea;
        if (pct < 1) {
            return '<span class="smaller">&lt;</span>1%';
        }
        return d3.format('.0f')(pct) + '%';
    }


    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .margin({top: 0, right: 0, bottom: 0, left: 0})
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLegend(false)
            .showLabels(false)
            .color(function(d){ return d.color })
            .valueFormat(dynamicPctFormatter);

        node.html('');
        node.append('svg')
            .classed('inline-middle', true)
            .style({
                width: width + 'px',
                height: height + 'px',
                'margin-left': '-18px'
            })
            .datum(data.filter(function(d){return d.value >= 1}))
            .call(chart);

        var legendContainer = node.append('div').classed('inline-middle', true);

        legendContainer.append('div').classed('small quieter', true).style('padding', '4px 4px 4px 8px').text('% of area within watershed');

        legendContainer.append('ul')
            .classed('inline-middle legend legend-chart', true)
            .selectAll('li')
            .data(data.filter(function(d){ return d.value > 0 }))  //TODO: confirm
            .enter().append('li')
            .classed('small', true)
            .each(function(d){
                var node = d3.select(this);

                if (d.value > 0) {
                    node.append('div').classed('colorpatch', true).style('background', d.color)
                        .html(pctFormatter(100 * d.value / totalArea))
                        .style('color', d.labelColor);

                    node.append('div').classed('inline-middle label', true).html(d.label);
                }

                if (d.tooltip) {
                    node.classed('node-highlight', true);
                    connectTooltip(node, {
                        title: d.label,
                        subtitle: '<div class="right quieter">' + intFormatter(d.value) + ' ha</div>' +
                            '<div class="colorpatch" style="background-color: ' + d.color + ' "></div>' +
                            dynamicPctFormatter(d.value),
                        subtitleClass: 'small',
                        text: d.tooltip
                    });
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



//var intFormatter = d3.format('.0f');
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



/* inputs are selected nodes or selectors */
function updateNodeVisibility(visibleNodes, hiddenNodes) {
    if (visibleNodes) {
        visibleNodes.forEach(function (n) {
            d3.select(n).classed('hidden', false)
        });
    }
    if (hiddenNodes){
        hiddenNodes.forEach(function(n){
            d3.select(n).classed('hidden', true)
        });
    }

}

function closeTutorial(container) {
    container = container || document.getElementById('TutorialContainer');
    var videoFrame = container.querySelector('iframe');
    container.style.display = '';
    videoFrame.src = videoFrame.src;
}

d3.selectAll('#TutorialButtonBig, #TutorialButtonSmall').on('click', function() {
    var tutorialContainer = document.getElementById('TutorialContainer');
    if (tutorialContainer.style.display != '') {
        closeTutorial(tutorialContainer);
    } else {
        d3.event.stopPropagation();
        tutorialContainer.style.display = 'block';
    }
});

d3.select('#SharePageButton').on('click', function() {
    var sharePageContainer = document.getElementById('SharePageContainer');
    if (sharePageContainer.style.display != '') {
        sharePageContainer.style.display = '';
    } else {
        d3.event.stopPropagation();
        var urlInput = sharePageContainer.querySelector('input');
        urlInput.value = getStatusUrl();
        sharePageContainer.style.display = 'block';
        urlInput.select();
    }
});

function getStatusUrl() {
    /* Returns a query string in form of [category][chartId]=[level,][comma-separated-active-filters]
    For example `p2=3,4&t8=slr2,1,3` means following filters are active:
        - Priority filter with id=2 (i.e. clip), rows 3 & 4
        - Threat filter slr, scenario 2 (i.e. 2 meters), rows 1 & 3
    * */
    var q = '?';

    dc.chartRegistry.list().forEach(function(c){
        var anchorName = c.anchorName();    // is in form of FilterChart-[category]
        var prefix = filterCategories[anchorName];  // returns p for priority filters and t for threats

        if (!prefix || !c.filters().length) {
            return
        }

        var cf = '';
        if (prefix === 't') {
            // t for threats
            var threatType = anchorName.search('-') + 1;
            var level = threatLevel[anchorName.substr(threatType)];
            cf += level + ',';
        }
        cf += c.filters().join(',');
        var cid = c.chartID().toString();
        q += prefix +  cid + '=' + cf + '&';
    });

    for(var f in activeFiltersByTab['LandUseFilter']) {
        if (activeFiltersByTab['LandUseFilter'][f]) {
            // l for land use
            q += 'l' + f.substr(2) + '=' + document.querySelector('#Filter-' + f.substr(2) + ' input.slider-value').value + '&';
        }
    }

    for(var f in activeFiltersByTab['SppFilter']) {
        if (activeFiltersByTab['SppFilter'][f]) {
            var v = document.querySelector('#Filter-' + f + ' input.slider-value').value;
            if (v > 0) {
                // s for species
                q += 's' + f + '=' + v + '&';
            }
        }
    }

    if (selectedIds.length > 0) {
        // i for id
        q += 'i=' + selectedIds.join(',') + '&';
    }

    var mapCenter = map.getCenter();
    q += 'g=' + selectedGroup + '&f=' + selectedField + '&m=' + Math.round(mapCenter.lat * 100000) / 100000  + ',' + Math.round(mapCenter.lng * 100000) / 100000 + ',' + map.getZoom();

    return window.location.origin + window.location.pathname + q;
}


function restorePage(url) {
    var q = /\?(.+)/.exec(url.replace(/&$/, ''));
    if (!q) {
        return
    }

    // clear all charts - just to be sure!
    dc.chartRegistry.list().forEach(function(chart) {
        chart.filterAll();
    });

    var filters = JSON.parse('{"' + decodeURI(q[1].replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}');
    var chartList = dc.chartRegistry.list();

    for (var i in filters) {
        var prefix = i[0];
        var activeFilter = filters[i];
        var k = i.substr(1);
        var chart = chartList[k - 1];
        var sectionEl;
        var header, section;

        if (prefix === 'm') {
            // m is for map!
            var mapStatus = activeFilter.split(',');
        } else if (prefix === 'p') {
            selectTab(d3.select('#MainSidebarHeader li[data-tab=PriorityFilter]'));
            sectionEl = chart.root().node().parentElement.parentElement;
            section = d3.select(sectionEl);
            header = d3.select(sectionEl.querySelector('h4'));

            initializeFilterCharts(chart, activeFilter.split(','), section, header);
        } else if (prefix === 't') {
            // first we activate the threat tab
            selectTab(d3.select('#MainSidebarHeader li[data-tab=ThreatsFilter]'));

            var firstComma = activeFilter.search(',');
            var threatType = activeFilter.substr(0, firstComma);
            activeFilter = activeFilter.substr(firstComma + 1);
            var filterName = threatType.substr(0, 3);
            var headerEl = document.querySelector('#Filter-' + filterName + ' h4');
            header = d3.select(headerEl);
            section = d3.select(headerEl.parentElement);
            var newChart = updateThreatChart(threatType, filterName, header);
            if (newChart) {
                chart = newChart;
                // newChart means the active filter is under a different scenario than the default one; so let's check the correct radio input
                headerEl.parentElement.querySelectorAll('.radio-container input:checked').checked = false;
                headerEl.parentElement.querySelectorAll('.radio-container input')[window[filterName + 'RadioOrder'].indexOf(threatType)].checked = true;
            }

            initializeFilterCharts(chart, activeFilter.split(','), section, header);
        } else if (prefix === 'l') {
            selectTab(d3.select('#MainSidebarHeader li[data-tab=LandUseFilter]'));
            initializeSliderCharts(k, activeFilter, 'lu' + k);
        } else if (prefix === 's') {
            selectTab(d3.select('#MainSidebarHeader li[data-tab=SppFilter]'));
            var selectEl = document.querySelector('#SppFilter option[value=' + k + ']').parentElement;
            selectEl.value = k;
            speciesSelect.bind(selectEl)();
            initializeSliderCharts(k, activeFilter, k);
        } else if (prefix === 'i') {
            ids = activeFilter.split(',');
            ids.forEach( function(id) {
                selectUnit(id);
            })
        } else if (prefix === 'g') {
            selectedGroup = activeFilter;
        } else if (prefix === 'f') {
            selectedField = activeFilter;
        }
    }
    selectTab(d3.select('#MainSidebarHeader li[data-tab=Intro]'));
    dc.redrawAll();
    updateMap();
    if (mapStatus) {
        map.setView(L.latLng(mapStatus[0], mapStatus[1]), mapStatus[2]);
    }

    setSelectedField(
        selectedField,
        selectedGroup,
        typeof legendSubheading[selectedGroup] === 'object' ? (legendSubheading[selectedGroup][selectedField] || legendSubheading[selectedGroup]['default']) : legendSubheading[selectedGroup]
    );

    d3.select('.mapped').classed('mapped', false);
    d3.select('[data-field^=' + selectedField + ']').classed('mapped', true);
}

function initializeFilterCharts(chart, values, section, header) {
    values.forEach(function (v) {
        chart.filter(v);
    });

    section.classed('expanded', true);
    section.select('h4 + div').classed('hidden', false);
    header.select('.fa-caret-right').classed('fa-caret-right', false).classed('fa-caret-down', true);
}


function initializeSliderCharts(filterName, value, dim) {
    var sliderInputs = document.querySelectorAll('#Filter-' + filterName + ' input');
    for (var s = sliderInputs.length; s; s--) {
        sliderInputs[s-1].value = value;
    }
    dimensions[dim].filterRange([value, document.querySelector('#Filter-' + filterName + ' input[type=range]').getAttribute('max') + 1]);
    updateTabIndicator(dim, true);
}


function updateThreatChart(level, d, header) {
    var threat = level.slice(0, 3);
    var curLevel = threatLevel[threat];

    if (level === curLevel) return;

    var chartID = 'FilterChart-' + threat;
    var chart = _.find(dc.chartRegistry.list(), function(d){ return d.root().node().id === chartID });

    // recreate chart
    dc.deregisterChart(chart);  // have to deregister manually, otherwise it sticks around
    var chartNode = d3.select(chart.root().node());
    chartNode.empty();
    chart = createFilterChart(chartNode, level, header, fieldLabels[d] + ': ' + fieldLabels[level]);

    threatLevel[threat] = level;
    return chart
}