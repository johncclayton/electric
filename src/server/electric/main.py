from electric.app import AppInterface

def run_server():
    flask_app = AppInterface()
    flask_app.app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == "__main__":
    run_server()