//Basic document details
const canvas = document.getElementById("main-canvas");
const context = canvas.getContext("2d");
const colors = ["Red", "Green", "Blue", "Green", "Purple", "Cyan", "Yellow", "Orange", "Pink"];
var bounding = canvas.getBoundingClientRect();
var socket = io({"forceNew": true});
var enemies = {};
var deltaTime = 1;
var lastTime = new Date().getTime();
var acceleration = 1.4;
var maxSpeed = 0.5;

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
    
    player.velocity[0] = player.velocity[0] + (input[0] * acceleration * 2 * deltaTime);
    player.velocity[1] = player.velocity[1] + (input[1] * acceleration * 2 * deltaTime);

    if (player.velocity[0] < 0){
        player.velocity[0] = Math.min(player.velocity[0] + acceleration*deltaTime, 0);
    }
    if (player.velocity[0] > 0){
        player.velocity[0] = Math.max(player.velocity[0] - acceleration*deltaTime, 0);
    }
    if (player.velocity[1] < 0){
        player.velocity[1] = Math.min(player.velocity[1] + acceleration*deltaTime, 0);
    }
    if (player.velocity[1] > 0){
        player.velocity[1] = Math.max(player.velocity[1] - acceleration*deltaTime, 0);
    }

    if (Math.sqrt(player.velocity[0] ** 2 + player.velocity[1] ** 2) > 0.5){
        player.velocity = normalize(player.velocity, 0.5);
    }
    
    for (var i = 0; i < projectiles.length; i++){
        var proj = projectiles[i];
        proj.position[0] += proj.velocity[0];
        proj.position[1] += proj.velocity[1];
        context.beginPath();
        context.fillStyle = "#FF0000";
        context.arc(proj.position[0] * canvas.width, proj.position[1] * canvas.height, 0.025 * canvas.width, 0, 2*Math.PI);
        context.fill();
        if (Math.abs(proj.position[0] - player.position[0]) < 0.1 && Math.abs(proj.position[1] - player.position[1]) < 0.1 && proj.id != player.id){
            player.hits += 1;
            proj.position[0] = 10;
        }
        if (proj.position[0] < 0.025 || proj.position[0] > 0.975 || proj.position[1] < 0.025 || proj.position[1] > 0.975){
            projectiles.splice(i,1);
        }
    }

    player.position[0] = Math.max(Math.min(player.position[0] + player.velocity[0]*deltaTime, 0.9), 0);
    player.position[1] = Math.max(Math.min(player.position[1] + player.velocity[1]*deltaTime, 0.9), 0);
    context.beginPath();
    context.fillStyle = player.color;
    context.fillRect((player.position[0] * canvas.width), (player.position[1] * canvas.height),(canvas.width/10),(canvas.height/10));
    for (var i of Object.keys(enemies)){
        var enemy = enemies[i];
        enemy.position[0] = Math.max(Math.min(enemy.position[0] + enemy.velocity[0]*deltaTime, 0.9), 0);
        enemy.position[1] = Math.max(Math.min(enemy.position[1] + enemy.velocity[1]*deltaTime, 0.9), 0);
        context.beginPath();
        context.fillStyle = enemy.color;
        context.fillRect((enemy.position[0] * canvas.width), (enemy.position[1] * canvas.height),(canvas.width/10),(canvas.height/10));
    }

    document.getElementById("player").innerHTML = '<span style="color:' + player.color + '">' + player.name + ": " + player.hits + "</span>";
    document.getElementById("enemy").innerHTML = "";
    for(var i of Object.keys(enemies)){
        document.getElementById("enemy").innerHTML += '<span style="color:' + enemies[i].color + '">' + enemies[i].name + ": " + enemies[i].hits + "</span> <br>";
    }

    document.getElementById("player").innerHTML += "<br>" + Math.floor(1/deltaTime) + " fps"
}

document.onkeydown = keyPress;
document.onkeyup = keyUp;
document.onmousedown = click;

function keyPress(e){
    if (e.key == "w"){
        input[1] = -1;
    }
    if (e.key == "s"){
        input[1] = 1;
    }
    if (e.key == "a"){
        input[0] = -1;
    }
    if (e.key == "d"){
        input[0] = 1;
    }
}
function keyUp(e){
    if (e.key == "w" || e.key == "s"){
        input[1] = 0;
    }
    if (e.key == "a" || e.key == "d"){
        input[0] = 0
    }
}
function click(e){
    if (e.button == 0){
		mousePos = [
			Math.floor(e.clientX - leftBound) / canvas.width,
			Math.floor(e.clientY - bounding.top) / canvas.height
		]
        if (mousePos.every(i=>0<i && i<1)){
            vector = [mousePos[0] - (player.position[0] + 0.05), mousePos[1] - (player.position[1] + 0.05)]
            vector = normalize(vector, 0.02)
            projectiles.push(new Projectile([player.position[0] + 0.05 + vector[0] * 4 , player.position[1] + 0.05 + vector[1] * 4], vector, player.id))
            socket.emit("projectile", projectiles[projectiles.length-1])
        }
    }
}

socket.on("connect", function (){
    player.id = socket.io.engine.id;
    setInterval(render, 100/3);
    setInterval(sendUpdate, 100);
    socket.emit("join", player);
})
    
socket.on("FetchedPlayers", function (data){
    enemies = JSON.parse(data);
})

socket.on("NewPlayer", function (data){
    enemies[data.id] = data;
})

function sendUpdate(){
    socket.emit("update", player);
}

socket.on("update", function(data){
    console.log(data);
    var newVelocity = [(data.position[0] - enemies[data.id].position[0]) / 5, (data.position[1] - enemies[data.id].position[1]) / 5]
    enemies[data.id].velocity = newVelocity;
})

socket.on("Left", function(id){
    console.log(id)
    delete enemies[id];
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