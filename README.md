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
Give each column a unique key, and make sure this is synced with `static/src/config.js::COconfig`.
Columns that have species names varied across watersheds, so species names were shown as the link text; otherwise the
label of the column was used for the link text.

Updated links and additional landowner opportunities were provided by email from FWC staff on 5/19/2021.

## Setup

Run `npm install` to pull down required modules.

Run `pipenv install --dev` to setup a virtual environment (based on `Pipfile` and Python 3.7) with the development dependencies.

The AWS CLI is installed based on these dependencies. Authorize it with appropriate credentials for AWS Static Deploy (CBI IAM account).

[AWS CLI setup instructions](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).

```

```

## Build process

This project uses Gulp to minify and concatenate CSS and JS files.

Run `gulp build` to run the build, which produces artifacts in `static/dist`.

## Deploy process

Files are deployed to `viewer.apps.flcpa.databasin.org` bucket in S3.

From a command line, run `python tools/deploy.py` to push this up to S3.

## Notes

"Conservation Assets" were formerly known as "Priority Resources" - so any variables in the code that pointed to these will probably be "Priority*" or "PR*".

## Credits

This project was developed based on grants from the U.S. Fish and Wildlife Service Peninsular Florida Landscape Conservation Cooperative and Florida Fish and Wildlife Conservation Commission.
