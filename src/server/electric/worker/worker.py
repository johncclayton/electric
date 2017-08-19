import datetime
import logging
import os
import sys
import zmq
import zmq.utils.win32
import electric.worker.cache as cache
import electric.testing_control as testing_control

from comms_layer import ChargerCommsManager
from electric.worker.statusthread import StatusThread
from router import route_message

logger = logging.getLogger('electric.worker')

# construct ZMQ context for comms, with a single REQUEST endpoint
ctx = zmq.Context()
socket = ctx.socket(zmq.REP)

listen_on = os.environ.get("ELECTRIC_WORKER_LISTEN", "tcp://0.0.0.0:5001")

charger = ChargerCommsManager()
poller = zmq.Poller()


def setup_zeromq():
    socket.bind(listen_on)
    poller.register(socket, zmq.POLLIN)


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
                    start_time = datetime.datetime.now()

                    if "method" not in message:
                        logger.warn("method name not specified, ignoring {0}".format(message))
                        message["exception"] = IOError("no method specified in message - rejecting request")
                    else:
                        method = message["method"]
                        args = None
                        if "args" in message:
                            args = message["args"]

                        try:
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
                                end_time = datetime.datetime.now()
                                elapsed_time = end_time - start_time
                                socket.send_pyobj(message)
                                logger.info("sent response for {0}, elapsed_sec: {1}".format(message_log, elapsed_time.total_seconds()))

                            except Exception, e:
                                logger.error("unable to send response for {0}, {1}".format(message_log, e))

                        finally:
                            testing_control.values.reset()

        except KeyboardInterrupt:
            logger.warn("Ctrl-C interrupted worker...")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')

    testing_control.values.reset()
    cache.values.reset()

    setup_zeromq()
    start_fetcher_thread()
    run_worker()
    stop_fetcher_thread()