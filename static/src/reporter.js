function cssInliner(el) {
    var cssProperties = getComputedStyle(el, null);
    var cssText = '';
    for (var i = 0; i < cssProperties.length; i++) {
        cssText += cssProperties[i] + ':' + cssProperties.getPropertyValue(cssProperties[i]) + ';'
    }

    el.style.cssText = cssText;

    for (var j = 0; j < el.childElementCount; j++) {
        cssInliner(el.children[j]);
    }
}

var mapSyncFuncs = {
    // each function get a parent and child, both instances of Leaflet.map
    zoom: function (parent, child) {
        child.setZoom(parent.getZoom());
    },
    center: function (parent, child) {
        child.panTo(parent.getCenter());
    },
    layers: function (parent, child) {
        var Leaflet = document.querySelector('.preview iframe').contentWindow.L;
        parent.eachLayer(function (layer) {
            if (layer.toGeoJSON) {
                addLayer(layer, parent, child);
            }
        });

        function addLayer(layer, parent, child) {
            if (layer.getLayers) {
                layer.getLayers().forEach(function (l) {
                    addLayer(l, parent, child);
                });
            } else if (!layer._path.classList.contains('hidden')) {
                // main map is using svg, while preview must use canvas in order to use leaflet-image; therefore styles set by CSS must be converted somehow.
                var layerOptions = layer.options;

                layerOptions['fillOpacity'] = 0.75;
                if (layer._path.classList.contains('selected')) {
                    layerOptions['color'] = '#e6550d';
                    layerOptions['weight'] = 2;
                    layerOptions['opacity'] = 1;
                } else {
                    layerOptions['color'] = '#333';
                    layerOptions['weight'] = 0.5;
                    layerOptions['opacity'] = 0.5;
                }
                delete layerOptions['nonBubblingEvents'];
                Leaflet.geoJson(layer.toGeoJSON(), {style: layerOptions}).addTo(child);
            }
        }
    }
};

function textNodesUnder(el) {
    // returns an array containing all texts within the passed DOM element.
    var n, a = [];
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (n = walk.nextNode()) {
        a.push(n);
    }
    return a;
}

(function (document) {
    var name = 'pdfReporter',
        global = this,
        old$ = global.$,
        oldN = global[name];

    function $(userOptions) {
        "use strict";

        var options = {
            copyStyle: false
        };

        for (var op in userOptions) {
            options[op] = userOptions[op];
        }

        for (var i in options.templateHelpers) {
            Handlebars.registerHelper(i, options.templateHelpers[i]);
        }
        var template = Handlebars.compile(options['preview_template']);

        var processed = false;
        var activeProcesses = 0;
        var tmplData = {};
        var tmplSvgData = {};
        var xmlns_url = 'http://www.w3.org/2000/xmlns/';

        var container = document.createElement('div');
        container.classList.add('pdfReporterContainer');
        document.querySelector('body').appendChild(container);

        var scrim = document.createElement('div');
        scrim.classList.add('scrim');

        var spinner = document.createElement('div');
        spinner.classList.add('spinner');
        scrim.appendChild(spinner);

        var progress = document.createElement('div');
        progress.classList.add('progress');
        scrim.appendChild(progress);

        container.appendChild(scrim);

        var curtain = document.createElement('div');
        curtain.classList.add('curtain');
        container.appendChild(curtain);

        var preview = document.createElement('div'),
            iframe;
        preview.classList.add('preview');
        container.appendChild(preview);

        var toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');
        preview.appendChild(toolbar);

        var printButton = document.createElement('button');
        printButton.innerHTML = 'Download PDF';
        printButton.classList.add('button', 'print', 'button-primary', 'disabled');
        toolbar.appendChild(printButton);

        printButton.addEventListener('click', function (e) {
            scrim.style.display = 'block';
            if (!processed) {
                processForms();
            }
            iframe.contentWindow.generateReport(options.pdfOptions, processed, updateProgress, function (processSuccessful) {
                processed = processSuccessful;
                scrim.style.display = 'none';
                setTimeout(hidePreview, 1000);
            });
        });

        var closeButton = document.createElement('span');
        closeButton.classList.add('fa', 'fa-times-circle', 'right');
        closeButton.addEventListener('click', function (e) {
            hidePreview();
        });
        toolbar.appendChild(closeButton);

        function showPreview() {
            processStart();
            processed = false;
            printButton.classList.add('disabled');
            iframe = document.createElement('iframe');
            iframe.setAttribute('frameborder', '0');
            preview.appendChild(iframe);
            container.classList.add('active');
            scrim.style.display = 'block';

            tmplData = {};
            tmplSvgData = {};
            addDomElements();
            addData();
            processEnd();
        }

        function hidePreview() {
            container.classList.remove('active');
            preview.removeChild(iframe);
        }

        function processStart() {
            activeProcesses++;
        }

        function processEnd() {
            if (!--activeProcesses) {
                iframe.contentWindow.document.open('text/html', 'replace');
                iframe.contentWindow.document.write(Handlebars.compile(template(tmplData))(tmplSvgData));
                iframe.contentWindow.document.close();

                iframe.onload = function () {
                    syncMaps();
                    printButton.classList.remove('disabled');
                    scrim.style.display = 'none';
                }
            }
        }

        function updateProgress(value) {
            if (!isNaN(value)) {
                progress.innerText = value + '%';
            } else {
                progress.innerText = '';
            }
        }

        function addDomElements() {
            if (!options.data.dom) {
                return;
            }

            options.data.dom.forEach(function (d) {
                if (d.hasOwnProperty('condition') && !(typeof d.condition == 'function' ? d.condition() : d.condition)) {
                    return
                }

                tmplData[d.tmpl] = [];

                var elements = [];
                if (typeof d.query == 'function') {
                    elements = d['query']();
                } else {
                    elements = document.querySelectorAll(d.query);
                }

                for (var idx = 0; idx < elements.length; idx++) {
                    var el = elements[idx].cloneNode(true);
                    el.classList.add('cloned');

                    var namedClones = el.querySelectorAll('[name]');
                    // name attr should be changed to avoid conflicts in the parent document after inserting the cloned element,
                    // especially in case of radio buttons
                    for (var i = 0; i < namedClones.length; i++) {
                        namedClones[i].name = 'cloned-' + namedClones[i].name;
                    }

                    // this part is a workaround for a bug in Chrome which causes getComputedStyle to return an empty string.
                    elements[idx].parentElement.insertBefore(el, elements[idx]);
                    el.style.display = 'none';

                    if (options.copyStyle) {
                        cssInliner(el);
                    }

                    // TODO: svg processing happens after calling the callback function. It should be restructured so users can manipulate converted svg objects too.
                    var svgNodes = el.querySelectorAll('svg');
                    var svgCollection = {};
                    for (var i = 0; i < svgNodes.length; i++) {
                        var svgEl = svgNodes[i].cloneNode(true);
                        var svgPlaceholder = d.tmpl + '-' + idx + '-' + i;
                        svgCollection[svgPlaceholder] = svgEl;
                        svgNodes[i].parentElement.replaceChild(document.createTextNode('{{{ ' + svgPlaceholder + '}}}'), svgNodes[i]);
                    }

                    el.style.display = 'block';
                    var processedEl = el;
                    if (typeof d.postProcess === 'function') {
                        processedEl = d.postProcess(el, elements[idx]);
                    }

                    tmplData[d.tmpl].push(processedEl.outerHTML);
                    el.parentNode.removeChild(el);

                    for (var s in svgCollection) {
                        processSVG(svgCollection[s], s, d.svgStyle);
                    }
                }
            });
        }

        function processSVG(svgEl, svgPlaceholder, style) {
            processStart();

            /** idea from https://github.com/NYTimes/svg-crowbar **/
            svgEl.setAttribute('version', '1.1');
            if (!svgEl.hasAttribute('width')) {
                svgEl.setAttribute('width', svgEl.style.width);
            }
            if (!svgEl.hasAttribute('height')) {
                svgEl.setAttribute('height', svgEl.style.height);
            }

            var defsEl = document.createElement('defs');
            svgEl.insertBefore(defsEl, svgEl.firstChild);

            var styleEl = document.createElement('style');
            defsEl.appendChild(styleEl);
            styleEl.setAttribute('type', 'text/css');

            // removing attributes so they aren't doubled up
            svgEl.removeAttribute('xmlns');
            svgEl.removeAttribute('xlink');

            // These are needed for the svg
            if (!svgEl.hasAttributeNS(xmlns_url, 'xmlns')) {
                svgEl.setAttributeNS(xmlns_url, 'xmlns', 'http://www.w3.org/2000/svg');
            }

            if (!svgEl.hasAttributeNS(xmlns_url, 'xmlns:xlink')) {
                svgEl.setAttributeNS(xmlns_url, 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
            }

            var svgString = (new XMLSerializer()).serializeToString(svgEl).replace('</style>', '<![CDATA[' + (options.svgStyle || '') + (style || '') + ']]></style>');
            var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});

            var reader = new FileReader();
            reader.readAsDataURL(svgBlob);
            reader.onloadend = function () {
                tmplSvgData[svgPlaceholder] = '<img src="' + reader.result + '" />';
                processEnd();
            };
        }

        function addData() {
            if (options.data.misc) {
                options.data.misc.forEach(function (d) {
                    tmplData[d.tmpl] = typeof d.value == 'function' ? d.value() : d.value;
                });
            }
        }

        function syncMaps() {
            if (options.data.maps) {
                options.data.maps.forEach(function (m) {
                    var parent = window[m.parentMap],
                        child = iframe.contentWindow[m.tmplMap];
                    m.sync.forEach(function (s) {
                        mapSyncFuncs[s](parent, child, iframe);
                    })
                });
            }
        }

        function processForms() {
            var inputs = iframe.contentDocument.querySelectorAll('input, textarea');
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                var inputReplacement = document.createElement('div');
                inputReplacement.innerHTML = input.value;
                inputReplacement.style.height = input.offsetHeight + 'px';
                inputReplacement.style.width = input.offsetWidth + 'px';
                input.parentElement.replaceChild(inputReplacement, input)
            }
        }

        return {
            showPreview: showPreview,
            hidePreview: hidePreview
        };
    }

    global.$ = global[name] = $;

    $.noConflict = function (all) {
        if (all) {
            global[name] = oldN;
        }
        global.$ = old$;
        return $;
    };
})(document);


/* Setting up the reporter */
var xhr = new XMLHttpRequest();
var reporter;

xhr.open('GET', 'preview.html');
xhr.onload = function () {
    if (xhr.status === 200) {
        reporter = pdfReporter({
            preview_template: xhr.responseText,
            pdfOptions: {
                orientation: 'p',
                format: 'letter',
                unit: 'pt'
            },
            copyStyle: false,
            templateHelpers: { // Handlebars helpers
                joinFilters: function (charts, sliders, options) {
                    // filters are formed into groups of 3 so each page in the template only shows 3!
                    var pages = [], filters, i, chartsVoid, pageData = options.data.root;

                    for (i = 0; i < charts.length; i += 3) {
                        filters = charts.slice(i, i + 3);
                        if (i + 3 >= charts.length) {
                            /* determines how much space is left on the last chart page;
                             each chart is roughly equivalent to 3 sliders;
                             so the remainder of the last page can be filled with sliders. */
                            chartsVoid = 3 - filters.length;
                            filters = filters.concat(sliders.slice(0, chartsVoid * 3));
                            sliders = sliders.slice(chartsVoid * 3);
                        }
                        pageData['filters'] = filters;
                        pages.push(options.fn(pageData));
                    }

                    for (i = 0; i < sliders.length; i += 9) {
                        pageData['filters'] = sliders.slice(i, i + 9);
                        pages.push(options.fn(pageData));
                    }

                    return pages;
                }
            },
            svgStyle: '.nvd3.nv-pie{width:240px;height:240px}.nvd3.nv-pie path{fill-opacity:0.7;stroke: #aaa}',
            data: {
                dom: [
                    {
                        tmpl: 'legend',
                        query: '#Legend',
                        postProcess: function (processedEl, originalEl) {
                            for (var i = processedEl.children.length; i--;) {
                                if (processedEl.children[i].getAttribute('title') == 'Layer transparency') {
                                    processedEl.removeChild(processedEl.children[i]);
                                }
                            }
                            return processedEl
                        }
                    },
                    {
                        tmpl: 'charts',
                        query: function () {
                            var headers = document.querySelectorAll('.filtered');
                            var filters = [];
                            for (var i = 0; i < headers.length; i++) {
                                filters.push(headers[i].parentElement);
                            }
                            return filters;
                        },
                        svgStyle: 'rect.bar{stroke:none}rect.stack1{stroke:none;fill:red}rect.stack2{stroke:none;fill:green}rect.deselected{stroke:none;fill:#ccc;}.axis path,.axis line{fill:none;stroke:#000;shape-rendering:crispEdges;}.axis text{font:10px sans-serif}.grid-line,.axis .grid-line{fill:none;stroke:#ccc;opacity:.5;shape-rendering:crispEdges}.grid-line line,.axis .grid-line line{fill:none;stroke:#ccc;opacity:.5;shape-rendering:crispEdges}g.row text{fill: black;font-size: 12px}g.row rect{fill-opacity: 0.8}',
                        postProcess: function (processedEl, originalEl) {
                            var filterDiv = document.createElement('div');
                            filterDiv.classList.add('chart');

                            processedEl.querySelector('.filter-reset').remove();

                            // Replacing radio containers with label of selected input
                            var radioContainers = processedEl.querySelectorAll('.filter-radio-container');
                            for (var i = 0; i < radioContainers.length; i++) {
                                radioContainers[i].parentElement.replaceChild(
                                    radioContainers[i].querySelector(':checked').parentElement.querySelector('label'),
                                    radioContainers[i]
                                );
                            }
                            filterDiv.appendChild(processedEl);

                            var tooltipDiv = document.createElement('div');
                            tooltipDiv.classList.add('tooltip');
                            tooltipDiv.innerHTML = fieldTooltips[d3.select(originalEl).data()[0]]; // tooltips are added dynamically by d3
                            filterDiv.appendChild(tooltipDiv);

                            return filterDiv;
                        }
                    },
                    {
                        tmpl: 'watersheds',
                        query: '#PFLCC_SelectedWS_List',
                        condition: function () {
                            return selectedIds.length > 0
                        },
                        postProcess: function (processedEl, originalEl) {
                            var allTexts = textNodesUnder(processedEl);
                            for (var i = allTexts.length; i > 0; i--) {
                                allTexts[i-1].parentElement.classList.add('selectableText');
                            }
                            processedEl.style = 'font-size:1.3em;';
                            return processedEl;
                        }
                    },
                    {
                        tmpl: 'priorityResources',
                        query: '#PFLCC_PR_Bars',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'CLIP_Chart',
                        query: '#CLIP_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Bio_Chart',
                        query: '#Bio_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'BioRareSpp_Chart',
                        query: '#BioRareSpp_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'BioSHCA_Chart',
                        query: '#BioSHCA_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'BioSHCATable',
                        query: '#BioSHCATable',
                        condition: function () {
                            return selectedIds.length > 0
                        },
                        postProcess: function (processedEl, originalEl) {
                            var allTexts = textNodesUnder(processedEl);
                            for (var i = allTexts.length; i > 0; i--) {
                                allTexts[i-1].parentElement.classList.add('selectableText');
                            }
                            return processedEl;
                        }
                    },
                    {
                        tmpl: 'BioPNC_Chart',
                        query: '#BioPNC_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'BioPNC_Table',
                        query: '#BioPNC_Table',
                        condition: function () {
                            return selectedIds.length > 0
                        },
                        postProcess: function (processedEl, originalEl) {
                            var allTexts = textNodesUnder(processedEl);
                            for (var i = allTexts.length; i > 0; i--) {
                                allTexts[i-1].parentElement.classList.add('selectableText');
                            }
                            return processedEl;
                        }
                    },
                    {
                        tmpl: 'BioSppRich_Chart',
                        query: '#BioSppRich_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'BioSppRichTable',
                        query: '#BioSppRichTable',
                        condition: function () {
                            return selectedIds.length > 0
                        },
                        postProcess: function (processedEl, originalEl) {
                            var allTexts = textNodesUnder(processedEl);
                            for (var i = allTexts.length; i > 0; i--) {
                                allTexts[i-1].parentElement.classList.add('selectableText');
                            }
                            return processedEl;
                        }
                    },
                    {
                        tmpl: 'Land_Chart',
                        query: '#Land_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Greenways_Chart',
                        query: '#Greenways_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'LI_Chart',
                        query: '#LI_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Water_Chart',
                        query: '#Water_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'SSW_Chart',
                        query: '#SSW_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Floodplain_Chart',
                        query: '#Floodplain_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Wetlands_Chart',
                        query: '#Wetlands_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Aquifer_Chart',
                        query: '#Aquifer_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'LU_Bars',
                        query: '#LU_Bars',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'SLR_Bars',
                        query: '#SLR_Bars',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Dev_Bars',
                        query: '#Dev_Bars',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Owner_Chart',
                        query: '#Owner_Chart',
                        condition: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'Owner_Table',
                        query: '#Owner_Table',
                        condition: function () {
                            return selectedIds.length > 0
                        },
                        postProcess: function (processedEl, originalEl) {
                            var allTexts = textNodesUnder(processedEl);
                            for (var i = allTexts.length; i > 0; i--) {
                                allTexts[i-1].parentElement.classList.add('selectableText');
                            }
                            return processedEl;
                        }
                    },
                    {
                        tmpl: 'PartnerTab',
                        query: '#PartnerTab',
                        condition: function () {
                            return selectedIds.length > 0
                        },
                        postProcess: function (processedEl, originalEl) {
                            processedEl.querySelector('.small.quiet').remove();
                            var allTexts = textNodesUnder(processedEl);
                            for (var i = allTexts.length; i > 0; i--) {
                                allTexts[i-1].parentElement.classList.add('selectableText');
                            }
                            return processedEl;
                        }
                    }
                ],
                // maps is a collection of leaflet maps in the preview template to process or sync with a map in the main page
                // tmplMap and parentMap (optional) are name of variable in the template and the main page respectively
                maps: [
                    {
                        tmplMap: 'map',
                        parentMap: 'map',
                        sync: ['zoom', 'center', 'layers']
                    }
                ],
                misc: [
                    {
                        tmpl: 'sliders',
                        value: function () {
                            var filteredSliders = document.querySelectorAll('[id^=Filter-]:not(#Filter-slr):not(#Filter-dev)');
                            var sliders = [];

                            for (var i = 0; i < filteredSliders.length; i++) {
                                var inputEl = filteredSliders[i].querySelector('input');
                                if (inputEl.value > 0) {
                                    var filterContent = '';

                                    filterContent += '<div class="slider">\
                                                    <section><b>' + filteredSliders[i].querySelector('h4').innerHTML.replace('[remove]', '') + ':</b>\
                                                    &nbsp;<i>At least ' + inputEl.value + ' ha' + '</i></section>';

                                    if (filteredSliders[i].parentElement.parentElement.id === 'LandUseFilterList') {
                                        filterContent += '<div class="tooltip">' + landUseTooltips[filteredSliders[i].id.slice(-2)] + '</div>';
                                    }

                                    filterContent += '</div>';

                                    sliders.push(filterContent);
                                }
                            }

                            return sliders;
                        }
                    },
                    {
                        tmpl: 'hasDetails',
                        value: function () {
                            return selectedIds.length > 0
                        }
                    },
                    {
                        tmpl: 'date',
                        value: function () {
                            var monthNames = [
                                'January', 'February', 'March',
                                'April', 'May', 'June', 'July',
                                'August', 'September', 'October',
                                'November', 'December'
                            ];
                            var date = new Date();
                            return monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
                        }
                    },
                    {
                        tmpl: 'access_url',
                        value: getStatusUrl
                    }
                ]
            }
        });


        var pdfButton = document.getElementById('PDFButton');
        if (pdfButton.className.indexOf('disabled') < 0) {
            document.getElementById('PDFButton').onclick = reporter.showPreview;
        }
    } else {
        console.log(new Error(xhr.statusText));
    }
};

xhr.onerror = function () {
    new Error('Network Error');
};

xhr.send();