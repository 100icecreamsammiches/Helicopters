//Makes pressing enter on the text field redirect properly
document.onkeypress = keypress;
window.addEventListener("DOMContentLoaded", ()=>{
    document.getElementById("play").onclick = join;
})

function keypress(e){
    if (e.key == "Enter"){
        e.preventDefault();
        join()
    }
}

function join(){
    if (document.getElementById("name").value.includes("<script") || document.getElementById("name").value.includes("<a")){
        window.location.replace("https://www.google.com/search?q=why+cheating+is+bad&rlz=1CATAVM_enUS917US920&oq=why+cheating+is+bad&aqs=chrome..69i57j0i22i30l7j0i15i22i30j0i22i30.5805j0j7&sourceid=chrome&ie=UTF-8&safe=active&ssui=on");
    }
    var newhref = JSON.parse(JSON.stringify(window.location.href)) + "play";
    var name = document.getElementById('name').value;
    var color = document.getElementById('color').value;
    var valid = true;
    if (name != ""){
        newhref += '?name=' + encodeURIComponent(name.replaceAll('<', '').replaceAll('>', '').slice(0,14));
        
        if (color != ""){
            if (!isValidColor(color)){
                alert("Invalid Color")
                valid = false;
            }
            else{
                newhref += "&color=" + encodeURIComponent(color);
            }
        }
    }        

    else if (color != ""){
        if (!isValidColor(color)){
            alert("Invalid Color")
            valid = false;
        }
        else{
            newhref += "?color=" + encodeURIComponent(color);
        }
    }
    if (valid){
        window.location.href = newhref;
    }
}

function isValidColor(strColor) {
    var s = new Option().style;
    s.color = strColor;

    console.log(s.color);
    return s.color != "";
}