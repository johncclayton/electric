from electric.app import application
import logging
logger = logging.getLogger('electric.app.{0}'.format(__name__))

# import faulthandler, signal
# faulthandler.register(signal.SIGUSR1)
#
#
# def debug_signal_handler(signal, frame):
#     del signal
#     del frame
#
#     try:
#         import rpdb2
#         print
#         print
#         print "Starting embedded RPDB2 debugger. Password is 'foobar'"
#         print
#         print
#         rpdb2.start_embedded_debugger("foobar", True, True)
#         rpdb2.setbreak(depth=1)
#         return
#     except StandardError:
#         pass
#
#     try:
#         import code
#         code.interact()
#     except StandardError as ex:
#         print "%r, returning to normal program flow" % ex
#
# try:
#     signal.signal(
#             vars(signal).get("SIGBREAK") or vars(signal).get("SIGUSR2"),
#             debug_signal_handler
#             )
# except ValueError:
#     # Typically: ValueError: signal only works in main thread
#     pass


def run_server():
    opts = {
        "use_reloader": False,
        "use_debugger": False
    }

    from zmq_marshall import worker_loc
    logger.info("Will connect to ELECTRIC_WORKER at: {0}".format(worker_loc))

    application.run(debug=True, host='0.0.0.0', port=5000, **opts)

if __name__ == "__main__":
    run_server()
