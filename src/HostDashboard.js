import './style.css'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'


const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };
  

const HostDashboard = () => {

    const [quizz, setQuizz] = useState([])
    const navigate = useNavigate()
    const user_id = get_cookie('user_id')

    useEffect(() => {

        fetch('https://api.playquartz.com/request/get_quizz/all')
            .then(response => response.json())
            .then(data => { setQuizz(data) })

    }, [])

    return (
        <div className='hostdashboard'>
            <div className='header'>
                <div onClick={() => navigate('/dashboard')} className='logo'>Rank Rumble</div>
                <div className='logout'>Log Out</div>
            </div>
            <div className='container'>
                {
                    quizz && quizz.map(card => (
                        <div onClick={() => {
                            if(card.created_by !== user_id){
                                navigate('/host?uuid=' + card.quizz_id)
                            }
                        }} className='card'>
                            {
                                card.created_by !== user_id && (
                                    <div className='locked'>
                                    <div className='lock'>
                                        <svg width="35" height="35" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <defs>
                                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" style={{ stopColor: '#1e90ff', stopOpacity: 1 }} />
                                                    <stop offset="100%" style={{ stopColor: '#6a0dad', stopOpacity: 1 }} />
                                                </linearGradient>
                                            </defs>
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                </div>
                                )
                            }
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