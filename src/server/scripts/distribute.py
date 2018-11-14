import os
import subprocess, platform
import sys
import argparse
from jinja2 import Template

try: # for pip >= 10
    from pip._internal.req import parse_requirements
except ImportError: # for pip <= 9.0.3
    from pip.req import parse_requirements
    
electric_root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
server_root_path = os.path.join(electric_root_path, 'server')

# Provides configuration for template generation.  Any template file is described here
# and will be re-generated using the latest values when --generate is used.
config = {
    'version': {
        'pypi': '0.8.10',
        'testpypi': '0.8.11'
    },
    'files': {
        'setup.py': {
            "template": "setup.txt"
        },
        'electric-web.service': {
            "template": "electric-web.service.txt",
            "meta": {
                "user": "pi",
                "service_name": "Electric Web Service"
            }
        },
        'electric-worker.service': {
            "template": "electric-worker.service.txt",
            "meta": {
                "user": "pi",
                "service_name": "Electric Worker Service"
            }
        },
        'electric-status.service': {
            "template": "electric-status.service.txt",
            "meta": {
                "user": "pi",
                "service_name": "Electric Status Service"
            }
        }
    }
}


def write_content(content, output_filename):
    setup_file = open(output_filename, 'wt')
    setup_file.write(content)
    setup_file.close()
    return True


def gen_content(src, meta):
    template = Template(open(src, 'r').read())
    return template.render(**meta)


def render_and_write(template_filename, destination_filename, meta):
    content = gen_content(template_filename, meta)
    return write_content(content, destination_filename)


def run_these(args):
    command = ' '.join(args)

    try:
        proc = subprocess.Popen(args,
                                cwd=server_root_path,
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
    parser.add_argument('-P', '--prod', default=False, action="store_true", help="publish to the production pypi repository, by default this util publishes to the test repo")

    args = parser.parse_args()

    rendered = False
    repo = "pypi" if args.prod else "testpypi"
    setup_filename = os.path.join(server_root_path, 'setup.py')

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
            if not "template" in config['files'][dest_file]:
                print("Meta data incorrect; need template for {0}".format(dest_file))
                sys.exit(1)

            input_filename = os.path.join(server_root_path, "scripts", "templates", config['files'][dest_file]["template"])
            output_filename = os.path.join(server_root_path, dest_file)

            if "meta" in config['files'][dest_file]:
                meta.update(config['files'][dest_file]["meta"])

            # do it!
            rendered = render_and_write(input_filename, output_filename, meta)
            if rendered:
                print("Rendered {0}: OK".format(dest_file,))

        run_these([
            sys.executable,
            os.path.join(server_root_path, "setup.py"),
            "sdist",
            "--formats=zip"
        ])

    if not os.path.exists(setup_filename):
        print("The setup.py file does not exist at this path (abort): ", setup_filename)
        sys.exit(1)

    if rendered and args.publish:
        to_publish = os.path.join(server_root_path, "dist", "electric-{0}.zip".format(meta["version"]))
        
        if not os.path.exists(to_publish):
            print("Simple check to see if {0} exists has failed, aborting".format(to_publish))
            sys.exit(2)

        print("Uploading distribution to repo using twine: {0}, for platform: {1}".format(repo, platform.system()))
        print(to_publish)

        run_these([
            "twine",
            "upload",
            "-r={0}".format(repo),
            "--verbose",
            to_publish
        ])


