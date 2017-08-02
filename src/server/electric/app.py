import logging
from flask import Flask, Response, request
from flask_cors import CORS
from flask_restful import Api

from rest_interface import \
    DialogCloseResource, \
    StatusResource, \
    SystemStorageResource, \
    ChannelResource, \
    ControlRegisterResource, \
    PresetListResource, \
    PresetResource, ChargeResource, DischargeResource, \
    BalanceResource, MeasureIRResource, StopResource, \
    PresetOrderResource, AddNewPresetResource, StoreResource

application = Flask(__name__, instance_path='/etc')
cors_app = CORS(application)

format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
handler = logging.StreamHandler()
formatter = logging.Formatter(format)
handler.setFormatter(formatter)
application.logger.addHandler(handler)
application.logger.setLevel(logging.DEBUG)

from zmq_marshall import worker_loc
application.logger.info("The charger LIVES! ELECTRIC_WORKER located at: {0}".format(worker_loc))

api = Api(application)
api.add_resource(StatusResource, "/status")
api.add_resource(SystemStorageResource, "/system")
api.add_resource(ControlRegisterResource, "/control")
api.add_resource(ChargeResource, "/charge/<channel_id>/<preset_memory_slot>")
api.add_resource(DischargeResource, "/discharge/<channel_id>/<preset_memory_slot>")
api.add_resource(StoreResource, "/store/<channel_id>/<preset_memory_slot>")
api.add_resource(BalanceResource, "/balance/<channel_id>/<preset_memory_slot>")
api.add_resource(MeasureIRResource, "/measureir/<channel_id>")
api.add_resource(StopResource, "/stop/<channel_id>")
api.add_resource(ChannelResource, "/channel/<channel_id>")
api.add_resource(PresetResource, "/preset/<preset_memory_slot>")
api.add_resource(PresetListResource, "/preset")
api.add_resource(AddNewPresetResource, "/addpreset")
api.add_resource(PresetOrderResource, "/presetorder")
api.add_resource(DialogCloseResource, "/closedialog/<channel_id>")

# application.config['TRAP_HTTP_EXCEPTIONS']=True
#
# @application.errorhandler(Exception)
# def handle_error(e):
#     try:
#         if e.code < 400:
#             return Response.force_type(e, request.environ)
#         elif e.code == 404:
#             return "The page you're looking for was not found", 404
#     except:
#         return make_error_page("Error", "Something went wrong"), 500
#

# @application.errorhandler(ObjectNotFoundException)
# def handle_object_not_found(error):
#     response = jsonify(str(error))
#     response.status_code = error.status_code
#     return response
#
#
# @application.errorhandler(BadRequestException)
# def handle_bad_request(error):
#     response = jsonify(str(error))
#     response.status_code = error.status_code
#     return response

