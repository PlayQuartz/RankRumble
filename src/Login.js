import './style.css'
import { useNavigate } from 'react-router-dom'
import React, {useState, useEffect} from 'react'

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

const Login = () => {

    const [password, setPassword] = useState(null)
    const [email, setEmail] = useState(null)
    const [invalidPassword, setInvalidPassword] = useState(false)
    const [invalidEmail, setInvalidEmail] = useState(false)
    const token = get_cookie('auth_token')
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
            if(data.valid){
                navigate('/dashboard')
            }
        })
        .catch(error => {
            console.log(error)
        })

    }, [token, navigate]);

    const submit_login = () => {

        setInvalidEmail(false)
        setInvalidPassword(false)
        
        fetch('https://api.playquartz.com/request/login/', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {

            if(data.message){
                if(data.message === 'invalid_email'){
                    setInvalidEmail(true)
                }
                else if(data.message === 'invalid_password'){
                    setInvalidPassword(true)
                }
            }

            document.cookie = `auth_token=${data.token}; path=/;`
            document.cookie = `user_id=${data.user_id}; path=/;`
            if(data.token){
                navigate('/dashboard')
            }
        })

    }

    useEffect(() => {
        const handleKeyUp = (event) => {
            if (event.code === 'Enter') {
                submit_login();
            }
        };
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className='login'>
            <div className='container'>
                <div className='title'>Login</div>
                <div style={{display: invalidEmail ? 'block' : 'none'}} className='invalid_email'>* Invalid Email</div>
                <div className='border'>
                    <input onChange={(e) => setEmail(e.target.value)} placeholder='Email'/>
                </div>
                <div style={{display: invalidPassword ? 'block' : 'none'}} className='invalid_email'>* Invalid Password</div>
                <div className='border'>
                    <input onChange={(e) => setPassword(e.target.value)} type='password' placeholder='Password'/>
                </div>
                <button onClick={submit_login} className='validate_login'>Validate</button>
            </div>
        </div>
    )
}

export default Login