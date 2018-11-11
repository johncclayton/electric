from distutils.core import setup

# WARNING: don't edit this file it is generated from the setup.txt
# within the scripts/ directory - changes made to this file will be lost!

setup(
    name = 'electric',
    packages = ['electric', 'electric.worker'],
    version = "0.8.11",
    description = "iCharger integration services",
    author = "John Clayton",
    author_email = "electric_charge@icloud.com",
    url = 'https://github.com/johncclayton/electric',
    download_url = 'https://github.com/johncclayton/electric/tarball/0.8.11',
    keywords = [ 'icharger', 'hobby', 'charger', 'heli', 'plane', 'rc' ],
    license = "GPLv3",
    classifiers = [
    ],
    install_requires = [
        
            'aniso8601==4.0.1',
        
            'argh==0.26.2',
        
            'bleach==3.0.2',
        
            'certifi==2018.10.15',
        
            'chardet==3.0.4',
        
            'Click==7.0',
        
            'configparser==3.5.0',
        
            'docutils==0.14',
        
            'Flask==1.0.2',
        
            'Flask-Cors==3.0.7',
        
            'Flask-RESTful==0.3.6',
        
            'funcsigs==1.0.2',
        
            'gunicorn==19.9.0',
        
            'hidapi==0.7.99.post21',
        
            'idna==2.7',
        
            'itsdangerous==1.1.0',
        
            'Jinja2==2.10',
        
            'mock==2.0.0',
        
            'modbus-tk==0.5.8',
        
            'pathtools==0.1.2',
        
            'pbr==5.1.1',
        
            'pkginfo==1.4.2',
        
            'Pygments==2.2.0',
        
            'pyserial==3.4',
        
            'python-dateutil==2.7.5',
        
            'pytz==2018.7',
        
            'PyYAML==3.13',
        
            'pyzmq==17.1.2',
        
            'readme-renderer==24.0',
        
            'requests==2.20.1',
        
            'requests-toolbelt==0.8.0',
        
            'schematics==2.1.0',
        
            'six==1.11.0',
        
            'tqdm==4.28.1',
        
            'twine==1.12.1',
        
            'urllib3==1.24.1',
        
            'watchdog==0.9.0',
        
            'webencodings==0.5.1',
        
            'Werkzeug==0.14.1',
        
    ],
    entry_points = {
        'console_scripts': [
            'electric-server-cmd=electric.main:run_server',
            'electric-worker-cmd=electric.worker.worker:run_worker'
            ]
    }
)