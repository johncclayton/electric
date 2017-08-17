import zmq, logging, sys, os, threading, datetime, time
import zmq.utils.win32

from comms_layer import ChargerCommsManager
import electric.testing_control as testing_control

from router import route_message
from cache import set_channel_status, set_device_info_cached

logger = logging.getLogger('electric.worker')

# construct ZMQ context for comms, with a single REQUEST endpoint
ctx = zmq.Context()
socket = ctx.socket(zmq.REP)

listen_on = os.environ.get("ELECTRIC_WORKER_LISTEN", "tcp://0.0.0.0:5001")

charger = ChargerCommsManager()
lock = threading.Lock()


def setup_zeromq():
    socket.bind(listen_on)
    global poller
    poller = zmq.Poller()
    poller.register(socket, zmq.POLLIN)



class StatusThread(threading.Thread):
    def __init__(self, charger):
        super(StatusThread, self).__init__(name="Status Reader")
        self.daemon = True
        self.charger = charger
        self.keep_going = True

    def run(self):
        while self.keep_going:
            # fetch charger status, channel 0/1 and store
            # pause to breath - it is after all only good form
            try:
                with lock:
                    start_time = datetime.datetime.now()

                    device_info = self.charger.get_device_info()
                    if device_info and self.keep_going:
                        set_device_info_cached(device_info)

                        for channel in range(0, device_info.channel_count):
                            channel_status = self.charger.get_channel_status(channel, device_info.device_id)
                            if channel == 0 or channel == 1:
                                set_channel_status(channel, channel_status)
                            if not self.keep_going:
                                return

                    end_time = datetime.datetime.now()

                # wait for about 500ms minus the time it took, in other words - try to update these twice a second
                elapsed_ms = end_time - start_time
                wait_seconds = 0.5 - elapsed_ms.total_seconds()
                if wait_seconds > 0:
                    time.sleep(wait_seconds)
                else:
                    # well, it too longer than 500ms, so pause a wee bit more (>700 ms total - yeah, a stab in the dark)
                    time.sleep(0.2)

            except Exception, e:
                logger.error("exception while reading status/channel info: {0}".format(e))
                time.sleep(5)


fetcher = StatusThread(charger)


def stop_application():
    socket.close()
    ctx.term()
    sys.exit(0)


def start_fetcher_thread():
    """Starts a thread that requests /status and /channel information on a periodic basis and places it in a cache"""
    fetcher.start()
    logger.info("started fetcher thread")


def stop_fetcher_thread():
    """Stops the fetcher thread - its just good form dear boy"""
    fetcher.keep_going = False
    fetcher.join()


def run_worker():
    with zmq.utils.win32.allow_interrupt(stop_application):
        logger.info("iCharger USB reader worker listening on: %s", listen_on)

        try:
            while True:
                socks = dict(poller.poll())

                if socket in socks:
                    message = socket.recv_pyobj()

                    if "method" not in message:
                        logger.warn("method name not specified, ignoring {0}".format(message))
                        message["exception"] = IOError("no method specified in message - rejecting request")
                    else:
                        method = message["method"]
                        args = None
                        if "args" in message:
                            args = message["args"]

                        try:
                            with lock:
                                if "testing-control" in message:
                                    testing_control.values = message["testing-control"]

                                message_log = "message: {0}/{1} with args: {2}".format(message["tag"], method, args)

                                try:
                                    logger.info("executing {0}".format(message_log))
                                    message["response"] = route_message(charger, method, args)
                                except Exception, e:
                                    logger.error("EXCEPTION during routing of {0}, {1}".format(message_log, e))
                                    message["raises"] = e

                                try:
                                    # potentially; the receiver goes away - before we are finished sending -
                                    logger.info("sending response for {0}".format(message_log))
                                    socket.send_pyobj(message)
                                    logger.info("sent response for {0}".format(message_log))
                                except Exception, e:
                                    logger.error("unable to send response for {0}, {1}".format(message_log, e))

                        finally:
                            testing_control.values.reset()

        except KeyboardInterrupt:
            logger.warn("Ctrl-C interrupted worker...")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')

    setup_zeromq()
    start_fetcher_thread()
    run_worker()
    stop_fetcher_thread()