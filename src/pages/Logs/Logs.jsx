import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

import {
    getDatabase,
    ref,
    onValue,
    query,
    orderByChild,
} from "firebase/database";
import { auth } from "../../firebase";
import "./Logs.css";

const Logs = () => {
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

    return (
        <div className="main logs">
            <hr className="logs__hr" />

            <div className="logs__list-container">
                <h1 className="logs__title">Logs</h1>

                <table className="logs__table">
                    <thead className="logs__table-header">
                        <tr>
                            <th>No. </th>
                            <th>Name </th>
                            <th>Date</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody className="logs__table-body">
                        {logs.map((logEntry, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{logEntry.userName}</td>
                                <td>{logEntry.date}</td>
                                <td>{logEntry.timeIn}</td>
                                <td>{logEntry.timeOut}</td>
                                <td>
                                    <span
                                        className={logEntry.status.toLowerCase()}
                                    >
                                        {logEntry.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Logs;
