from jinja2 import Template
from pip.req import parse_requirements
import os, itertools

def default_root_path():
    return os.path.dirname(os.path.abspath(__file__))


def write_setup_py(content, root_path = None):
    if root_path is None:
        root_path = default_root_path()

    output_filename = os.path.join(root_path, '..', 'setup.py')

    setup_file = open(output_filename, 'wt')
    setup_file.write(content)
    setup_file.close()


def render_setup(root_path = None, ver="0.7.1"):
    if root_path is None:
        root_path = default_root_path()

    template_filename = os.path.join(root_path, 'setup.txt')
    web_requirements_filename = os.path.abspath(os.path.join(root_path, '..', 'requirements-web.txt'))
    worker_requirements_filename = os.path.abspath(os.path.join(root_path, '..', 'requirements-worker.txt'))

    template = Template(open(template_filename, 'r').read())

    web_install_reqs = parse_requirements(web_requirements_filename, session=False)
    worker_install_reqs = parse_requirements(worker_requirements_filename, session=False)

    reqs = [str(ir.req) for ir in itertools.chain(web_install_reqs, worker_install_reqs)]

    return template.render(version=ver, requirements=reqs)


def render_and_write_setup(version):
    write_setup_py(render_setup(root_path=None, ver=version))
    return True

