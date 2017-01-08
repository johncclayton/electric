from flask import Flask
from flask_cors import CORS
from flask_restful import Api

from rest_interface import Status_iCharger, \
    SystemStorage_iCharger, ChannelStatus_iCharger, ControlRegister_iCharger

application = Flask(__name__, instance_path='/etc')
cors_app = CORS(application)

api = Api(application)
api.add_resource(Status_iCharger, "/status")
api.add_resource(SystemStorage_iCharger, "/system")
api.add_resource(ControlRegister_iCharger, "/control")
api.add_resource(ChannelStatus_iCharger, "/channel/<channel_id>")



