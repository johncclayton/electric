# noinspection PyPackageRequirements
from worker import run_the_worker
import pydevd
pydevd.settrace('192.168.1.168', port=62682, stdoutToServer=True, stderrToServer=True)

if __name__ == "__main__":
    run_the_worker()