(function () {
    // save old getContext
    var oldgetContext = HTMLCanvasElement.prototype.getContext;

    // get a context, set it to smoothed if it was a 2d context, and return it.
    function getSmoothContext(contextType) {
        var resCtx = oldgetContext.apply(this, arguments);

        function setToFalse(obj, prop) {
            if (obj[prop] !== undefined) {
                obj[prop] = false;
            }
        }

        var smoothing = ['imageSmoothingEnabled', 'mozImageSmoothingEnabled', 'oImageSmoothingEnabled', 'webkitImageSmoothingEnabled'];
        if (contextType == '2d') {
            smoothing.forEach(function(s) {
                setToFalse(resCtx, s);
            });
        }

        return resCtx;
    }

// inject new smoothed getContext
    HTMLCanvasElement.prototype.getContext = getSmoothContext;

    window.map = L.map(document.getElementById('Map'), {
        maxZoom: 12,
        minZoom: 5,
        maxBounds: L.latLngBounds(L.latLng(23, -90), L.latLng(32, -76)),
        preferCanvas: true,
        attributionControl: false
    });

    function thumbnailBounds() {
        var tb = {
            west: -90,
            south: 21.94,
            east: -78.75,
            north: 31.95
        };

        var xRatio = 256 / (tb.east - tb.west);
        var yRatio = 256 / (tb.south - tb.north);

        var studyAreaBounds = map.getBounds();
        var right = xRatio * (studyAreaBounds.getEast() - tb.west);
        var left = xRatio * (studyAreaBounds.getWest() - tb.west);
        var top = yRatio * (studyAreaBounds.getNorth() - tb.north);
        var bottom = yRatio * (studyAreaBounds.getSouth() - tb.north);

        right = Math.min(right, 256);
        left = Math.max(left, 0);
        top = Math.max(top, 0);
        bottom = Math.min(bottom, 256);

        var thumbnailBound = document.getElementById('StudyArea');
        thumbnailBound.style.top = top + 1;
        thumbnailBound.style.left = left + 1;
        thumbnailBound.style.width = right - left - 1;
        thumbnailBound.style.height = bottom - top - 1;
    }

    function roundPrecision(value, precision) {
      var factor = Math.pow(10, precision);
      return Math.round(value * factor) / factor;
    }

    function updateAccessUrl() {
        var accessUrls = document.querySelectorAll('.accessUrl');
        var oldUrl = accessUrls[0].href;
        var newUrl = oldUrl.replace(/(&|\?)m=(.*?)(&|$)/, function (match, p1, p2, p3, offset, string) {
            var c = map.getCenter();
            return p1 + 'm=' + roundPrecision(c.lat, 5) + ',' + roundPrecision(c.lng, 5) + ',' + map.getZoom() + p3;
        });
        for (var n = accessUrls.length; n; n--) {
            accessUrls[n - 1].href = newUrl;
        }
    }

    map.on('moveend', function (e) {
        var bounds = map.getBounds();
        document.getElementById('BoundNorth').innerHTML = roundPrecision(bounds.getNorth(), 2) + '&deg; N';
        document.getElementById('BoundSouth').innerHTML = roundPrecision(bounds.getSouth(), 2) + '&deg; S';
        document.getElementById('BoundEast').innerHTML = roundPrecision(bounds.getEast(), 2) + '&deg; E';
        document.getElementById('BoundWest').innerHTML = roundPrecision(bounds.getWest(), 2) + '&deg; W';

        thumbnailBounds();
        updateAccessUrl();
    });

    L.tileLayer('//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        subdomains: ['server', 'services']
    }).addTo(map);

    function processMaps(callback) {
        leafletImage(map, function (err, canvas) {
            var img = document.createElement('img');
            img.width = canvas.width;
            img.height = canvas.height;
            img.src = canvas.toDataURL();

            var mapContainer = map.getContainer();
            mapContainer.parentNode.replaceChild(img, mapContainer);
            callback();
        })
    }

    function rgb2hex(rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
    }

    var px2pt = 0.264583 * 72 / 25.4; // i.e. 0.75

    function processTexts(el) {
        var node, texts = [];
        var walk = document.createTreeWalker(
            el,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (n) {
                    if (n.parentNode.classList.contains('selectableText')) {
                        //if (/\bselectableText\b/.test(n.parentNode.className)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false);
        var elRect = el.getBoundingClientRect();
        while (node = walk.nextNode()) {
            var textContent = node.textContent.trim();
            if (textContent) {
                var rect = node.parentNode.getBoundingClientRect();
                var style = getComputedStyle(node.parentNode);
                var color = rgb2hex(style.color);
                texts.push({
                    text: textContent,
                    url: node.parentNode.getAttribute('href') || '',
                    pos: {x: (rect.left - elRect.left) * px2pt, y: (rect.top - elRect.top) * px2pt},
                    style: {
                        font: style.font || 'sans-serif',
                        fontSize: Math.floor(parseInt(style.fontSize.match(/(\d+)/)[1]) * px2pt),
                        fontStyle: style.fontWeight >= 700 ? 'bold' : 'normal',
                        color: color
                    }
                });
                node.parentNode.style.color = '#fff';
            }
        }
        return texts;
    }

    window.generateReport = function(pdfOptions, processed, callback) {
        if (processed) {
            makePDF();
        } else {
            processMaps(makePDF);
        }

        function makePDF() {
            var pdf = new jsPDF(pdfOptions);
            var pages = Array.prototype.slice.call(document.querySelectorAll('.page')).reverse();

            window.scrollTo(0, 0);  // fixes a bug in chrome; scrolling the preview iframe distorts the final canvas.
            function page2pdf(pages) {
                var page = pages.pop();
                if (!page) {
                    pdf.save('report.pdf');
                    processed = true;
                    callback(processed);
                    return
                }

                var texts = processTexts(page);

                var topX = 0, topY = 15;
                pdf.addHTML(page, topX, topY, {
                    background: '#fff',
                    logging: false
                }, function () {
                    texts.forEach(function (t) {
                        pdf.setFont(t.style.font)
                            .setTextColor(t.style.color)
                            .setFontSize(t.style.fontSize)
                            .setFontStyle(t.style.fontStyle);
                        if (t.url) {
                            pdf.textWithLink(t.text, t.pos.x - 35 * (t.pos.x / 612), t.pos.y + 25 * (1 - t.pos.y / 792), {url: t.url});
                        } else {
                            pdf.text(t.text, t.pos.x - 55 * (t.pos.x / 612), t.pos.y + 25 * (1 - t.pos.y / 792));
                        }
                    });
                    page2pdf(pages);
                    pdf.addPage();
                });
            }

            page2pdf(pages);
        }
    }
})();