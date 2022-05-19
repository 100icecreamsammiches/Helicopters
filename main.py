from flask import Flask, render_template, url_for, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import secrets
import logging
from engineio.payload import Payload
import asyncio
import websockets

Payload.max_decode_packets = 2000

async_mode = None

players = {}
connected = {websocket}

#Sets up flask and socketio server
app = Flask(__name__)
socketio = SocketIO(app, async_mode=async_mode, ping_interval=10, ping_timeout=10)

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

async def handler(websocket):
    async for message in websocket:
        try:
            message = await websocket.recv()
            if message.event == "join":
                join(message, websocket)
            elif message.event == "update":
                update(message, websocket)
            elif message.event == "projectile":
                projectile(message, websocket)
        except websockets.ConnectionClosedOK:
            disconnect(websocket)


async def socket():
    async with websockets.serve(handler, "0.0.0.0", 8001):
        await asyncio.Future()

#Either creates a room or puts the user in one
async def join(data, socket):
    socket.send(json.dumps({"event": "FetchedPlayers", "enemies": json.dumps(players), "id": id(socket)}))
    data["player"]["id"] = id(socket)
    for connection in players:
        await connection.send(json.dumps({"event": "NewPlayer", "player": data["player"]}))
    print(data["name"] + " joined")
    players[id(socket)] = data["player"]
    connected.add(socket)

async def update(data, socket):
    for connection in connected:
        await connection.send(json.dumps({"event": "update", "data": data}))
    players[id(socket)] = data

async def projectile(projectile, socket):
    emit("projectile", projectile, broadcast=True, include_self=False)

#Closes rooms when someone disconnects
async def disconnect(socket):
    websockets.broadcast(connected, json.dumps({"event": "Left", "id": id(socket)}))
    print(players[id(socket)]["name"] + " left")
    players.pop(serverPlayers[id(socket)])
        
#Hosts website
if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0")
    asyncio.run(socket())