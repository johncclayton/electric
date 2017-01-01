from flask import Flask
import os

class AppInterface(object):
    def __init__(self):
        self.app = Flask(__name__, instance_path='/etc')
        if os.path.exists('/etc/electric.cfg'):
            self.app.config.from_pyfile('/etc/electric.cfg')


