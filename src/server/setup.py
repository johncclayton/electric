from distutils.core import setup

setup(
    name = 'electric',
    packages = ['electric'],
    version = '0.1',
    description = "Battery charger integration, information and provisioning server",
    author = "John Clayton",
    author_email = "electric_charge@icloud.com",
    url = 'https://github.com/johncclayton/electric',
    download_url = 'https://github.com/johncclayton/electric/tarball/0.1',
    keywords = [ 'icharger', 'fma', 'hobby', 'charger' ],
    classifiers = [],
    entry_points = {
        'console_scripts': ['electric-server=electric.main:run_server']
    }
)