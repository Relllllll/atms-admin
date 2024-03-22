import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Notification from "../../components/Notification/Notification";
import { getDatabase, push, ref } from "firebase/database";
import emailjs, { init } from 'emailjs-com';
import Popup from "reactjs-popup";
import "./Settings.css";

const Settings = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [storedCode, setStoredCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    const generateRandomNumber = () => {
        return Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit number
    };

    emailjs.init('lNtLLZrSkvme83IhK');
    const sendVerificationCode = async (email, code) => {
        try {
          const templateParams = {
            to_email: email,
            verification_code: code,
          };
          console.log(templateParams);
      
          await emailjs.send('service_tw8bu9h', 'template_elzpb9r', templateParams,);
          
          console.log('Verification code sent successfully!');
        } catch (error) {
          console.error('Error sending verification code:', error);
          throw new Error('Failed to send verification code');
        }
      };

    const handleChangePassword = async () => {
        const clickTime = new Date().toISOString();
        const database = getDatabase();
        const logsRef = ref(database, "logs");
        const logMessage = 'initiate change';
        push(logsRef, { action: logMessage, time: clickTime });
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(
                user.email,
                oldPassword
            );
            await reauthenticateWithCredential(user, credential);
            // Generate random 6-digit number and store it
            const newCode = generateRandomNumber();
            setStoredCode(newCode.toString());
            console.log(storedCode);
            // Send verification code via email
            await sendVerificationCode(user.email, newCode);
            // Open popup for code verification
            openPopup();
        } catch (error) {
            console.error("Error updating password:", error.message);
            setErrorMessage(error.message);
        }
    };

    const verifyCode = async () => {
        if (verificationCode === storedCode) {
            try {
                // Codes match, proceed to change password
                const auth = getAuth();
                const user = auth.currentUser;
                const credential = EmailAuthProvider.credential(
                    user.email,
                    oldPassword
                );
                await reauthenticateWithCredential(user, credential);
                
                // Update password
                await updatePassword(user, newPassword);
                
                // Password updated successfully
                setSuccessMessage("Password updated successfully.");
                setErrorMessage(""); // Clear any previous error messages
                setOldPassword("");
                setNewPassword("");
            } catch (error) {
                console.error("Error updating password:", error.message);
                setErrorMessage(error.message);
            }
        } else {
            setErrorMessage("Verification code does not match.");
        }
    };

    const popupRef = useRef(null);
    const openPopup = () => {
        setVerificationCode(""); // Clear verification code input
    popupRef.current.open(); // Open the popup using the ref
  };

    return (
        <div className="settings main">
            <Notification notification={errorMessage || successMessage} closePopup={() => {setErrorMessage(""); setSuccessMessage("");}} />
            <h1 className="settings__title">Change Password</h1>
            <div className="settings__inputs-container">
                <div className="settings__input-wrapper">
                    <label
                        className="settings__input-label"
                        htmlFor="oldPassword"
                    >
                        Old Password:{" "}
                    </label>
                    <input
                        className="settings__input-inputBox"
                        type="password"
                        id="oldPassword"
                        name="oldPassword"
                        placeholder="Enter old password..."
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="settings__input-wrapper">
                    <label
                        className="settings__input-label"
                        htmlFor="newPassword"
                    >
                        New Password:{" "}
                    </label>
                    <input
                        className="settings__input-inputBox"
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        placeholder="Enter new password..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    className="settings__change-password-button"
                    onClick={handleChangePassword}
                >
                    CHANGE PASSWORD
                </button>
            </div>

            {/* Popup for code verification */}
            <Popup ref={popupRef} modal>
                {close => (
                    <div>
                        <h2>Enter Verification Code</h2>
                        <input
                            type="text"
                            placeholder="Enter code..."
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                        />
                        <button onClick={() => { verifyCode(); close(); }}>Verify and Change Password</button>
                    </div>
                )}
            </Popup>
        </div>
    );
};

export default Settings;
