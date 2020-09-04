const chatform = document.getElementById('chat-form');
const CM = document.querySelector('.chat-messages');
const socket = io();
const {username , room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

// Joining a Room
socket.emit('joinroom', {username , room});

socket.on('message', message => {
    outputMessage(message);
    //Scroll
    CM.scrollTop = CM.scrollHeight;
    // Clearing input

});

socket.on('roomUsers', ({room, users}) =>{
    roomName(room);
    addUser(users); 
})

chatform.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    
    socket.emit('chatMessage', msg);
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta" style="color:${message.color};">${message.user} <span>${message.date}</span></p>
    <p class="text">
        ${message.text}
    </p>`
    document.querySelector('.chat-messages').appendChild(div);
}

function addUser(users){
    roomUser = document.getElementById('users');
    roomUser.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
}

function roomName(room){
    const roomNam = document.getElementById('room-name');
    roomNam.innerText = room;
}