import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import loginImage from '../../assets/images/login-image.jpg';
import logo from '../../assets/images/ubl-logo.png';
import { type UserRole } from '../../types/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const navigate = useNavigate();
    const users: { email: string; password: string; role: UserRole }[] = [
        { email: "ovais.saeed@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "asma.shahbaz@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "suleman.pervez@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "zia.akhtar@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "muh.rizwan@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "saqib.saghir@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "ahsan.adil@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "masood.khan@ubl.com.pk", password: "United@123", role: "standard" },
        { email: "admin@bca.com", password: "admin1234", role: "standard" },
        { email: "superadmin@bca.com", password: "admin1234", role: "superAdmin" },
    ];

    const validateField = (name: 'email' | 'password', value: string) => {
        let error = '';
        switch (name) {
            case 'email':
                if (!value) {
                    error = 'Email address is required.';
                } else if (!/\S+@\S+\.\S+/.test(value)) {
                    error = 'Please enter a valid email address.';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required.';
                }
                break;
            default:
                break;
        }
        setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
        return !error;
    };

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isEmailValid = validateField('email', email);
        const isPasswordValid = validateField('password', password);

        if (isEmailValid && isPasswordValid) {

            const user = users.find(
                (u) => u.email === email && u.password === password
            );


            if (user) {
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userRole', user.role);
                toast.success('Login successful!', {
                    position: 'top-center',
                    autoClose: 1500,
                });

                setTimeout(() => {
                    if (user.role === 'superAdmin') {
                        navigate('/upload');
                    } else {
                        navigate('/home');
                    }
                }, 2000);
            } else {
                toast.error('Invalid email or password.', {
                    position: 'top-center',
                    autoClose: 3000,
                });
            }
        }
    };

    return (
        <div
            className="vh-100 d-flex align-items-center justify-content-center position-relative"
            style={{
                backgroundImage: `url(${loginImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 z-1"></div>

            <div className="position-relative z-2 w-100 p-3" style={{ maxWidth: '420px' }}>
                <div
                    className="card border-0 shadow-lg p-4 p-sm-5 rounded-3"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(5px)',
                    }}
                >
                    <div className="text-center mb-4">
                        <img src={logo} alt="Company Logo" style={{ maxWidth: '150px' }} className="h-auto" />
                    </div>
                    <h2 className="text-center fw-bold mb-2">Welcome Back</h2>
                    <p className="text-center text-muted mb-4">Please enter your credentials to log in.</p>

                    <form onSubmit={handleLogin} noValidate>
                        <div className="mb-3">
                            <div className="position-relative">
                                <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary" />
                                <input
                                    type="email"
                                    className={`form-control ps-5 py-2 ${errors.email ? 'is-invalid' : ''}`}
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) validateField('email', e.target.value);
                                    }}
                                    onBlur={() => validateField('email', email)}
                                    required
                                />
                            </div>
                            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                        </div>

                        <div className="mb-4">
                            <div className="position-relative">
                                <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary" />
                                <input
                                    type="password"
                                    className={`form-control ps-5 py-2 ${errors.password ? 'is-invalid' : ''}`}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) validateField('password', e.target.value);
                                    }}
                                    onBlur={() => validateField('password', password)}
                                    required
                                />
                            </div>
                            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100 fw-bold py-2"
                            disabled={!email || !password}
                        >
                            LOG IN
                        </button>
                    </form>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Login;
