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

function getStyles(doc) {
    /** idea from https://github.com/NYTimes/svg-crowbar **/
    var styles = '',
        styleSheets = doc.styleSheets;

    if (styleSheets) {
        for (var i = 0; i < styleSheets.length; i++) {
            processStyleSheet(styleSheets[i]);
        }
    }

    function processStyleSheet(ss) {
        if (ss.cssRules) {
            for (var i = 0; i < ss.cssRules.length; i++) {
                var rule = ss.cssRules[i];
                if (rule.type === 3) { // Type 3 is CSSImportRule
                    processStyleSheet(rule.styleSheet);
                } else {
                    // hack for illustrator crashing on descendant selectors
                    if (rule.selectorText) {
                        if (rule.selectorText.indexOf('>') === -1) {
                            styles += '\n' + rule.cssText;
                        }
                    }
                }
            }
        }
    }

    return styles;
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
        var Leaflet = document.querySelector('iframe').contentWindow.L;
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

        var svgPrefix = {
            xmlns: "http://www.w3.org/2000/xmlns/",
            xlink: "http://www.w3.org/1999/xlink",
            svg: "http://www.w3.org/2000/svg"
        };


        for (var i in options.templateHelpers) {
            Handlebars.registerHelper(i, options.templateHelpers[i]);
        }
        var template = Handlebars.compile(options['preview_template']);

        var processed = false;
        var activeProcesses = 0;
        var tmplData = {};
        var svgStyle = getStyles(window.document);

        var container = document.createElement('div');
        container.classList.add('pdfReporterContainer');
        document.querySelector('body').appendChild(container);

        var scrim = document.createElement('div');
        scrim.classList.add('scrim');
        var spinner = document.createElement('div');
        spinner.classList.add('spinner');
        scrim.appendChild(spinner);
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
        printButton.classList.add('button', 'print', 'button-default', 'disabled');
        toolbar.appendChild(printButton);

        printButton.addEventListener('click', function (e) {
            scrim.style.display = 'block';
            if (!processed) {
                processForms();
            }
            iframe.contentWindow.generateReport(options.pdfOptions, processed, function (processSuccessful) {
                processed = processSuccessful;
                scrim.style.display = 'none';
                setTimeout(hidePreview, 1000);
            });
        });

        var closeButton = document.createElement('button');
        closeButton.innerHTML = 'x';
        closeButton.classList.add('button', 'close', 'button-default', 'right');
        closeButton.addEventListener('click', function (e) {
            hidePreview();
        });
        toolbar.appendChild(closeButton);

        function showPreview() {
            processed = false;
            printButton.classList.add('disabled');
            iframe = document.createElement('iframe');
            preview.appendChild(iframe);
            iframe.onload = function () {
                syncMaps();
                printButton.classList.remove('disabled');

                scrim.style.display = 'none';
            };
            processStart();
            container.classList.add('active');
            scrim.style.display = 'block';

            tmplData = {};
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
                iframe.contentWindow.document.write(template(tmplData));
                iframe.contentWindow.document.close();
            }
        }

        function addDomElements() {
            if (!options.data.dom) {
                return;
            }

            options.data.dom.forEach(function (d) {
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
                        var svgPlaceholder = d.tmpl + '-' + i;
                        svgCollection[svgPlaceholder] = svgEl;
                        svgNodes[i].parentElement.replaceChild(document.createTextNode('{{{' + svgPlaceholder + '}}}'), svgNodes[i]);
                    }

                    el.style.display = 'block';
                    var processedEl = el;
                    if (typeof d.postProcess === 'function') {
                        processedEl = d.postProcess(el, elements[idx]);
                    }

                    tmplData[d.tmpl].push(processedEl.outerHTML);
                    el.parentNode.removeChild(el);

                    for (var s in svgCollection) {
                        processStart();
                        processSVG(svgCollection[s], d.tmpl, idx, s);
                    }
                }
            });
        }

        function processSVG(svgEl, tmpl, idx, svgPlaceholder) {
            /** idea from https://github.com/NYTimes/svg-crowbar **/
            svgEl.setAttribute("version", "1.1");

            var defsEl = document.createElement("defs");
            svgEl.insertBefore(defsEl, svgEl.firstChild);

            var styleEl = document.createElement("style");
            defsEl.appendChild(styleEl);
            styleEl.setAttribute("type", "text/css");

            // removing attributes so they aren't doubled up
            svgEl.removeAttribute("xmlns");
            svgEl.removeAttribute("xlink");

            // These are needed for the svg
            if (!svgEl.hasAttributeNS(svgPrefix.xmlns, "xmlns")) {
                svgEl.setAttributeNS(svgPrefix.xmlns, "xmlns", svgPrefix.svg);
            }

            if (!svgEl.hasAttributeNS(svgPrefix.xmlns, "xmlns:xlink")) {
                svgEl.setAttributeNS(svgPrefix.xmlns, "xmlns:xlink", svgPrefix.xlink);
            }

            var svgString = new XMLSerializer().serializeToString(svgEl).replace('</style>', '<![CDATA[' + svgStyle + ']]></style>');
            var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});

            var reader = new FileReader();
            reader.readAsDataURL(svgBlob);
            reader.onloadend = function () {
                var svgData = {};
                svgData[svgPlaceholder] = '<img src="' + reader.result + '" />';
                tmplData[tmpl][idx] = Handlebars.compile(tmplData[tmpl][idx])(svgData);
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
            copyStyle: true,
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