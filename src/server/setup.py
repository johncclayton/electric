from distutils.core import setup

setup(
    name = 'electric',
    packages = ['electric'],
    version = '0.4',
    description = "Battery charger integration, information and provisioning server",
    author = "John Clayton",
    author_email = "electric_charge@icloud.com",
    url = 'https://github.com/johncclayton/electric',
    download_url = 'https://github.com/johncclayton/electric/tarball/0.4',
    keywords = [ 'icharger', 'fma', 'hobby', 'charger' ],
    classifiers = [],
    install_requires = [
        'aniso8601==1.2.0',
        'click==6.6',
        'Flask==0.12',
        'Flask-RESTful==0.3.5',
        'itsdangerous==0.24',
        'Jinja2==2.8',
        'MarkupSafe==0.23',
        'modbus-tk==0.5.4',
        'pyserial==3.1',
        'python-dateutil==2.6.0',
        'pytz==2016.10',
        'pyusb==1.0.0',
        'six==1.10.0',
        'Werkzeug==0.11.13',
        'wheel==0.24.0',
    ],
    entry_points = {
        'console_scripts': ['electric-server=electric.main:run_server']
    }
)