from flask import Flask
from flask_cors import CORS
import os

class AppInterface(object):
    def __init__(self):
        self.app = Flask(__name__, instance_path='/etc')
        self.cors_app = CORS(self.app)
        # if os.path.exists('/etc/electric.cfg'):
        #     self.app.config.from_pyfile('/etc/electric.cfg')


