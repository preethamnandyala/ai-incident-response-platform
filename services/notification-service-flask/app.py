from flask import Flask, jsonify
from dotenv import load_dotenv
import os
import threading
from consumer import start_consumer_thread

load_dotenv()

app = Flask(__name__)


@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'notification-service',
        'port': int(os.getenv('PORT', '3005'))
    })


@app.route('/api/notify/health')
def api_health():
    return jsonify({
        'status': 'healthy',
        'service': 'notification-service'
    })


if __name__ == '__main__':
    print("Starting Notification Service...")
    start_consumer_thread()
    port = int(os.getenv('PORT', '3005'))
    print(f"Notification Service running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)