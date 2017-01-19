from jinja2 import Template
from pip.req import parse_requirements
import os

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
    requirements_filename = os.path.abspath(os.path.join(root_path, '..', 'requirements.txt'))

    template = Template(open(template_filename, 'r').read())
    install_reqs = parse_requirements(requirements_filename, session=False)
    reqs = [str(ir.req) for ir in install_reqs]

    return template.render(version=ver, requirements=reqs)


def render_and_write_setup(version):
    write_setup_py(render_setup(root_path=None, ver=version))
    return True


if __name__ == "__main__":
    render_and_write_setup()

