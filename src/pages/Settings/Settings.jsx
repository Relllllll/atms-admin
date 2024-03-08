import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import {
    getDatabase,
    ref,
    onValue,
    query,
    orderByChild,
} from "firebase/database";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import "./Settings.css";

const Settings = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [logs, setLogs] = useState([]);
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        const database = getDatabase();
        const employeesRef = ref(database, "employees");

        const employeesQuery = query(employeesRef, orderByChild("lastName"));

        const unsubscribe = onValue(
            employeesQuery,
            (snapshot) => {
                const employeesData = snapshot.val();

                if (employeesData) {
                    const newLogs = [];

                    // Loop through each employee
                    for (const employeeId in employeesData) {
                        const employee = employeesData[employeeId];
                        const { firstName, lastName, attendance } = employee;

                        // Loop through attendance entries
                        for (const date in attendance) {
                            const entry = attendance[date];
                            const { status, timeIn, timeOut } = entry;

                            // Create log entry
                            const logEntry = {
                                userId: employeeId,
                                userName: `${firstName} ${lastName}`,
                                date: new Date(date).toLocaleDateString(),
                                timeIn: timeIn
                                    ? new Date(timeIn).toLocaleTimeString()
                                    : "-----",
                                timeOut: timeOut
                                    ? new Date(timeOut).toLocaleTimeString()
                                    : "-----",
                                status,
                            };

                            newLogs.push(logEntry);
                        }
                    }

                    // Sort logs by date and time in descending order
                    newLogs.sort(
                        (a, b) =>
                            new Date(b.date + " " + b.timeIn) -
                            new Date(a.date + " " + a.timeIn)
                    );

                    setLogs(newLogs);
                }
            },
            { onlyOnce: true }
        );

        // Cleanup function to unsubscribe when the component unmounts
        return () => {
            unsubscribe();
        };
    }, []);

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

    const downloadCSV = () => {
        const csvContent =
            "data:text/csv;charset=utf-8," +
            ["No.", "Name", "Date", "Time In", "Time Out"].join(",") +
            "\n" +
            logs
                .map(
                    (log, index) =>
                        `${index + 1},"${log.userName}","${log.date}","${log.timeIn}","${log.timeOut}"`
                )
                .join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "logs.csv");
        document.body.appendChild(link);
        link.click();
    };

    const downloadJSON = () => {
        const filteredLogs = logs.map(({ userName, date, timeIn, timeOut }, index) => ({
            "No.": index + 1,
            Name: userName,
            Date: date,
            "Time In": timeIn,
            "Time Out": timeOut
        }));

        const jsonContent = JSON.stringify(filteredLogs, null, 2);

        const encodedUri = encodeURI("data:text/json;charset=utf-8," + jsonContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "logs.json");
        document.body.appendChild(link);
        link.click();
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
                <button className="settings__download-button" onClick={downloadCSV}>
                    Download CSV
                </button>
                <button className="settings__download-button" onClick={downloadJSON}>
                    Download JSON
                </button>
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
