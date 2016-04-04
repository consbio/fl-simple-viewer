"""
Creates a version of the files from this project, for easier deployment to AWS S3.  Will create a subdirectory under this project
with a folder name equal to version specified here.
"""


import os, shutil

# run time variables
version = "0.2"

# files / directories to push into version
deps = [
    "static/features.json",
    "static/summary.csv",
    "static/dist",
    "static/fonts",
    "static/img",
    "index.html",
    # "features" #TODO: uncomment when uploading new data / new version
]



os.chdir('..')

outdir = 'v{0}'.format(version)
if os.path.exists(outdir):
    raise ValueError('Version {0} already exists, failing...'.format(version))

os.makedirs(outdir)

for dep in deps:
    print('Copying {0}'.format(dep))

    path, filename = os.path.split(dep)
    containing_dir = os.path.join(outdir, path)
    if not os.path.exists(containing_dir):
        os.makedirs(containing_dir)

    if os.path.isdir(dep):
        shutil.copytree(dep, os.path.join(outdir, dep))
    else:
        shutil.copy(dep, os.path.join(outdir, dep))


