const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, './public')));
app.use(bodyParser());

app.post('/log', (req, res) => {
  const { body } = req;
  console.log(JSON.stringify(body, null, 2));
  res.send();
});

http.listen(8080, () => console.log(8080));

fs.watch('./public', {
  recursive: true,
}, (eventType, filename) => {
  console.log(eventType, filename);
  if (eventType === 'change' && filename.indexOf('.js') >= 0) {
    refresh();
  }
});

let sockets = [];
io.on('connection', (socket) => {
  sockets.push(socket);
  console.log('a user connected');
  socket.on('disconnect', () => {
    sockets = sockets.filter((socket_) => socket != socket_);
  });
});

function refresh() {
  sockets.forEach(socket => socket.emit('refresh'));
}