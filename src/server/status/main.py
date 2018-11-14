import logging
import os

from flask import Flask
from flask_cors import CORS
from flask_restful import Api

from rest_interface import StatusResource, WiFiConnectionResource, DeploymentResource

application = Flask(__name__, instance_path='/etc')
cors_app = CORS(application)

debug_mode = os.environ.get("DEBUG_MODE", None)

if not debug_mode:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    application.logger.addHandler(handler)
    application.logger.setLevel(logging.INFO)
    application.logger.info("The status service LIVES!")

api = Api(application)
api.add_resource(StatusResource, "/status", endpoint="status")
api.add_resource(DeploymentResource, "/deploy", endpoint="deploy")
api.add_resource(WiFiConnectionResource, "/wifi", endpoint="wifi")

def run_server():
    application.run(debug=debug_mode, host='0.0.0.0', port=4999)
 
if __name__ == "__main__":
    run_server()
