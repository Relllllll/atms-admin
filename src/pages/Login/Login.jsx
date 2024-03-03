import { useState } from "react";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import FadeLoader from "react-spinners/FadeLoader";
import { auth } from "../../firebase";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/employee-list");
        } catch (error) {
            console.error("Error logging in:", error);
            setErrorMessage("Invalid email or password!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <div className="login__background-image-container">
                <img
                    className="login__background-image"
                    src="barangaypic.jpg"
                />
            </div>
            <div className="login__forms">
                <div className="login__container">
                    <div className="login__title-wrapper">
                        <img className="login__logo" src="/logo.png" />
                        <h2 className="login__title">ADMIN LOGIN</h2>
                    </div>
                    <div className="login__forms-wrapper">
                        <p className="login__forms-prompt">
                            Login with your{" "}
                            <span className="title-primary">admin</span>{" "}
                            credentials.
                        </p>
                        <div className="login__forms-container">
                            <div className="login__form-input-wrapper">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="login__form-input-icon"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                                    />
                                </svg>

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="login__form-input-wrapper">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="login__form-input-icon"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                    />
                                </svg>

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </div>
                            {errorMessage && (
                                <div className="error-message">
                                    {errorMessage}
                                </div>
                            )}
                            <button
                                className="login__button"
                                onClick={handleLogin}
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {loading && (
                <div className="loading-overlay">
                    <FadeLoader color="#f7b137" height={20} />
                </div>
            )}
        </div>
    );
};

export default Login;
