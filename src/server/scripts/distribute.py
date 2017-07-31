import os
import subprocess
import sys
import argparse

from setup_template import render_and_write_setup
electric_root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

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
    parser.add_argument('-t', '--test', default=False, action="store_true", help="publish to the pypitest repository, by default this util publishes to the real live repo")

    args = parser.parse_args()

    rendered = False
    repo = "testpypi" if args.test else "pypi"
    setup_filename = os.path.join(electric_root_path, 'setup.py')

    if args.generate:
        print("Generating new setup.py...")
        rendered = render_and_write_setup(version=args.version)
        if rendered:
            print("Rendering: OK")

        run_these([
            sys.executable,
            os.path.join(electric_root_path, "setup.py"),
            "sdist"
        ])

    if not os.path.exists(setup_filename):
        print("The setup.py file does not exist at this path (abort): ", setup_filename)
        sys.exit(1)

    if rendered and args.publish:
        print("Uploading distribution to repo using twine: {0}".format(repo))

        run_these([
            "twine",
            "upload",
            os.path.join(electric_root_path, "dist", "electric-{0}.zip".format(args.version)),
        ])


