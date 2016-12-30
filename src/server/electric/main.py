from flask_restful import Api

from electric.app import AppInterface
from electric.rest_interface import Status_iCharger, ChannelStatus_iCharger

try:
    flask_app = AppInterface()

    api = Api(flask_app.app)
    api.add_resource(Status_iCharger, "/status")
    api.add_resource(ChannelStatus_iCharger, "/channel/<channel_id>")

except Exception as r:
    print("error starting app:", r)
    raise r

def run_server():
    flask_app.app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == "__main__":
    run_server()