const socket = io();
const videoGrid = document.getElementById('video-grid');
const {username, room} = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

// var peer = new Peer({　
  // host:'webois.herokuapp.com', 
  // secure:true, 
  // port:443, 
//   key: 'peerjs', 
//   debug: 3
// });

var peer = new Peer({
  host:'webois.herokuapp.com', 
  secure:true, 
  port: 443,
  path: '/peerjs/myapp',
  debug: 3,
  config: {
      'iceServers': [
          { url: 'stun:stun1.l.google.com:19302' },
          {
              url: 'turn:numb.viagenie.ca',
              credential: 'muazkh',
              username: 'webrtc@live.com'
          }
      ]
  }
});

// const peer = new Peer({
//   host: '/',
//   port: '3000',
//   path: '/peerjs/myapp'
// });

const myVideo = document.createElement('video');
myVideo.muted = true;
let peers = {};

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    });
  });

  socket.on('user-connected', userId => {
    setTimeout(() => {
      // user joined
      connectToNewUser(userId, stream)
    }, 3000)
  });

})


socket.on('user-disconnected', userId => {
  // document.getElementById(`${userId}`).remove();
  if (peers[userId]) peers[userId].close();
})

peer.on('open', id => {
  console.log(`User Join with ID: ${id}`);
  socket.emit('join-room', username, room, id);
  socket.on('roomPeers', ({room, users}) =>{
    roomName(room);
    addUser(users); 
  });
});

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream)
  const video = document.createElement('video');

  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove();
  });
  peers[userId] = call;
  
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
}


function addUser(users){
  roomUser = document.getElementById('users');
  roomUser.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
}
function roomName(room){
  const roomNam = document.getElementById('room-name');
  roomNam.innerText = room;
}