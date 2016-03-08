## Dependencies:

Stored in ```/deps```

* Leaflet (latest dev release)
* lodash
* crossfilter
* d3
* dc.js
* nvd3
* leaflet-omnivore
* Leaflet.Geonames (CBI github repo)
* Leaflet.ZoomBox (CBI github repo)
* font awesome



## Data processing

Data were obtained from PFLCC staff as a shapefile for each factor.

1. The main watersheds shapefile was projected to WGS84, and simplified to topojson using mapshaper.org (simplification = 3%).
Output is `features.json`.
2. Run `shp2csv.py` to extract shapefile attribute table to a CSV.  Output is a bunch of CSVs in tables subfolder
(outside this directory tree).
3. Run `extract_HUC_summary.py` to extract summary information across all watersheds.  Output is `static/summary.csv`
4. Run `glom_data.py` to extract a bunch of information for each feature.  Output is a bunch of json files under `features` folder.



## Deploy process

To deploy, this requires a deploy_settings.py file from Brendan (contains S3 keys and bucket info).

Files are deployed to `FIXME` bucket in S3.

Run `create_version.py` after updating version in that script.  This will create a vN (where N is version number) folder.
You may need to comment or uncomment the lines for including the individual feature data (can be omitted if those versions
already out on S3, otherwise they take a while).

Then from a command line, run `python tools/deploy.py` to push this up to S3.