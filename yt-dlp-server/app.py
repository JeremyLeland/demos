# app.py
from flask import Flask, render_template, request, jsonify, Response
import subprocess
import threading
import queue
import json

app = Flask(__name__)
progress_queue = queue.Queue()

def run_yt_dlp(url):
    process = subprocess.Popen(
        ['yt-dlp', '-P', 'temp:/tmp/', '-P', '/mnt/external/!!! Olivia !!!/Downloads/', url],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    for line in process.stdout:
        progress_queue.put(line.strip())
    process.stdout.close()
    process.wait()
    progress_queue.put('[DONE]')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_download', methods=['POST'])
def start_download():
    data = request.get_json()
    url = data['url']
    threading.Thread(target=run_yt_dlp, args=(url,), daemon=True).start()
    return jsonify({'status': 'started'})

@app.route('/progress')
def progress():
    def event_stream():
        while True:
            line = progress_queue.get()
            yield f'data: {line}\n\n'
            if line == '[DONE]':
                break
    return Response(event_stream(), mimetype='text/event-stream')

if __name__ == '__main__':
    #app.run(debug=True, threaded=True)
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)

