from flask import Flask, render_template, url_for, request
import json
import secrets
import logging
import asyncio
import websockets


async_mode = None

players = {}
connected = []

#Sets up flask and socketio server
app = Flask(__name__)

#Disables logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

#Website pages
@app.route("/play")
def play():
    return render_template("play.html")

@app.route("/")
def home():
    return render_template("home.html")

async def handler(websocket):
    async for message in websocket:
        try:
            message = json.loads(message)
            if message["event"] == "join":
                await join(message, websocket)
            elif message["event"] == "update":
                await update(message, websocket)
            elif message["event"] == "projectile":
                await projectile(message, websocket)
        except websockets.exceptions.ConnectionClosedOK:
            await disconnect(websocket)


async def socket():
    print("sockets?")
    async with websockets.serve(handler, host="0.0.0.0", port=8001):
        await asyncio.Future()

#Either creates a room or puts the user in one
async def join(data, socket):
    global connected
    global players
    await socket.send(json.dumps({"event": "FetchedPlayers", "enemies": json.dumps(players), "id": id(socket)}))
    data["player"]["id"] = id(socket)
    websockets.broadcast(connected, json.dumps({"event": "NewPlayer", "player": data["player"]}))
    print(data["player"]["name"] + " joined")
    players[id(socket)] = data["player"]
    connected.append(socket)

async def update(data, socket):
    global connected
    global players
    websockets.broadcast(connected, json.dumps({"event": "update", "position": data["position"], "id": data["id"], "hits": data["hits"]}))
    players[id(socket)]["position"] = data["position"]
    players[id(socket)]["hits"] = data["hits"]

async def projectile(data, socket):
    global connected
    websockets.broadcast(connected, json.dumps({"event": "projectile", "projectile": data["projectile"]}))

#Closes rooms when someone disconnects
async def disconnect(socket):
    global connected
    global players
    websockets.broadcast(connected, json.dumps({"event": "Left", "id": id(socket)}))
    print(players[id(socket)]["name"] + " left")
    players.pop(id(socket))
    connected.pop(connected.index(socket))
        
#Hosts website
if __name__ == "__main__":
    asyncio.get_event_loop().run_in_executor(None, app.run)
    asyncio.run(socket())