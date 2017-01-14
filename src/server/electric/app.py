import os

import rq_dashboard
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

debug_mode = os.environ.get("DEBUG_MODE", None)
if not debug_mode:
    # Also expose the RQ dashboard
    redis_address = os.environ.get("REDIS_ADDRESS", "localhost")
    application.config.from_object(rq_dashboard.default_settings)
    application.config['REDIS_URL'] = "redis://{0}".format(redis_address)
    application.register_blueprint(rq_dashboard.blueprint, url_prefix="/rq")
