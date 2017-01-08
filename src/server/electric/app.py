from flask import Flask
from flask_cors import CORS
from flask_restful import Api

from rest_interface import StatusResource, \
    SystemStorageResource, \
    ChannelResource, \
    ControlRegisterResource, \
    PresetListResource, \
    PresetResource

application = Flask(__name__, instance_path='/etc')
cors_app = CORS(application)

api = Api(application)
api.add_resource(StatusResource, "/status")
api.add_resource(SystemStorageResource, "/system")
api.add_resource(ControlRegisterResource, "/control")
api.add_resource(ChannelResource, "/channel/<channel_id>")
api.add_resource(PresetListResource, "/preset")
api.add_resource(PresetResource, "/preset/<preset_index>")
