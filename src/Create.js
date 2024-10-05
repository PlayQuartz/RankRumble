import './style.css'
import React, { useState, useEffect, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom';

const CreateContext = createContext()

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const CreateDashboard = () => {

    const { userQuizz, setDisplay, navigate } = useContext(CreateContext)

    return (
        <div className='create_dashboard'>
            <div className='header'>
                <div onClick={() => navigate('/dashboard')} className='logo'>Rank Rumble</div>
                <div className='logout'>Log Out</div>
            </div>
            <div className='container'>

                {
                    userQuizz && userQuizz.map((quizz, index) => (
                        <div key={index} onClick={() => setDisplay(<EditQuizz quizz_id={quizz.quizz_id} />)} className='card'>
                            <div className='title'>{quizz.quizz_title}</div>
                            <div className='description'>{quizz.quizz_description}</div>
                        </div>
                    ))
                }


            </div>
            <div onClick={() => { setDisplay(<EditQuizz />) }} className='add_quizz'>
                <svg width="25" height="25" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="2" width="2" height="16" fill="white" />
                    <rect x="2" y="9" width="16" height="2" fill="white" />
                </svg>
            </div>
        </div>
    )
}

const EditQuizz = ({ quizz_id }) => {

    const [questions, setQuestions] = useState([])
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [deleteConfirmation, setDeleteConfirmation] = useState(false)
    const { token, setDisplay, setRefresh, refresh } = useContext(CreateContext)



    useEffect(() => {
        if (quizz_id) {

            fetch('https://api.playquartz.com/request/get_quizz/' + quizz_id)
                .then(response => response.json())
                .then(data => {
                    let question_data = []
                    if (data.quizz_questions) {
                        Object.keys(data.quizz_questions).forEach(question_id => {
                            console.log(question_id)
                            question_data.push({ question: data.quizz_questions[question_id], answers: data.quizz_answers[question_id] })
                        })
                    }

                    setQuestions(question_data)
                    setTitle(data.quizz_title)
                    setDescription(data.quizz_description)
                })

        }
        else {
            console.log('Create')
        }
    }, [quizz_id])

    const add_question = () => {
        setQuestions((prev) => [...prev, { question: '', answers: [] }])
        setCurrentQuestion(questions.length)
    }

    const add_answer = () => {
        setQuestions((prev) => {
            let updatedQuestions = [...prev]
            updatedQuestions[currentQuestion] = {
                ...updatedQuestions[currentQuestion], answers: [...updatedQuestions[currentQuestion].answers, '']
            }
            return updatedQuestions
        })
    }

    const delete_quizz = () => {

        if (quizz_id) {
            fetch('https://api.playquartz.com/request/delete_quizz/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, quizz_id })
            })
                .then(response => response.json())
                .then(data => {
                    setRefresh(!refresh)
                    setDisplay(<CreateDashboard />)
                })
        }

    }

    const push_quizz = () => {

        setLoading(true)
        let questions_json = {}
        let answers_json = {}

        questions.forEach((question, index) => {
            questions_json[index + 1] = question.question
            answers_json[index + 1] = question.answers
        })

        if (quizz_id) {
            fetch('https://api.playquartz.com/request/edit_quizz/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description, questions: questions_json, answers: answers_json, token, quizz_id })
            })
                .then(response => response.json())
                .then(data => {
                    setLoading(false)
                    setRefresh(!refresh)
                    setDisplay(<CreateDashboard />)
                })
        }
        else {
            fetch('https://api.playquartz.com/request/add_quizz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description, questions: questions_json, answers: answers_json, token })
            })
                .then(response => response.json())
                .then(data => {
                    setLoading(false)
                    setRefresh(!refresh)
                    setDisplay(<CreateDashboard />)
                })
        }
    }

    return (
        <div className='create'>

            {
                deleteConfirmation && (            
                    <div className='delete_confirmation'>
                        <div className='del_container'>
                            <div>Are you sure you want to delete this quiz?</div>
                            <div className='action'>
                                <div onClick={delete_quizz} className='confirm'>Delete</div>
                                <div onClick={() => setDeleteConfirmation(false)} className='cancel'>Cancel</div>
                            </div>
                        </div>
                    </div>
                )
            }



            <div onClick={() => setDisplay(<CreateDashboard />)} className='close'>
                <svg width="35" height="35" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#1e90ff', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#6a0dad', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <line x1="2" y1="2" x2="18" y2="18" stroke="url(#gradient1)" strokeWidth="2" />
                    <line x1="18" y1="2" x2="2" y2="18" stroke="url(#gradient1)" strokeWidth="2" />
                </svg>
            </div>
            <div className='create_dashboard'>
                <div className='titles'>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className='title' placeholder='Title' />
                    <input value={description} onChange={(e) => setDescription(e.target.value)} className='description' placeholder='Description' />
                </div>
                <div className='question_container'>
                    {
                        questions && questions.map((_, index) => (
                            <div onClick={() => setCurrentQuestion(index)} style={{ border: currentQuestion === index ? '1px solid grey' : 'none' }} className='question' key={index}>{index + 1}
                                {
                                    currentQuestion === index && (
                                        <div onClick={(e) => {
                                            e.stopPropagation(); // Prevent triggering the parent onClick (setCurrentQuestion)
                                            setQuestions((prevQuestions) => {
                                                const updatedQuestions = [...prevQuestions];

                                                // Remove the question at the specific index
                                                updatedQuestions.splice(index, 1);

                                                return updatedQuestions;
                                            });

                                            if (questions.length > 1) {
                                                setCurrentQuestion(0);
                                            } else {
                                                setCurrentQuestion(null)
                                            }
                                        }} className='bin'>
                                            <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
                                                <path d="M3 6h18v2H3V6zm3 2v12a2 2 0 002 2h8a2 2 0 002-2V8H6zm3-4V3a1 1 0 011-1h4a1 1 0 011 1v1h5v2H4V4h5zm3 4h2v10h-2V8z" />
                                            </svg>
                                        </div>
                                    )
                                }
                            </div>
                        ))
                    }


                        <div onClick={add_question} className='add_button'>
                            <svg width="15" height="15" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <rect x="9" y="2" width="2" height="16" fill="white" />
                                <rect x="2" y="9" width="16" height="2" fill="white" />
                            </svg>
                        </div>


                </div>

                <div className='question_dashboard'>

                    {
                        questions && currentQuestion !== null && (
                            <>
                                <input onChange={(e) => {
                                    setQuestions((prev) => {
                                        let updatedQuestions = [...prev]
                                        updatedQuestions[currentQuestion] = { ...updatedQuestions[currentQuestion], question: e.target.value };
                                        return updatedQuestions
                                    })
                                }} value={questions[currentQuestion].question} className='question' placeholder='Question' />
                                <div className='answers'>

                                    {
                                        questions[currentQuestion].answers && questions[currentQuestion].answers.map((row, index) => (
                                            <div className='row' key={index}>
                                                <div className='border_rank'>
                                                    <div className='black_background'>
                                                        <div className='rank'>{index + 1}</div>
                                                    </div>
                                                </div>

                                                <div className='border_rank'>
                                                    <div className='black_background'>
                                                        <input onChange={(e) => {
                                                            setQuestions((prevQuestions) => {
                                                                const updatedQuestions = [...prevQuestions];
                                                                const updatedQuestion = { ...updatedQuestions[currentQuestion] };
                                                                const updatedAnswers = [...updatedQuestion.answers];
                                                                updatedAnswers[index] = e.target.value;
                                                                updatedQuestion.answers = updatedAnswers;
                                                                updatedQuestions[currentQuestion] = updatedQuestion;
                                                                return updatedQuestions;
                                                            });
                                                        }} value={row} className='record' placeholder='Record' />
                                                    </div>
                                                </div>

                                                <div className='remove' onClick={() => {
                                                    setQuestions((prevQuestions) => {
                                                        const updatedQuestions = [...prevQuestions];
                                                        const updatedQuestion = { ...updatedQuestions[currentQuestion] };
                                                        const updatedAnswers = [...updatedQuestion.answers];

                                                        updatedAnswers.splice(index, 1);
                                                        updatedQuestion.answers = updatedAnswers;

                                                        updatedQuestions[currentQuestion] = updatedQuestion;
                                                        return updatedQuestions;
                                                    });
                                                }} >
                                                    <svg width="15" height="15" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                        <defs>
                                                            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" style={{ stopColor: '#1e90ff', stopOpacity: 1 }} />
                                                                <stop offset="100%" style={{ stopColor: '#6a0dad', stopOpacity: 1 }} />
                                                            </linearGradient>
                                                        </defs>
                                                        <line x1="2" y1="2" x2="18" y2="18" stroke="url(#gradient1)" strokeWidth="2" />
                                                        <line x1="18" y1="2" x2="2" y2="18" stroke="url(#gradient1)" strokeWidth="2" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    <div onClick={add_answer} className='add_question'>Add Answer</div>


                                </div>
                            </>
                        )
                    }


                </div>
                <div className='actions'>
                    <div onClick={push_quizz} className='save'>{loading ? <div className='loading_spinner'></div> : 'Save'}</div>
                    <div  onClick={() => setDeleteConfirmation(true)}  className='delete'>
                                <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
                                    <path d="M3 6h18v2H3V6zm3 2v12a2 2 0 002 2h8a2 2 0 002-2V8H6zm3-4V3a1 1 0 011-1h4a1 1 0 011 1v1h5v2H4V4h5zm3 4h2v10h-2V8z" />
                                </svg>
                            </div>
                    </div>
            </div>
        </div>
    )

}

const Create = () => {

    const [display, setDisplay] = useState(<CreateDashboard />)
    const [refresh, setRefresh] = useState(false)
    const [userQuizz, setUserQuizz] = useState(null)

    const token = get_cookie('auth_token')
    const user_id = get_cookie('user_id')

    const navigate = useNavigate()

    useEffect(() => {
        fetch('https://api.playquartz.com/request/get_quizz/all')
            .then(response => response.json())
            .then(data => {
                let user_quizz = []
                data.forEach(quizz => {
                    if (quizz.created_by === user_id) {
                        user_quizz.push(quizz)
                    }
                })
                setUserQuizz(user_quizz)
            })
    }, [user_id, refresh])



    return (
        <CreateContext.Provider value={{ userQuizz, token, user_id, setDisplay, navigate, setRefresh, refresh }}>
            {display}
        </CreateContext.Provider>
    )
}

export default Create