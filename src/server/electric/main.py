import platform
from app import application

def run_server():
    application.run(debug=True, host='0.0.0.0', port=5000)


if __name__ == "__main__":
    if platform.system() == "Darwin":
        print("WARNING: libusb doesnt work well for HID devices on the Mac, and this program requires it - things WILL NOT out so well without it so this program will abort now")
    else:
        run_server()
