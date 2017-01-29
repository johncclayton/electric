import logging
import os

from flask import Flask
from flask_cors import CORS
from flask_restful import Api

from rest_interface import StatusResource, \
    SystemStorageResource, \
    ChannelResource, \
    ControlRegisterResource, \
    PresetListResource, \
    PresetResource, ChargeResource, DischargeResource, BalanceResource, MeasureIRResource, StopResource, PresetOrderResource, AddNewPresetResource

application = Flask(__name__, instance_path='/etc')
cors_app = CORS(application)

debug_mode = os.environ.get("DEBUG_MODE", None)
if not debug_mode:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    application.logger.addHandler(handler)
    application.logger.setLevel(logging.INFO)
    application.logger.info("The charger LIVES!")

api = Api(application)
api.add_resource(StatusResource, "/status")
api.add_resource(SystemStorageResource, "/system")
api.add_resource(ControlRegisterResource, "/control")
api.add_resource(ChargeResource, "/charge/<channel_id>/<preset_memory_slot>")
api.add_resource(DischargeResource, "/discharge/<channel_id>/<preset_memory_slot>")
api.add_resource(BalanceResource, "/balance/<channel_id>/<preset_memory_slot>")
api.add_resource(MeasureIRResource, "/measureir/<channel_id>")
api.add_resource(StopResource, "/stop/<channel_id>")
api.add_resource(ChannelResource, "/channel/<channel_id>")
api.add_resource(PresetListResource, "/preset")
api.add_resource(PresetOrderResource, "/presetorder")
api.add_resource(PresetResource, "/preset/<preset_memory_slot>")
api.add_resource(AddNewPresetResource, "/addpreset")
