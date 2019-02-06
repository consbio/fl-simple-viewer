# Florida Conservation Planning Atlas - Simple Viewer

## Data processing

Data were obtained from PFLCC staff as a shapefile for each factor, from Oct 2015 to Jan 2016.

1. The main watersheds shapefile was projected to WGS84, and simplified to topojson using mapshaper.org (simplification = 3%).
   Output is `features.json`.
2. Run `shp2csv.py` to extract shapefile attribute table to a CSV. Output is a bunch of CSVs in tables subfolder
   (outside this directory tree).
3. Run `extract_HUC_summary.py` to extract summary information across all watersheds. Output is `static/summary.csv`
4. Run `glom_data.py` to extract a bunch of information for each feature. Output is a bunch of json files under `features` folder.

### Private Landowner Opportunities

Data were provided by PFLCC staff on 1/4/2018.
Each column contains a unique link, but may have variable text to use as the label. Columns are grouped by PFLCC Priority Resource.
Give each column a unique key, and make sure this is synced with `static/src/config.py::COconfig`.
Columns that have species names varied across watersheds, so species names were shown as the link text; otherwise the
label of the column was used for the link text.

## Setup

Run `npm install` to pull down required modules.

## Build process

This project uses Gulp to minify and concatenate CSS and JS files.

Run `gulp build` to run the build, which produces artifacts in `static/dist`.

## Deploy process

To deploy, this requires a deploy_settings.py file from Brendan (contains S3 keys and bucket info).

Files are deployed to `viewer.apps.pflcc.databasin.org` bucket in S3.

Run `create_version.py` after updating version in that script. This will create a vN (where N is version number) folder.
You may need to comment or uncomment the lines for including the individual feature data (can be omitted if those versions
already out on S3, otherwise they take a while).

Then from a command line, run `python tools/deploy.py` to push this up to S3.

## Credit

This project was developed based on grants from the U.S. Fish and Wildlife Service Peninsular Florida Landscape Conservation Cooperative and Florida Fish and Wildlife Conservation Commission.
