from jinja2 import Template
from pip.req import parse_requirements

template = Template(open('setup.py.template', 'r').read())
install_reqs = parse_requirements('requirements.txt', session=False)
reqs = [str(ir.req) for ir in install_reqs]
content = template.render(version="0.6.7", requirements=reqs)

setup_file = open('setup.py', 'wt')
setup_file.write(content)
setup_file.close()
