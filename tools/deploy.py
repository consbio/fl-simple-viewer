"""
Command line application to upload version to S3.

Usage:
> python deploy.py v0.1
"""


import os
import shutil
import gzip
import click
from boto.s3.connection import S3Connection, OrdinaryCallingFormat
from boto.s3.key import Key

MAX_UPLOAD_THREADS = 10
S3_MAX_AGE = 14400,  # 4 hours
GZIP_EXCLUDE_EXTENSIONS = set(('png', 'jpg', 'jpeg', 'gz', 'zip', 'ico', 'gif'))

from deploy_settings import *
# Application specific overrides
# Expected global variables from deploy_settings:
# S3_ACCESS_KEY = '<key>'
# S3_SECRET_KEY = '<secret key>'
# S3_BUCKET_NAME = '<the bucket name>'
# ROOT_DIR = '<root directory within bucket, e.g., application name>'


def upload_files(directory, root_folder):
    conn = S3Connection(S3_ACCESS_KEY, S3_SECRET_KEY) # , calling_format=OrdinaryCallingFormat() # calling_format required to get past dots in the bucket name
    bucket = conn.get_bucket(S3_BUCKET_NAME)

    root_key = '{0}/{1}'.format(ROOT_DIR, root_folder)
    # root_key = root_folder
    for root, dirs, files in os.walk(directory):
        for filename in files:
            print 'Uploading', filename
            key = Key(bucket)
            path = os.path.relpath(root, os.path.realpath(directory))
            rel_key = os.path.join(path, filename) if path != '.' else filename
            key.key = os.path.join(root_key, rel_key).replace('\\', '/')

            headers = {
                'Cache-Control': 'max-age=%d' % S3_MAX_AGE
            }

            if not os.path.split(filename) in GZIP_EXCLUDE_EXTENSIONS:
                headers['Content-Encoding'] = 'gzip'

            key.set_contents_from_filename(os.path.join(root, filename), headers=headers)
            key.make_public()


@click.command()
@click.argument('directory')
def run(directory):

    out_dir = os.path.realpath(os.path.split(directory)[1] + '_deploy')
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    os.chdir(directory)

    click.echo('Compressing files...')
    for root, dirs, files in os.walk(os.getcwd()):
        for filename in files:
            relpath = os.path.relpath(root)
            outpath = os.path.join(out_dir, relpath)
            if not os.path.exists(outpath):
                os.makedirs(outpath)

            outfilename = os.path.join(outpath, filename)
            filename = os.path.join(relpath, filename)
            if os.path.splitext(filename) in GZIP_EXCLUDE_EXTENSIONS:
                shutil.copy(filename, outfilename)
            else:
                with gzip.open(outfilename, 'wb') as f_out:
                    f_out.write(open(filename, 'rb').read())

    click.echo('Uploading files...')
    upload_files(out_dir, os.path.split(directory)[1])
    shutil.rmtree(out_dir)

if __name__ == '__main__':
    run()