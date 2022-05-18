from flask import Flask, render_template, url_for, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import secrets
import logging
from engineio.payload import Payload

Payload.max_decode_packets = 2000

async_mode = None

players = {}
serverPlayers = {}

#Sets up flask and socketio server
app = Flask(__name__)
socketio = SocketIO(app, async_mode=async_mode, ping_interval=3, ping_timeout=3)

#Disables logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

#Website pages
@app.route("/play")
def main():
    return render_template("play.html", sync_mode=socketio.async_mode)

@app.route("/")
def home():
    return render_template("home.html", sync_mode=socketio.async_mode)

#Either creates a room or puts the user in one
@socketio.event
def join(data):
    emit("FetchedPlayers", json.dumps(players))
    emit("NewPlayer", data, broadcast=True, include_self=False)
    players[data["id"]] = data
    serverPlayers[request.sid] = data
    print(data["name"] + " joined")

@socketio.event
def update(data):
    emit("update", data, broadcast=True, include_self=False)
    serverPlayers[request.sid] = data
    players[data["id"]] = data

@socketio.event
def projectile(projectile):
    emit("projectile", projectile, broadcast=True, include_self=False)

#Closes rooms when someone disconnects
@socketio.event
def disconnect():
    emit("Left", serverPlayers[request.sid]["id"], broadcast=True, include_self=False)
    print(serverPlayers[request.sid]["name"] + " left")
    players.pop(serverPlayers[request.sid]["id"])
    serverPlayers.pop(request.sid)
        
#Hosts website
if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0")