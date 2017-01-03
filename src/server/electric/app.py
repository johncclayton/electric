from flask import Flask
from flask_restful import Api
from flask_cors import CORS

from electric.rest_interface import Status_iCharger, \
    SystemStorage_iCharger, ChannelStatus_iCharger, ControlRegister_iCharger

class AppInterface(object):
    def __init__(self):
        self.app = Flask(__name__, instance_path='/etc')
        self.cors_app = CORS(self.app)

        self.api = Api(self.app)
        self.api.add_resource(Status_iCharger, "/status")
        self.api.add_resource(SystemStorage_iCharger, "/system")
        self.api.add_resource(ControlRegister_iCharger, "/control")
        self.api.add_resource(ChannelStatus_iCharger, "/channel/<channel_id>")



