import { useState } from "react";
import {
    getAuth,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from "firebase/auth";
import "./Settings.css";

const Settings = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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

            console.log("Password updated");
            setErrorMessage("");
        } catch (error) {
            console.error("Error updating password:", error.message);
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="settings main">
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
                {errorMessage && (
                    <p className="settings__error-message">{errorMessage}</p>
                )}
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
