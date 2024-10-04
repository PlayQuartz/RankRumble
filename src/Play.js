import './style.css'
import React, { useState, useEffect, createContext, useContext } from 'react'
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const PlayContext = createContext()

const SOCKET_SERVER_URL = 'http://localhost:3001';

const AccessRoom = ({ setPrivateCode }) => {

    const [userInput, setUserInput] = useState(null)

    return (
        <div className='access_room'>
            <div className='code_container'>
                <input type='number' id='private_code' onChange={(e) => setUserInput(e.target.value)} placeholder='Private Code' />
                <button id='submit_private_code' onClick={() => setPrivateCode(userInput)} >Validate</button>
            </div>
        </div>
    )
}

const WaitingRoom = ({ state }) => {

    const titles = ['Get Ready!', 'Answer Submitted!', 'Answer Submitted!', 'Invalid Code']
    const subtitles = ['The game will start any moment now. Please wait.', 'Hold tight! The next question is coming soon.', 'Hold on! The game leader is reviewing the answers.', 'Double-check your code and try again.']

    return (
        <div className='waiting_room'>
            <div className='title'>{titles[state]}</div>
            <div>{subtitles[state]}</div>
        </div>
    )
}

const LeaderboardRoom = ({leaderboard}) => {

    return (
        <div className='leaderboard_room'>
            <div className='table'>
                <div className='row'>
                    <div>Rank</div>
                    <div>Player</div>
                    <div>Points</div>
                    <div>Timestamp</div>
                </div>
                {
                    leaderboard && leaderboard.map((row, index) => (
                        <div className='row' key={index}>
                            <div className='rank'>{index+1}</div>
                            <div className='username'>{row[0]}</div>
                            <div className='points'>{row[1]}</div>
                            <div className='timestamp'>{row[2]/1000}s</div>
                        </div>
                    ))
                }

            </div>
        </div>
    )
}

const QuestionRoom = ({ question, answers}) => {

    const {privateCode, socket, setCurrentRoom, userID} = useContext(PlayContext)

    const submit_answers = () => {
        let records = document.querySelectorAll('.record')
        let answers = []
        records.forEach((record, index) =>
            answers.push(record.value)
        )
        socket.emit('submit_answers', {answers, private_code: privateCode, user_id: userID})
    }

    return (
        <div className='quizz_room'>
            <div className='question_container'>
                <div className='question'>{question}</div>
            </div>
            <div className='answer_container'>
                <div className='row'>
                    <div>Rank</div>
                    <div>Record</div>
                </div>

                {
                    Array.from({ length: answers }).map((_, index) => (

                        <div className='row' key={index}>
                            <div className='rank'>{index + 1}</div>
                            <input className='record' placeholder={'Record ' + (index + 1)} />
                        </div>

                    ))
                }
                <button className='submit_answer' onClick={submit_answers}>Submit Results</button>
            </div>
        </div>
    )
}


const Play = () => {
    const [privateCode, setPrivateCode] = useState(null)
    const [socket, setSocket] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(<AccessRoom />)
    const {userID} = useParams()

    useEffect(() => {

        const socket_io = io(SOCKET_SERVER_URL);
        console.log('test', privateCode)
        socket_io.emit('join_game', {private_code: privateCode, user_id: userID})

        socket_io.on('room_state', (data) => {
            if(data.state === 0){
                setCurrentRoom(<AccessRoom setPrivateCode={setPrivateCode}/>)             
            }
            else if(data.state === 1){
                setCurrentRoom(<WaitingRoom state={data.waiting_state}/>)
            }
            else if(data.state === 2){
                setCurrentRoom(<QuestionRoom question={data.question} answers={data.answers}/>)
            }
            else if(data.state === 3){
                setCurrentRoom(<LeaderboardRoom leaderboard={data.leaderboard} />)
            }
        })

        setSocket(socket_io);

        return () => {
            socket_io.disconnect();
        };
    }, [privateCode]);

    return (

        <PlayContext.Provider value={{privateCode, socket, setCurrentRoom, userID}}>
            <div className='play_container'>
                {currentRoom}
            </div>
        </PlayContext.Provider>
    )
}

export default Play