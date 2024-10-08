const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors')
const fetch = require('node-fetch');

const app = express();
app.use(cors())
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: '*',  
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

const PORT = 3001;

const quizz_data = {
    'private_code': {
        'host': 'host socket.id',
        'players': ' players socket.id',
        'questions': {
            'id': 'question'
        },
        'answers': {
            'player_id': {
                'question_id': {
                    'answers': [],
                    'timestamp': new Date()
                }
            }
        },
        'current_question': 0,
        'question_timestamp': new Date(),
        'state': 'waiting'
    }
}

// socket.emit('room_state', {state: 2, question: 'Here is the question', answers: 6})

io.on('connection', (socket) => {



});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
