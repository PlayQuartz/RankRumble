import './style.css'
import React, {useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

const Dashboard = () => {

    const navigate = useNavigate()
    const token = get_cookie('auth_token')

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
        })
        .catch(error => {
            console.log(error)
            navigate('/')
        })
    }, [token, navigate]);

    return(
        <div className='dashboard'>
            <div className='header'>
                <div className='logo'>Rank Rumble</div>
                <div className='logout'>Log Out</div>
            </div>
            <div className='container'>
                <div onClick={() => navigate('/play')} className='card play'>
                    <div className='title'>PLAY</div>
                    <div className='subtitle'>Dive into the excitement and test your knowledge</div>
                </div>
                <div onClick={() => navigate('/hostdashboard')}  className='card'>
                    <div className='title'>HOST</div>
                    <div className='subtitle'>Lead the fun and challenge your friends</div>
                </div>
                <div onClick={() => navigate('/create')}  className='card'>
                    <div className='title'>CREATE</div>
                    <div className='subtitle'>Design custom quizzes with your unique questions</div>
                </div>

            </div>
        </div>
    )
}

export default Dashboard