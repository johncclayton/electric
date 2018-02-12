from main import run_server

# noinspection PyPackageRequirements
import pydevd
pydevd.settrace('192.168.1.168', port=60541, stdoutToServer=True, stderrToServer=True)

if __name__ == "__main__":
    run_server()
