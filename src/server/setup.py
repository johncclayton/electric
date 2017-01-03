from distutils.core import setup
from pip.req import parse_requirements

install_reqs = parse_requirements('requirements.txt')
production_version = '0.6.4'

setup(
    name = 'electric',
    packages = ['electric', 'electric.icharger'],
    version = production_version,
    description = "Battery charger integration, information and notification server",
    author = "John Clayton",
    author_email = "electric_charge@icloud.com",
    url = 'https://github.com/johncclayton/electric',
    download_url = 'https://github.com/johncclayton/electric/tarball/' + production_version,
    keywords = [ 'icharger', 'fma', 'hobby', 'charger' ],
    classifiers = [],
    install_requires = install_reqs,
    entry_points = {
        'console_scripts': ['electric-server=electric.main:run_server']
    }
)