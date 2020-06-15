var socket = io();

var msgForm = document.getElementById("msg-form");
var messages = document.getElementById("messages");
var msgInput = document.getElementById("msg-input");
var mainSection = document.getElementsByClassName("main-section");

msgForm.addEventListener('submit',(e) =>{
    e.preventDefault(); //prevents page reloading
    socket.emit('chat message',msgInput.value);
    msgInput.value = '';
    msgInput.focus();
});

socket.emit('joinRoom',{roomname:document.getElementById("room-name").textContent,user:document.getElementById("currUser").textContent});

socket.on('chat message',function(data){
    var item = document.createElement("li");
    if(data.id == socket.id){
        item.innerHTML = "<div class='sender'> <p class='user-info'><strong>" + data.user + "</strong> <span class='time'>" + data.time +"</span> </p> <p class='msg-content'>" + data.msg + "</p></div>"
    } else{
        item.innerHTML = "<div class='receiver'> <p class='user-info'><strong>" + data.user + "</strong> <span class='time'>" + data.time +"</span> </p> <p class='msg-content'>" + data.msg + "</p></div>"
    }
    messages.appendChild(item);
});

