/**
 * reporter.js v0.0.0
 * https://github.com/....
 */

var requirements = [
    {
        lib: 'Handlebars',
        script: 'static/reporter/deps/handlebarsjs/handlebars-v4.0.5.js',
        loadType: 'object'
    }
];

function loadRequirements(libs, callback) {
    var el = libs.shift();
    if (typeof(window[el['lib']]) != el['loadType'] || 'function') {
        var libScript = document.createElement('script');
        libScript.type = 'text/javascript';
        libScript.src = el['script'];
        if (libs.length > 0) {
            libScript.onload = function () {
                loadRequirements(libs, callback);
            };
        } else if (typeof(callback) != 'undefined') {
            libScript.onload = callback;
        }
        if (el['css']) {
            var libCSS = document.createElement('link');
            libCSS.rel = 'stylesheet';
            libCSS.href = el['css'];
            (document.getElementsByTagName('head')[0]).appendChild(libCSS);
        }
        (document.getElementsByTagName('head')[0]).appendChild(libScript);
    } else {
        loadRequirements(libs, callback);
    }
}

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
                //} else if (!/\bhidden\b/.test(layer._path.className)) { // IE does not support classList on svg, so regex is used to test whether the elements has hidden class
                // main map is using svg, while preview must use canvas in order to use leaflet-image; therefore styles set by CSS must be converted somehow.
                var layerOptions = layer.options;

                layerOptions['fillOpacity'] = 0.75;
                //if (/\bselected\b/.test(layer._path.className)) {
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
                L.geoJson(layer.toGeoJSON(), {style: layerOptions}).addTo(child);
            }
        }
    },
    studyArea: function (parent, child, iframe) {
        // why is this here?
        var tb = {
            west: -90,
            south: 21.94,
            east: -78.75,
            north: 31.95
        };

        var xRatio = 256 / (tb.east - tb.west);
        var yRatio = 256 / (tb.south - tb.north);

        var studyAreaBounds = parent.getBounds();
        var right = xRatio * (studyAreaBounds.getEast() - tb.west);
        var left = xRatio * (studyAreaBounds.getWest() - tb.west);
        var top = yRatio * (studyAreaBounds.getNorth() - tb.north);
        var bottom = yRatio * (studyAreaBounds.getSouth() - tb.north);

        right = right > 256 ? 256 : right;
        left = left < 0 ? 0 : left;
        top = top < 0 ? 0 : top;
        bottom = bottom > 256 ? 256 : bottom;

        var thumbnailBound = iframe.contentDocument.getElementById('studyArea');
        thumbnailBound.style.top = top + 1;
        thumbnailBound.style.left = left + 1;
        thumbnailBound.style.width = right - left - 1;
        thumbnailBound.style.height = bottom - top - 1;
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

        var svgPrefix = {
            xmlns: "http://www.w3.org/2000/xmlns/",
            xlink: "http://www.w3.org/1999/xlink",
            svg: "http://www.w3.org/2000/svg"
        };

        var template;
        loadRequirements(requirements, function () {
            for (var i in options.templateHelpers) {
                Handlebars.registerHelper(i, options.templateHelpers[i]);
            }
            template = Handlebars.compile(options['preview_template']);
        });

        for (var op in userOptions) {
            options[op] = userOptions[op];
        }

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
        printButton.classList.add('button', 'print', 'controlButton', 'disabled');
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
        toolbar.appendChild(printButton);

        var closeButton = document.createElement('button');
        closeButton.innerHTML = 'x';
        closeButton.classList.add('button', 'close', 'controlButton', 'right');
        closeButton.addEventListener('click', function (e) {
            hidePreview();
        });
        toolbar.appendChild(closeButton);

        function showPreview() {
            processed = false;
            printButton.classList.add('disabled');
            iframe = document.createElement('iframe');
            preview.appendChild(iframe);
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
                iframe.onload = function () {
                    syncMaps();
                    printButton.classList.remove('disabled');
                    scrim.style.display = 'none';
                };
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