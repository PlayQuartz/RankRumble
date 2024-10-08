import './style.css'
import React, { useState, useEffect, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const PlayContext = createContext()

const SOCKET_SERVER_URL = 'https://socket.playquartz.com?webapp=rankrumble';

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};


const AccessRoom = ({ setPrivateCode }) => {

    const [userInput, setUserInput] = useState(null)

    return (
        <div className='access_room'>
            <div className='border_container'>
                <div className='code_container'>
                    <div className='border_input'>
                        <input type='number' id='private_code' onChange={(e) => setUserInput(e.target.value)} placeholder='Private Code' />
                    </div>
                    <button id='submit_private_code' onClick={() => setPrivateCode(userInput)} >Validate</button>
                </div>
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
            <div className='subtitle'>{subtitles[state]}</div>
        </div>
    )
}

const LeaderboardRoom = ({ leaderboard }) => {

    const {navigate} = useContext(PlayContext)

    return (
        <div className='leaderboard_room'>

            <div className='header'>
                <div onClick={() => navigate('/dashboard')} className='logo'>Rank Rumble</div>
                <div className='logout'>Log Out</div>
            </div>

            <div className='table_container'>
                <div className='table'>
                    <div className='row'>
                        <div className='key'>Rank</div>
                        <div className='key'>Player</div>
                        <div className='key'>Points</div>
                        <div className='key'>Time</div>
                    </div>

                    {
                        leaderboard && leaderboard.map((row, index) => (
                            <div className='row' key={index}>
                                <div className='border'><div className='rank'>{index + 1}</div></div>
                                <div className='border'><div className='username'>{row[0]}</div></div>
                                <div className='border'><div className='points'>{row[1]}</div></div>
                                <div className='border'><div className='timestamp'>{row[2] / 1000}s</div></div>
                            </div>
                        ))
                    }

                </div>
            </div>
        </div>
    )
}

const QuestionRoom = ({ question, answers }) => {

    const { privateCode, socket, userID, navigate } = useContext(PlayContext)

    const submit_answers = () => {
        let records = document.querySelectorAll('.record')
        let answers = []
        records.forEach((record, index) =>
            answers.push(record.value)
        )
        socket.emit('submit_answers', { answers, private_code: privateCode, user_id: userID })
    }

    return (
        <div className='quizz_room'>

            <div className='header'>
                <div onClick={() => navigate('/dashboard')} className='logo'>Rank Rumble</div>
                <div className='logout'>Log Out</div>
            </div>

            <div className='answer_container'>
                <div className='question'>{question}</div>
                <div className='row'>
                    <div>Rank</div>
                    <div>Record</div>
                </div>

                {
                    Array.from({ length: answers }).map((_, index) => (

                        <div className='row' key={index}>
                            <div className='border'>
                                <div className='black_background'>
                                    <div className='rank'>{index + 1}</div>
                                </div>
                            </div>
                            <div className='border'>
                                <input className='record' placeholder={'Record ' + (index + 1)} />
                            </div>

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
    const token = get_cookie('auth_token')
    const userID = get_cookie('user_id');
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserConnection = async () => {

            fetch('https://api.playquartz.com/request/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            })
                .then(response => response.json())
                .then(data => {
                    if (!data.valid || data.expired) {
                        navigate('/')
                    }
                })
                .catch(error => {
                    console.log(error)
                    navigate('/')
                })
        }
        checkUserConnection();
    }, [token, navigate]);


    useEffect(() => {

        const socket_io = io(SOCKET_SERVER_URL);

        socket_io.emit('join_game', { private_code: privateCode, user_id: userID })

        socket_io.on('room_state', (data) => {
            if (data.state === 0) {
                setCurrentRoom(<AccessRoom setPrivateCode={setPrivateCode} />)
            }
            else if (data.state === 1) {
                setCurrentRoom(<WaitingRoom state={data.waiting_state} />)
            }
            else if (data.state === 2) {
                setCurrentRoom(<QuestionRoom question={data.question} answers={data.answers} />)
            }
            else if (data.state === 3) {
                setCurrentRoom(<LeaderboardRoom leaderboard={data.leaderboard} />)
            }
        })

        setSocket(socket_io);

        return () => {
            socket_io.disconnect();
        };
    }, [privateCode, userID]);

    return (

        <PlayContext.Provider value={{ privateCode, socket, setCurrentRoom, userID, navigate }}>
            <div className='play_container'>
                {currentRoom}
            </div>
        </PlayContext.Provider>
    )
}

export default Play