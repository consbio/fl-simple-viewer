"""This is to be run from the root of the project directory"""
"""> python tools/deploy.py"""


import os
import shutil
import gzip
import mimetypes
import click
import boto3

BUILD_DIR = '_build'
OUT_DIR = '_deploy'
BUCKET = 'viewer.apps.flcpa.databasin.org'

S3_MAX_AGE = 300 # 5 minutes (for dev)  # FIXME: 14400,  # 4 hours
GZIP_EXCLUDE_EXTENSIONS = set(('png', 'jpg', 'jpeg', 'gz', 'zip', 'ico', 'gif'))


out_dir = os.path.realpath(OUT_DIR)
build_dir = os.path.realpath(BUILD_DIR)

if os.path.exists(build_dir):
    shutil.rmtree(build_dir)

if os.path.exists(out_dir):
    shutil.rmtree(out_dir)

os.makedirs(build_dir)
os.mkdir(out_dir)

def get_content_type(filename):
    filename = filename.lower()
    mime = mimetypes.guess_type(filename)[0]
    if mime:
        return mime

    return 'binary/octet-stream'  # default when we can't guess

def upload_files(directory):
    bucket = boto3.resource('s3').Bucket(BUCKET)

    print('Deleting old contents from: {}'.format(BUCKET))
    for key in bucket.objects.all():
        print('Deleting', key)
        key.delete()

    print('Uploading to {}'.format(BUCKET))
    for root, dirs, files in os.walk(directory):
        for filename in files:

            print('Uploading', filename)
            path = os.path.relpath(root, os.path.realpath(directory))
            key = os.path.join(path, filename) if path != '.' else filename

            args = {
                'ACL': 'public-read',
                'ContentType': get_content_type(filename)  # boto3 does not guess mimetype right now
            }

            if S3_MAX_AGE:
                args['CacheControl'] = 'max-age=%d' % S3_MAX_AGE

            if not os.path.splitext(filename)[1][1:].lower() in GZIP_EXCLUDE_EXTENSIONS:
                args['ContentEncoding'] = 'gzip'

            # Upload and make it public
            bucket.upload_file(Filename=os.path.join(root, filename), Key=key, ExtraArgs=args)



# Collect all dependencies into build directory
deps = [
    "static/features.json",
    "static/summary.csv",
    "static/dist",
    "static/img",
    "index.html",
    "preview.html",
    "features"
]

for dep in deps:
    print('Copying {0}'.format(dep))

    path, filename = os.path.split(dep)
    containing_dir = os.path.join(build_dir, path)
    if not os.path.exists(containing_dir):
        os.makedirs(containing_dir)

    if os.path.isdir(dep):
        shutil.copytree(dep, os.path.join(build_dir, dep))
    else:
        shutil.copy(dep, os.path.join(build_dir, dep))


os.chdir(build_dir)
click.echo('Compressing files...')
# Copy everything in /build
for root, dirs, files in os.walk(os.getcwd()):
    for filename in files:
        if filename.startswith('.'):
            continue

        relpath = os.path.relpath(root)
        outpath = os.path.join(out_dir, relpath)
        if not os.path.exists(outpath):
            os.makedirs(outpath)

        outfilename = os.path.join(outpath, filename)
        filename = os.path.join(relpath, filename)
        if os.path.splitext(filename)[1][1:].lower() in GZIP_EXCLUDE_EXTENSIONS:
            shutil.copy(filename, outfilename)
        else:
            with gzip.open(outfilename, 'wb') as f_out:
                f_out.write(open(filename, 'rb').read())

click.echo('Uploading files...')
upload_files(out_dir)
shutil.rmtree(out_dir)
shutil.rmtree(build_dir)
