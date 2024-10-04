import './style.css'
import React, {useState} from 'react'

const Login = () => {

    const [password, setPassword] = useState(null)
    const [email, setEmail] = useState(null)

    const submit_login = () => {

        fetch('https://api.playquartz.com/request/login/', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            document.cookie = `auth_token=${data.token}; path=/;`
            document.cookie = `user_id=${data.user_id}; path=/;`
        })

    }

    return (
        <div className='login'>
            <div className='container'>
                <div className='title'>Login</div>
                <input onChange={(e) => setEmail(e.target.value)} placeholder='Email'/>
                <div>
                    <input onChange={(e) => setPassword(e.target.value)} type='password' placeholder='Password'/>
                </div>
                <button onClick={submit_login} className='validate_login'>Validate</button>
            </div>
        </div>
    )
}

export default Login