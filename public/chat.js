
var socket = io();
    // $('#msg-form').submit(function(e) {
    //     e.preventDefault(); // prevents page reloading
    //     socket.emit('chat message', $('#msg-input').val());
    //     $('#msg-input').val('');
    //     return false;
    // });
    // socket.on('chat message', function(msg){
    //     console.log(msg);
    //     $('#messages').append($('<li>').text(msg));
    // });

var msgForm = document.getElementById("msg-form");
var messages = document.getElementById("messages");
var msgInput = document.getElementById("msg-input");
var currUser = document.getElementById('currUser');

msgForm.addEventListener('submit',(e) =>{
    e.preventDefault(); //prevents page reloading
    socket.emit('chat message',msgInput.value);
    msgInput.value = '';
    msgInput.focus();
});

socket.on('chat message',function(data){
    // var msg = "<strong>" + data.user + ": </strong>" + data.msg;
    // $('#messages').append($('<li>').text(msg));
    console.log(socket.id);
    var item = document.createElement("li");
    if(data.id == socket.id){
        item.innerHTML = "<div class='sender'> <p class='user-info'><strong>" + data.user + "</strong> <span class='time'>" + data.time +"</span> </p> <p class='msg-content'>" + data.msg + "</p></div>"
    } else{
        item.innerHTML = "<div class='receiver'> <p class='user-info'><strong>" + data.user + "</strong> <span class='time'>" + data.time +"</span> </p> <p class='msg-content'>" + data.msg + "</p></div>"
    }
    
    // item.innerHTML = "<strong>" + data.user + ": </strong>" + data.msg;
    messages.appendChild(item);
    window.scrollTo(0,document.body.scrollHeight);
});

