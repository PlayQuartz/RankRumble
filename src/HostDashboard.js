import './style.css'
import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'

const HostDashboard = () => {

    const [quizz, setQuizz] = useState([])
    const navigate = useNavigate()

    useEffect(() => {

        fetch('https://api.playquartz.com/request/get_quizz/all')
        .then(response => response.json())
        .then(data => {setQuizz(data)})

    }, [])

    return (
        <div className='hostdashboard'>
            <div className='header'>
                <div className='title'>Host Dashboard</div>
                <div className='subtitle'>Select a quiz to lead the game and guide your players on an exciting challenge!</div>
            </div>
            <div className='container'>
                {
                    quizz && quizz.map(card => (
                        <div onClick={() => navigate('/host?uuid='+card.quizz_id)} className='card'>
                            <div className='title'>{card.quizz_title}</div>
                            <div className='subtitle'>{card.quizz_description}</div>
                        </div>
                    ))
                }

            </div>
        </div>
    )
}

export default HostDashboard