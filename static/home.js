//Makes pressing enter on the text field redirect properly
document.onkeypress = keyPress;

function keyPress(e){
    if (e.key == "Enter"){
        e.preventDefault();
        window.location.href += 'play#' + document.getElementById('join').value
    }
}