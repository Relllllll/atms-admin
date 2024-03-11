import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Notification from "../../components/Notification/Notification";
import "./Settings.css";

const Settings = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleChangePassword = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(
                user.email,
                oldPassword
            );
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);

            setSuccessMessage("Password updated successfully.");
            setErrorMessage("");
            setOldPassword("");
            setNewPassword("");
        } catch (error) {
            console.error("Error updating password:", error.message);
            setErrorMessage(error.message);
        }
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
        </div>
    );
};

export default Settings;
