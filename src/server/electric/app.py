from flask import Flask

class AppInterface(object):
    def __init__(self):
        self.app = Flask(__name__, instance_path='/etc')
        self.app.config.from_pyfile('rest_interface.cfg')


