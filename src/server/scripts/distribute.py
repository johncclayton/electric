import os
import subprocess, platform
import sys
import argparse
from pip.req import parse_requirements
from jinja2 import Template

from setup_template import render_and_write_setup
electric_root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Provides configuration for template generation.  Any template file is described here
# and will be re-generated using the latest values when --generate is used.
config = {
    'version': {
        'pypi': '0.8.7',
        'pypitest': '0.8.9'
    },

    'files': [
        'setup.py': {
            "template": "setup.txt"
        },
        'electric-web.service': {
            "template": "electric-web.service.txt"
            "meta": {
                "user": "pi",
                "service_name": "Electric Web Service"
            }
        },
        'electric-worker.service': {
            "template": "electric-worker.service.txt"
            "meta": {
                "user": "pi",
                "service_name": "Electric Worker Service"
            }
        }
    ]
}


ext = "zip"
if platform.system() == "Darwin" or platform.system() == "Linux":
    ext = "tar.gz"


def write_content(content, output_filename):
    setup_file = open(output_filename, 'wt')
    setup_file.write(content)
    setup_file.close()


def gen_content(src, meta):
    template_filename = os.path.abspath(src)
    template = Template(open(template_filename, 'r').read())
    return template.render(**meta)


def render_and_write(template_filename, destination_filename, meta):
    gen_content = render(template_filename, meta)
    write_content(content, destination_filename)
    return True


def run_these(args):
    command = ' '.join(args)
    print "command is:", command

    try:
        proc = subprocess.Popen(args,
                                cwd=electric_root_path,
                                stderr=subprocess.STDOUT,
                                stdout=subprocess.PIPE,
                                bufsize=0)

        while True:
            s = proc.stdout.read()
            if s:
                print s,
            if proc.returncode is None:
                proc.poll()
            else:
                break

    except Exception, e:
        print("Whoa, failure:", e)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument('-g', '--generate', default=True, action="store_true", help='regenerate setup.py')
    parser.add_argument('-p', '--publish', default=False, action="store_true", help='publish the package')
    parser.add_argument('-v', '--version', default=None, help="specify the version to be embedded into the setup.py file")
    parser.add_argument('-p', '--prod', default=False, action="store_true", help="publish to the production pypi repository, by default this util publishes to the test repo")

    args = parser.parse_args()

    rendered = False
    repo = "pypi" if args.prod else "pypitest"
    setup_filename = os.path.join(electric_root_path, 'setup.py')

    if args.generate:
        print("Generating new setup...")

        # pull the pre-configured version number from the code
        meta = {
            "version": config["version"][repo]
        }

        # version can be overriden from the command line
        if args.version:
            print("Version override on command line")
            meta["version"] = args.version

        # all services have the same requirements; parse + gen the meta data 
        web_requirements_filename = os.path.join(electric_root_path, 'requirements-all.txt')
        web_reqs = parse_requirements(web_requirements_filename, session=False)
        meta["requirements"] = [str(ir.req) for ir in web_reqs]

        for dest_file in config['files']:
            # each of the files specifies an output name + additional per-file specific meta
            input_filename = os.path.join(electric_root_path, "scripts", "templates", config['files'][dest_file]["template"])
            output_filename = os.path.abspath(electric_root_path, dest_file)
            meta.update(config['files'][dest_file]["meta"])

            # just to prove we're not mad - print out what we're about to use for metadata
            print("Config for: {0} is {1}".format(dest_file, meta,))

            # do it!
            if False:
                rendered = render_and_write(config['files'][dest_file], output_filename, meta)
            
            if rendered:
                print("Rendered {0}: OK".format(dest_file,))

        # run_these([
        #     sys.executable,
        #     os.path.join(electric_root_path, "setup.py"),
        #     "sdist"
        # ])

    if not os.path.exists(setup_filename):
        print("The setup.py file does not exist at this path (abort): ", setup_filename)
        sys.exit(1)

    if rendered and args.publish and False:
        print("Uploading distribution to repo using twine: {0}, for platform: {1}".format(repo, platform.system()))

        run_these([
            "twine",
            "upload",
            os.path.join(electric_root_path, "dist", "electric-{0}.{1}".format(meta["version"], ext)),
        ])


