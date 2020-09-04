// Modules
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const moment = require('moment');
const { ExpressPeerServer } = require("peer");


// Initializations
const app = express();
const server = http.createServer(app);

const io = socketio(server);

// Variables
const PORT = process.env.PORT || 3000;
const WeBot = "WeBois";
const users = [];
const peers = [];

// Setting Views
app.set('view engine', 'ejs');

// Setting Static
app.use(express.static(path.join(__dirname, 'public')));

//Client Connection with Socket
io.on('connection', socket => {

    socket.on('join-room', (username, room, id) =>{
        const getUsers = getRoomPeers(room);
        for(let i=0; i<getUsers.length; i++){
            if(getUsers[i].username === username){
                username = `${username} - ${socket.id.substr(0,4)}`;
                break;
            }
        }

        const user = peerJoin(username, room, id);
        socket.join(user.room);

        socket.broadcast.to(user.room).emit('user-connected', id);

        io.to(room).emit('roomPeers',{
            room: room,
            users: getRoomPeers(room)
        });

        socket.on('disconnect', ()=> {
            const user = peerLeave(id);
            // socket.broadcast.to(user.room).emit('user-disconnected', id);
            if(user){
                io.to(user.room).emit('user-disconnected', id);
                // Updateing room Users
                io.to(room).emit('roomPeers',{
                    room: room,
                    users: getRoomPeers(room)
                });
            }
        });

    });


    socket.on('joinroom', ({username, room}) =>{
        const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);
        const getUsers = getRoomUsers(room);
        for(let i=0; i<getUsers.length; i++){
            if(getUsers[i].username === username){
                username = `${username} - ${socket.id.substr(0,4)}`;
                break;
            }
        }
        const user = userJoin(socket.id, username, room , randomColor);
        socket.join(user.room);
        // Welcome User
        socket.emit('message', formatMessage(WeBot, `Welcome ${username}!`));
        // Connecting User
        socket.broadcast.to(user.room).emit('message', formatMessage(WeBot,`${username} Joined the Chat!`));

        io.to(room).emit('roomUsers',{
            room: room,
            users: getRoomUsers(room)
        });
    });
    
    socket.on('chatMessage', msg => {
        const user = currentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg, user.color));
    });

    // Disconnect
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        if(user){
            io.emit('message', formatMessage(WeBot,`${user.username} has Left the chat!`));
            // Updateing room Users
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
    


});


// Message Format
function formatMessage(user, text, color){
    return {
        user,
        text,
        color,
        date: moment().format('h:mm a')
    }
}

//------------------------------ Users -----------------------------\\
function userJoin(id, username, room, color){
    const user = {id, username, room, color};
    users.push(user);
    return user;
}

function currentUser(id){
    return users.find(user => user.id === id);
}

// User Leaves
function userLeave(id){
    const index = users.findIndex(user => user.id === id);
    if(index !== -1){
        return users.splice(index, 1)[0];
    }
}

// Get room Users
function getRoomUsers(room){
    return users.filter(user => user.room === room);
}

//------------------------------ Peer Join -----------------------------\\
function peerJoin(username, room, id){
    const peer_user = {username, room, id};
    peers.push(peer_user);
    return peer_user;
}

function getRoomPeers(room){
    return peers.filter(user => user.room === room);
}

function peerLeave(id){
    const index = peers.findIndex(user => user.id === id);
    if(index !== -1){
        return peers.splice(index, 1)[0];
    }
}

const listener = server.listen(PORT, ()=> console.log(`Server Running on post ${PORT}`));
const peerServer = ExpressPeerServer(listener, {
    debug: true,
    path: '/myapp'
  });
  app.use('/peerjs', peerServer);