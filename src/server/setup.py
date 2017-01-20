from distutils.core import setup

# WARNING: don't edit this file it is generated from the setup.txt
# within the scripts/ directory - changes made to this file will be lost!

setup(
    name = 'electric',
    packages = ['electric', 'electric.icharger'],
    version = "0.7.0",
    description = "Battery charger integration, information and notification service",
    author = "John Clayton",
    author_email = "electric_charge@icloud.com",
    url = 'https://github.com/johncclayton/electric',
    download_url = 'https://github.com/johncclayton/electric/tarball/0.7.',
    keywords = [ 'icharger', 'fma', 'hobby', 'charger' ],
    license = "GPLv3",
    classifiers = [
    ],
    install_requires = [
        
            'aniso8601==1.2.0',
        
            'astroid==1.4.9',
        
            'backports.functools-lru-cache==1.3',
        
            'click==6.6',
        
            'configparser==3.5.0',
        
            'Flask==0.12',
        
            'Flask-Cors==3.0.2',
        
            'Flask-RESTful==0.3.5',
        
            'isort==4.2.5',
        
            'itsdangerous==0.24',
        
            'Jinja2==2.8',
        
            'lazy-object-proxy==1.2.2',
        
            'MarkupSafe==0.23',
        
            'mccabe==0.5.3',
        
            'modbus-tk==0.5.4',
        
            'pylint==1.6.4',
        
            'pyserial==3.1',
        
            'python-dateutil==2.6.0',
        
            'pytz==2016.10',
        
            'pyusb==1.0.0',
        
            'six==1.10.0',
        
            'Werkzeug==0.11.13',
        
            'wrapt==1.10.8',
        
    ],
    entry_points = {
        'console_scripts': ['electric-server=electric.main:run_server']
    }
)