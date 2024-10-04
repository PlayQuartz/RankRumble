import './style.css'
import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const HostContext = createContext();

const SOCKET_SERVER_URL = 'http://localhost:3001';

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

const CheckBox = ({ className}) => {

    const [state, setState] = useState(false)

    return (
        <svg onClick={() => setState(!state)} state={state} className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="inherit" strokeWidth="4" />
            {state ? <polyline points="30,50 45,65 70,35" fill="none" stroke="white" strokeWidth="6"/> : ''}
        </svg>
    )
}

const LobbyRoom = () => {

    const { privateCode, playerList, socket, setCurrentState} = useContext(HostContext);

    const start_quizz = () => {
        socket.emit('quizz_state', {state: 'question', current_question: 1, private_code: privateCode})
        setCurrentState(<ReviewRoom/>)
    }

    return (
        <div className='lobby_room'>
            <button onClick={start_quizz} className='start_button'>Start</button>
            <div className='invite_code'>{privateCode}
                <div className='user_connected'>
                    {
                        Array.from(playerList).map((user, index) => (<div className='user' key={index}>{user}</div>))
                    }
                </div>
            </div>
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

const ReviewRoom = () => {

    const { privateCode, socket, setCurrentState, nextState, playerAnswers } = useContext(HostContext);

    const UserAnswer = ({ data }) => {

        const user_answer = useRef(null)

        let timestamp = data.timestamp / 1000

        const submit_result = () => {
            let correction = []
            let corrects = user_answer.current.querySelectorAll('.correct')
            let positions = user_answer.current.querySelectorAll('.position')
            corrects.forEach(checkbox => {
                correction.push(checkbox.querySelectorAll('polyline').length)
            })
            positions.forEach((checkbox, index) => {
                correction[index] = checkbox.querySelectorAll('polyline').length === 1 ? 2 : correction[index]
            })
            console.log(correction)
            socket.emit('submit_result', {private_code: privateCode, user_id: data.user_id, result: correction})

        }

        return (
            <div className='user_answer' ref={user_answer}>
                <div className='username'>{data.user_id}</div>
                <div className='submit_time'>{timestamp}s</div>
                {
                    data.answers.map((record, index) => (
                        <div className='row'>
                            <div className='rank'>{index + 1}</div>
                            <div className='record'>{record}</div>
                            <CheckBox className='correct' />
                            <CheckBox className='position' />
                        </div>
                    ))
                }
                <button onClick={submit_result} className='submit_answer'>Validate Correction</button>
            </div>
        )
    }

    const next_question = () => {
        if(nextState === -1){
            socket.emit('quizz_state', {state: 'leaderboard', private_code: privateCode})
            setCurrentState(<LeaderboardRoom />)
        }
        else{
            socket.emit('quizz_state', {state: 'question', current_question: nextState, private_code: privateCode})
        }
    }

    return (
        <div className='review_room'>
            <button onClick={next_question} className='next_button'>{nextState === -1 ? 'See Leaderboard' : 'Next Question'}</button>
            <div className='question_container'>
                <div className='question'>This is a test question?</div>
            </div>
            <div className='answer_container'>
                {
                    playerAnswers && playerAnswers.map((data, index) => <UserAnswer data={data} key={index}/>)
                }
            </div>
        </div>
    )
}

const Host = () => {
    const [playerList, setPlayerList] = useState(new Set());
    const [privateCode, setPrivateCode] = useState(null)
    const [socket, setSocket] = useState(null);
    const [nextState, setNextState] = useState(0);
    const [currentState, setCurrentState] = useState();
    const [playerAnswers, setPlayerAnswers] = useState([])
    const uuid = new URLSearchParams(useLocation().search).get('uuid');
    const token = get_cookie('auth_token')
    const userID = get_cookie('user_id');
    const navigate = useNavigate()

    useEffect(() => {
        const checkUserConnection = async () => {
            fetch('https://api.playquartz.com/request/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({token})
            })
            .then(response => response.json())
            .then(data => {
                if(!data.valid || data.expired){
                    navigate('/')
                }
                else{
                    setPrivateCode((Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000).toString())
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
        setCurrentState(<LobbyRoom />);
        const socket_io = io(SOCKET_SERVER_URL);

        socket_io.emit('host_game', {code: privateCode, user_id: userID, quizz_uuid: uuid});

        socket_io.on('user_join', (socket_data) => {

            const {user_id} = socket_data

            setPlayerList(pastSet => {
                const newSet = new Set(pastSet);
                newSet.add(user_id);
                return newSet;
            });
        });

        socket_io.on('room_state', (socket_data) => {

            if(socket_data.state === 3){

                setCurrentState(<LeaderboardRoom  leaderboard={socket_data.leaderboard}/>)
            }
        })

        socket_io.on('submitted_answer', (socket_data) => {
            setPlayerAnswers((prevList) => [...prevList, socket_data]);
        })

        socket_io.on('next_state', (socket_data) => {
            setNextState(socket_data.state);
        });

        setSocket(socket_io);

        return () => {
            socket_io.disconnect();
        };
    }, [privateCode, uuid, userID]);

    return (
        <HostContext.Provider value={{ playerList, privateCode, socket, nextState, setCurrentState, playerAnswers }}>
            <div className="host_container">
                {currentState}
            </div>
        </HostContext.Provider>
    );
};

export default Host;