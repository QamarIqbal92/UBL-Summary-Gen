import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate here
import UserProfile from './../UserProfile/userprofile';
import { IoMenu, IoClose } from 'react-icons/io5';
import './navbar.scss';
import logo from '../../assets/images/ubl-logo.png';

const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toHome = () => {
        navigate('/home');
    };

    const handleLogout = () => {
        console.log("User logged out.");
        setIsOpen(false);
        navigate('/login');
    };


    return (
        <nav className='border-bottom border-secondary'>
            <div className="navbar-left">
                <img src={logo} alt="UBL Logo" className="logo" onClick={toHome} /> Compliance Chatbot
            </div>

            <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
            </div>

            <div className={`nav-items ${isOpen ? 'open' : ''}`}>
                <UserProfile onLogout={handleLogout} />

                <button className="mobile-logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default NavBar;