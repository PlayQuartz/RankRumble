import './style.css'
import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const HostContext = createContext();

const SOCKET_SERVER_URL = 'https://socket.playquartz.com?webapp=rankrumble';

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

const CheckBox = ({ className}) => {

    const [state, setState] = useState(false)
    

    return (
        <svg onClick={() => setState(!state)} state={state} className={className} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradientBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#1e90ff", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#6a0dad", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
    
          <rect x="2" y="2" width="116" height="116" rx="20" ry="20" fill="none" stroke="url(#gradientBorder)" strokeWidth="4" />
          <rect x="8" y="8" width="104" height="104" rx="16" ry="16" fill="black" />
          
          {state ? <polyline points="35,55 50,70 75,40" fill="none" stroke="white" strokeWidth="8" /> : null}
        </svg>
      );
}

const LobbyRoom = () => {

    const { privateCode, playerList, socket, setCurrentState} = useContext(HostContext);
    const [copyState, setCopyState] = useState(false)

    const start_quizz = () => {
        socket.emit('quizz_state', {state: 'question', current_question: 1, private_code: privateCode})
        setCurrentState(<ReviewRoom/>)
    }

    const copy_code = () => {
        navigator.clipboard.writeText(privateCode)
        setCopyState(true)


        setInterval(() => {
            setCopyState(false)
        }, 2000)

    }

    return (
        <div className='lobby_room'>
            <button onClick={start_quizz} className='start_button'>Start</button>
            <div onClick={copy_code} className='border'>
                <div className='background'>
                    <div className='invite_code'>{privateCode}
                        <div style={{display: copyState ? 'block' : 'none'}} className='copied'>Code Copied</div>
                        <div className='user_connected'>
                            {
                                Array.from(playerList).map((user, index) => (
                                    <div className='border'>
                                        <div className='user' key={index}>{user}</div>
                                    </div>
                                
                            ))
                            }
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

const LeaderboardRoom = ({ leaderboard }) => {

    const {navigate} = useContext(HostContext)

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

const ReviewRoom = () => {

    const { privateCode, currentQuestion,  socket, setCurrentState, nextState, playerAnswers, setPlayerAnswers } = useContext(HostContext);

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
                <div className='username'>{data.username ? data.username : data.user_id}</div>
                <div className='submit_time'>{timestamp}s</div>
                {
                    data.answers.map((record, index) => (
                        <div className='row'>
                            <div className='border'><div className='rank'>{index + 1}</div></div>
                            <div className='border'><div className='record'>{record}</div></div>
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
            setPlayerAnswers([])
            socket.emit('quizz_state', {state: 'question', current_question: nextState, private_code: privateCode})

        }
    }

    return (
        <div className='review_room'>
            <button onClick={next_question} className='next_button'>{nextState === -1 ? 'See Leaderboard' : 'Next Question'}</button>
            <div className='question_container'>
                <div className='question'>{currentQuestion && currentQuestion}</div>
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
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [socket, setSocket] = useState(null);
    const [nextState, setNextState] = useState(0);
    const [currentState, setCurrentState] = useState(<LobbyRoom />);
    const [playerAnswers, setPlayerAnswers] = useState([])
    const uuid = new URLSearchParams(useLocation().search).get('uuid');
    const token = get_cookie('auth_token')
    const userID = get_cookie('user_id');
    const navigate = useNavigate()

    useEffect(() => {

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

    }, [token, navigate]);


    useEffect(() => {

        const socket_io = io(SOCKET_SERVER_URL);

        socket_io.emit('host_game', {code: privateCode, user_id: userID, quizz_uuid: uuid});

        socket_io.on('user_join', (socket_data) => {

            const {user_id, username} = socket_data
            setPlayerList(pastSet => {
                const newSet = new Set(pastSet);
                if(username){
                    newSet.add(username);
                }
                else{
                    newSet.add(user_id);
                }
                return newSet;
            });
        });

        socket_io.on('room_state', (socket_data) => {
            if(socket_data.state === 3){
                setCurrentState(<LeaderboardRoom  leaderboard={socket_data.leaderboard}/>)
            }
            else if(socket_data.state === 2){
                setCurrentQuestion(socket_data.question)
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
        <HostContext.Provider value={{ navigate, setPlayerAnswers, currentQuestion, playerList, privateCode, socket, nextState, setCurrentState, playerAnswers }}>
            <div className="host_container">
                {currentState}
            </div>
        </HostContext.Provider>
    );
};

export default Host;