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


    socket.emit('room_state', {state: 0})

    socket.on('quizz_state', (socket_data) => {

        let {private_code, state, current_question} = socket_data

        if(state === 'question'){
            quizz_data[private_code].state = 'question'
            quizz_data[private_code].current_question = current_question
            quizz_data[private_code].question_timestamp = new Date
            io.to(socket_data.private_code).emit('room_state', {state: 2, question: quizz_data[private_code].questions[current_question.toString()], answers: 5})
        }
        else if(state === 'leaderboard'){
            quizz_data[private_code].state = 'leaderboard'
            quizz_data[private_code].current_question = 0

            // Create Leaderboard
            let leaderboard = [['Reisshub', 8, 1600], ['Boop', 8, 1400]]
            console.log('check', Object.keys(quizz_data[private_code].results))
            Object.keys(quizz_data[private_code].results).forEach((user_id, index) => {
                let points = 0
                let time = 0
                console.log('chec')
                Object.keys(quizz_data[private_code].results[user_id]).forEach((question, index) => {
                    console.log(question, quizz_data[private_code].answers[user_id][question])
                    time += quizz_data[private_code].answers[user_id][question].timestamp
                    points += quizz_data[private_code].results[user_id][question].reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                })  

                leaderboard.push([user_id, points, time])
            })  

            leaderboard.sort((a, b) => {
                if (b[1] !== a[1]) {
                  return b[1] - a[1]; 
                } else {
                  return a[2] - b[2];
                }
            });

            io.to(private_code).emit('room_state', {state: 3, leaderboard})
        }

        if((current_question+1).toString() in quizz_data[private_code].questions){
            socket.emit('next_state', {state: current_question+1})
        }
        else{
            socket.emit('next_state', {state: -1})
        }

    })

    socket.on('submit_result', (socket_data) => {
        const {result, private_code, user_id} = socket_data
        if(!(user_id in quizz_data[private_code].results)){
            quizz_data[private_code].results[user_id] = {}
        }
        quizz_data[private_code].results[user_id][quizz_data[private_code].current_question] = result
        console.log(quizz_data[private_code].results)
    })

    socket.on('submit_answers', (socket_data) => {
        const {answers, private_code, user_id} = socket_data

        if(!(user_id in quizz_data[private_code].answers)){
            quizz_data[private_code].answers[user_id] = {}
        }

        quizz_data[private_code].answers[user_id][quizz_data[private_code].current_question] = {
            answers,
            timestamp: new Date() - quizz_data[private_code].question_timestamp
        }

        let host_data = {
            'user_id': user_id,
            'answers': answers, 
            'timestamp': new Date() - quizz_data[private_code].question_timestamp
        }

        socket.emit('room_state', {state: 1, waiting_state: 2})
        io.to(quizz_data[private_code].host_socket_id).emit('submitted_answer', host_data)
    });

    socket.on('host_game', (socket_data) => {
        socket.join(socket_data.code)
        if(socket_data.code in quizz_data){
            if(quizz_data[socket_data.code].host !== socket_data.user_id){
                console.log('Error - Wrong Host')
                return
            }
            else{
                quizz_data[socket_data.code].host = socket_data.user_id
                quizz_data[socket_data.code].host_socket_id = socket.id
                return
            }
        }

        fetch('https://api.playquartz.com/request/get_quizz/'+socket_data.quizz_uuid)
        .then(response => response.json())
        .then(data => {
            quizz_data[socket_data.code] = {
                'host': socket_data.user_id,
                'host_socket_id': socket.id,
                'players': [],
                'questions': data.quizz_questions,
                'answers': {},
                'results': {},
                'current_question': 0,
                'state': 'waiting'
            }
        })
    })

    socket.on('join_game', (socket_data) => {
        const {private_code, user_id} = socket_data

        if(private_code === null){
            return socket.emit('room_state', {state: 0})
        }
        if(private_code in quizz_data){
            console.log('Enter')
            socket.join(private_code)
            io.to(private_code).emit('user_join', {user_id})

            if(quizz_data[private_code].state === 'waiting'){
                socket.emit('room_state', {state: 1, waiting_state: 0})
            }
            else if(quizz_data[private_code].state === 'question'){
                socket.emit('room_state', {state: 2, question: quizz_data[private_code].questions[quizz_data[private_code].current_question.toString()], answers: 5})
            }
            
        }
        else{
            socket.emit('room_state', {state: 1, waiting_state: 3})
        }    
    })

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
