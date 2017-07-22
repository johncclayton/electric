import zmq, logging, sys, os, platform
import zmq.utils.win32
from comms_layer import ChargerCommsManager
from router import route_message

logger = logging.getLogger('electric.worker')

# construct ZMQ context for comms, with a single REQUEST endpoint
ctx = zmq.Context()
socket = ctx.socket(zmq.REP)

listen_on = os.environ.get("WORKER_LISTEN", "tcp://0.0.0.0:5001")
socket.bind(listen_on)

poller = zmq.Poller()
poller.register(socket, zmq.POLLIN)

charger = ChargerCommsManager()

def stop_application():
    socket.close()
    ctx.term()
    sys.exit(0)

if __name__ == "__main__":
    if platform.system() == "Darwin":
        print("WARNING: libusb doesnt work well for HID devices on the Mac, and this program requires it - things WILL NOT out so well without it so this program will abort now")
        sys.exit(1)

    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')

    with zmq.utils.win32.allow_interrupt(stop_application):
        logger.info("iCharger USB reader worker started. Listening on: %s", listen_on)

        try:
            while True:
                socks = dict(poller.poll())

                if socket in socks:
                    message = socket.recv_pyobj()

                    if "method" not in message:
                        logger.warn("method name not specified, ignoring {0}".format(message))
                        # ZMQ REQ/REP requires 1:1 send/response, so in error case, just send message back
                        socket.send_pyobj(message)
                        continue

                    method = message["method"]
                    args = {}

                    if "args" in message:
                        args = message["args"]

                    try:
                        logger.info("executing message: {0} with args: {1}".format(method, args))
                        message["response"] = route_message(charger, method, args)
                    except Exception, e:
                        logger.error("Got exception: {0}".format(e))
                        message["exception"] = e

                    socket.send_pyobj(message)

        except KeyboardInterrupt:
            logger.info("Ctrl-C interrupted worker - aborting...")

