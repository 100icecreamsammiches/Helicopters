//Basic document details
const canvas = document.getElementById("main-canvas");
const context = canvas.getContext("2d");
const colors = ["Red", "Green", "Blue", "Green", "Purple", "Cyan", "Yellow", "Orange", "Pink"];
var bounding = canvas.getBoundingClientRect();
var socket = io({"forceNew": true});
var players = {};
var enemies = {};
var deltaTime = 1;
var lastTime = new Date().getTime();
var acceleration = 1.4;
var maxSpeed = 0.25;
var fetched = false;

var hash = window.location.hash
if (hash == "" || hash == "#"){
    var name = "Guest";
} else{
    var name = hash.slice(1, 15);
}

//Graphics and formatting details
canvas.width = window.innerHeight * .9;
canvas.height = window.innerHeight * .9;
canvas.style.marginLeft = "auto";
canvas.style.marginRight = "auto";
var params = new URLSearchParams(window.location.search);
var leftBound = (window.innerWidth / 2) - (canvas.width/2);

//Game Data

class Projectile{
    constructor(position, velocity, id){
        this.position = position;
        this.velocity = velocity;
        this.id = id;
    }
}

class Player{
    constructor(position, id, name, color){
        this.position = position;
        this.velocity = [0,0];
        this.name = name;
        this.id = id;
        this.hits = 0;
        this.color = color;
        this.lastUpdate = new Date().getTime();
        this.input = [0,0]
        this.truePos = [position[0], position[1]]
    }
}

var player = new Player([Math.random() * 0.9, Math.random() * 0.9], socket.io.engine.id, name, colors[Math.floor(Math.random()*colors.length)]);
var input = [0, 0];
var projectiles = [];
var count = 0;

function render(){
    deltaTime = (new Date().getTime() - lastTime)/1000;
    lastTime = new Date().getTime();
    context.beginPath();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#BBBBBB";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < projectiles.length; i++){
        var proj = projectiles[i];
        proj.position[0] += proj.velocity[0] * deltaTime;
        proj.position[1] += proj.velocity[1] * deltaTime;
        context.beginPath();
        context.fillStyle = "#FF0000";
        context.arc(proj.position[0] * canvas.width, proj.position[1] * canvas.height, 0.025 * canvas.width, 0, 2*Math.PI);
        context.fill();
        if (Math.abs(proj.position[0] - (player.position[0]+0.05)) < 0.1 && Math.abs(proj.position[1] - (player.position[1]+0.05)) < 0.1 && proj.id != player.id){
            player.hits += 1;
            proj.position[0] = 10;
        }
        for (var j of Object.keys(enemies)){
            var person = enemies[j]
            if (Math.abs(proj.position[0] - (person.position[0]+0.075)) < 0.05 && Math.abs(proj.position[1] - (person.position[1]+0.075)) < 0.05 && proj.id != person.id){
                proj.position[0] = 10;
            }
        }
        if (proj.position[0] < 0.025 || proj.position[0] > 0.975 || proj.position[1] < 0.025 || proj.position[1] > 0.975){
            projectiles.splice(i,1);
        }
    }
    
    for (var i of Object.keys(players)){
        var person = players[i];
    
        person.velocity[0] = person.velocity[0] + (person.input[0] * acceleration * 2 * deltaTime);
        person.velocity[1] = person.velocity[1] + (person.input[1] * acceleration * 2 * deltaTime);
    
        if (person.velocity[0] < 0){
            person.velocity[0] = Math.min(person.velocity[0] + acceleration*deltaTime, 0);
        }
        if (person.velocity[0] > 0){
            person.velocity[0] = Math.max(person.velocity[0] - acceleration*deltaTime, 0);
        }
        if (person.velocity[1] < 0){
            person.velocity[1] = Math.min(person.velocity[1] + acceleration*deltaTime, 0);
        }
        if (person.velocity[1] > 0){
            person.velocity[1] = Math.max(person.velocity[1] - acceleration*deltaTime, 0);
        }
    
        if (Math.sqrt(person.velocity[0] ** 2 + person.velocity[1] ** 2) > maxSpeed){
            person.velocity = normalize(person.velocity, maxSpeed);
        }/*
        if (person.id != player.id && (Math.abs(person.position[0] - person.truePos[0]) > 0.01 || Math.abs(person.position[1] - person.truePos[1]) > 0.01)){
            person.velocity[0] += (person.truePos[0] - person.position[0]) / 4
            person.velocity[1] += (person.truePos[1] - person.position[1]) / 4
        }*/
        person.position[0] = Math.max(Math.min(person.position[0] + person.velocity[0]*deltaTime, 0.9), 0);
        person.position[1] = Math.max(Math.min(person.position[1] + person.velocity[1]*deltaTime, 0.9), 0);

        context.beginPath();
        context.fillStyle = person.color;
        context.fillRect((person.position[0] * canvas.width), (person.position[1] * canvas.height),(canvas.width/10),(canvas.height/10));
    }

    document.getElementById("player").innerHTML = '<span style="color:' + player.color + '">' + player.name + ": " + player.hits + "</span>";
    document.getElementById("enemy").innerHTML = "";
    for(var i of Object.keys(enemies)){
        document.getElementById("enemy").innerHTML += '<span style="color:' + enemies[i].color + '">' + enemies[i].name + ": " + enemies[i].hits + "</span> <br>";
    }

    document.getElementById("fps").innerHTML = Math.floor(1/deltaTime) + " fps"
}

document.onkeydown = keyPress;
document.onkeyup = keyUp;
document.onmousedown = click;

function keyPress(e){
    var newInput = player.input;
    if (e.key == "w"){
        newInput[1] = -1;
    }
    if (e.key == "s"){
        newInput[1] = 1;
    }
    if (e.key == "a"){
        newInput[0] = -1;
    }
    if (e.key == "d"){
        newInput[0] = 1;
    }
    if (player.input[0] != newInput[0] || player.input[1] != newInput[1]){
        player.input = newInput
        socket.emit("input", {input: player.input, id: player.id});
    }
}
function keyUp(e){
    if (e.key == "w" || e.key == "s"){
        player.input[1] = 0;
    }
    if (e.key == "a" || e.key == "d"){
        player.input[0] = 0
    }
    socket.emit("input", {input: player.input, id: player.id});
}
function click(e){
    if (e.button == 0){
		mousePos = [
			Math.floor(e.clientX - leftBound) / canvas.width,
			Math.floor(e.clientY - bounding.top) / canvas.height
		]
        if (mousePos.every(i=>0<i && i<1)){
            vector = [mousePos[0] - (player.position[0] + 0.05), mousePos[1] - (player.position[1] + 0.05)]
            vector = normalize(vector, 0.5)
            projectiles.push(new Projectile([player.position[0] + 0.05 + vector[0]*deltaTime*4, player.position[1] + 0.05 + vector[1]*deltaTime*4], vector, player.id))
            socket.emit("projectile", projectiles[projectiles.length-1])
        }
    }
}

socket.on("connect", function (){
    player.id = socket.io.engine.id;
    socket.emit("join", player);
})
    
socket.on("FetchedPlayers", function (data){
    console.log(data)
    enemies = data;
    players = JSON.parse(JSON.stringify(enemies));
    players[player.id] = player;
    setInterval(render, 30);
    setInterval(sendUpdate, 500);
    fetched = true;
})

socket.on("NewPlayer", function (data){
    console.log(data)
    enemies[data.id] = data;
    players[data.id] = data;
})

function sendUpdate(){
    socket.emit("update", {position: player.position, id: player.id, hits:player.hits});
    player.lastUpdate = new Date().getTime();
}

socket.on("input", function(data){
    console.log("input")
    enemies[data.id].input = data.input;
    players[data.id].input = data.input;
})

socket.on("update", function(data){
    if (fetched){
        if (data.id == player.id){
            document.getElementById("ping").innerHTML = Math.floor(new Date().getTime() - player.lastUpdate) + " ms";
        }
        else{
            enemies[data.id].position = data.position;
            enemies[data.id].hits = data.hits;
            players[data.id].position = data.position;
            players[data.id].hits = data.hits;
        }
    }
})

socket.on("Left", function(id){
    delete enemies[id];
    delete players[id];
})

socket.on("projectile", function(projectile){
    projectiles.push(projectile)
})

function normalize(vector, targetMag){
    var mag = 0;
    for (var i of vector){
        mag += i**2;
    }
    mag = mag**(1/vector.length);
    for (var i = 0; i < vector.length; i++){
        vector[i] = (vector[i] * targetMag) / mag;
    }
    return vector;
}