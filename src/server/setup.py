from distutils.core import setup

# WARNING: don't edit this file it is generated from the setup.txt
# within the scripts/ directory - changes made to this file will be lost!

setup(
    name = 'electric',
    packages = ['electric', 'electric.worker'],
    version = "0.7.5",
    description = "iCharger integration services",
    author = "John Clayton",
    author_email = "electric_charge@icloud.com",
    url = 'https://github.com/johncclayton/electric',
    download_url = 'https://github.com/johncclayton/electric/tarball/0.7.5',
    keywords = [ 'icharger', 'hobby', 'charger' ],
    license = "GPLv3",
    classifiers = [
    ],
    install_requires = [
        
            'aniso8601==1.2.1',
        
            'click==6.7',
        
            'configparser==3.5.0',
        
            'Flask==0.12.2',
        
            'Flask-Cors==3.0.3',
        
            'Flask-RESTful==0.3.6',
        
            'gunicorn==19.7.1',
        
            'itsdangerous==0.24',
        
            'Jinja2==2.9.6',
        
            'MarkupSafe==1.0',
        
            'python-dateutil==2.6.1',
        
            'pytz==2017.2',
        
            'pyzmq==16.0.2',
        
            'schematics==1.1.1',
        
            'six==1.10.0',
        
            'watchdog==0.8.3',
        
            'Werkzeug==0.12.2',
        
            'hidapi==0.7.99.post20',
        
            'modbus-tk==0.5.4',
        
            'pyserial==3.1',
        
            'pyzmq==16.0.2',
        
            'schematics==1.1.1',
        
            'six==1.10.0',
        
            'watchdog==0.8.3',
        
    ],
    entry_points = {
        'console_scripts': [
            'electric-server=electric.main:run_server',
            'electric-worker=electric.worker.worker:run_worker'
            ]
    }
)