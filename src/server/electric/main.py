from electric.app import AppInterface
import platform

def run_server():
    flask_app = AppInterface()
    flask_app.app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == "__main__":
    if platform.system() == "Darwin":
        print("WARNING: libusb doesnt work on Mac, and this program requires it - things WILL NOT out so well without it so this program will abort now")
    else:
        run_server()