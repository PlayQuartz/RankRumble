import './style.css'
import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

const SOCKET_SERVER_URL = 'https://socket.playquartz.com?webapp=rankrumble';

const Ranking = ({data, lock}) => {

    const Entry = ({rank, record}) =>  {

        const [stateLock, setStateLock] = useState(true)

        return (
            <div className='entry' onClick={() => setStateLock(false)}>
                <div className='rank'>{rank}</div>
                <div className='record'>{record}</div>
                    {
                        (stateLock && lock) && (
                            <div className='lock' >
                                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#414141" height="20px" width="20px" version="1.1" viewBox="0 0 330 330" xmlSpace="preserve">
                                    <g>
                                        <path d="M65,330h200c8.284,0,15-6.716,15-15V145c0-8.284-6.716-15-15-15h-15V85c0-46.869-38.131-85-85-85S80,38.131,80,85v45H65c-8.284,0-15,6.716-15,15v170C50,323.284,56.716,330,65,330z M180,234.986V255c0,8.284-6.716,15-15,15s-15-6.716-15-15v-20.014c-6.068-4.565-10-11.824-10-19.986c0-13.785,11.215-25,25-25s25,11.215,25,25C190,223.162,186.068,230.421,180,234.986z M110,85c0-30.327,24.673-55,55-55s55,24.673,55,55v45H110V85z"></path>
                                    </g>
                                </svg>
                            </div>
                        )
                    }
            </div>
        )
    }

    return (
        <div className='ranking'>
        {
            data && data.map((record, index) => (
                <Entry key={index}  rank={index+1} record={record}/> 
            ))
        }
    </div>
    )

}


const Overlay = () => {

    const [privateCode, setPrivateCode] = useState(null)
    const [socket, setSocket] = useState(null);
    const [username, setUsername] = useState(null)
    const [correction, setCorrection] = useState(null)
    const user_id = new URLSearchParams(useLocation().search).get('user_id');


    useEffect(() => {

        const fetch_code = () => {
            fetch('https://api.playquartz.com/request/get_quizz_broadcast/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => setPrivateCode(data.broadcast_code))
        }

        fetch_code()
        const interval_id = setInterval(fetch_code, 5000)
        return () => clearInterval(interval_id)
    }, [])

    useEffect(() => {

        const socket_io = io(SOCKET_SERVER_URL);

        socket_io.emit('spectate_game', { private_code: privateCode, user_id})

        if(user_id){
            socket_io.on('overlay', (socket_data) => {
                console.log(socket_data)
                setUsername(socket_data.username)
                setCorrection(socket_data.answer)
            })
        }
        else{
            socket_io.on('answer', (socket_data) => {
                setCorrection(socket_data.answer)
    
            })
        }

        setSocket(socket_io);

        return () => {
            socket_io.disconnect();
        };
    }, [privateCode]);

    return (
        <div className='overlay'>

            {username && <div className='username'>{username}</div>}
            {correction && <Ranking data={correction} lock={user_id ? false : true}/>}

        </div>
    )
}

export default Overlay