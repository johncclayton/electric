import os
import subprocess
import sys
import argparse

from setup_template import render_and_write_setup

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-g', '--generate', default=True, action="store_true", help='regenerate setup.py')
    parser.add_argument('-p', '--publish', default=False, action="store_true", help='publish the package')
    parser.add_argument('-v', '--version', default=None, help="specify the version embedded into the setup.py file")
    parser.add_argument('-t', '--test', default=False, action="store_true", help="publish to the pypitest repository, by default this util publishes to the real live repo")
    args = parser.parse_args()

    rendered = False
    repo = "pypitest" if args.test else "pypi"
    setup_filename = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'setup.py'))

    if args.generate:
        print("Generating new setup.py...")
        rendered = render_and_write_setup(version=args.version)
        if rendered:
            print("Rendering: OK")

    if not os.path.exists(setup_filename):
        print("The setup.py file does not exist at this path (abort): ", setup_filename)
        sys.exit(1)

    if rendered and args.publish:
        print("Uploading distriubution to repo: {0}".format(repo))

        args = [
            sys.executable,
            setup_filename,
            "sdist",
            "upload",
            "-r",
            repo
        ]

        command = ' '.join(args)

        try:
            proc = subprocess.Popen(args,
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


