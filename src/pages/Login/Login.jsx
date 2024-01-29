import { useState } from "react";
import {
    getAuth,
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/employee-list");
        } catch (error) {
            console.error("Error logging in:", error);
        }
    };

    return (
        <div className="login">
            <div className="login__title-wrapper">
                <h4 className="login__title">Barangay Pinagbuhatan</h4>
                <h4 className="login__title">Attendance Management System</h4>
            </div>
            <div className="login__wrapper">
                <h2 className="login__lower-header">LOG IN.</h2>
                <p className="login__upper-text">
                    Log in with your
                    <span className="login__mustard-text"> admin </span>
                    credential
                </p>

                <div className="login__form-wrapper">
                    <div className="login__form-input-wrapper">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={handleLogin}>Login</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
