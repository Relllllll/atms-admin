import "./Settings.css";

const Settings = () => {
    return (
        <div className="main">
            <h1 className="settings__title">Change Password</h1>
            <div className="settings__inputs-container">
                <div className="settings__input-wrapper">
                    <label
                        className="settings__input-label"
                        htmlFor="oldPassword"
                    >
                        Old Passwrd:{" "}
                    </label>
                    <input
                        className="settings__input-inputBox"
                        type="text"
                        id="oldPassword"
                        name="oldPasswrd"
                        placeholder="Old Password"
                        // value={formData.oldPassword}
                        // onChange={handleInputChange}
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
                        type="text"
                        id="newPassword"
                        name="newPassword"
                        placeholder="New Password"
                        // value={formData.middleName}
                        // onChange={handleInputChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default Settings;
