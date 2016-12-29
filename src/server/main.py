from app import AppInterface
from rest_interface import Status_iCharger, ChannelStatus_iCharger
from flask_restful import Api

try:
    flask_app = AppInterface()

    api = Api(flask_app.app)
    api.add_resource(Status_iCharger, "/status")
    api.add_resource(ChannelStatus_iCharger, "/channel/<channel_id>")

except Exception as r:
    print("error starting app:", r)
    raise r

if __name__ == "__main__":
    flask_app.app.run(debug=True, host='0.0.0.0')