import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { auth } from "../../firebase";
import "./ActivityLog.css"

const ActivityLog = ({ loggedActions }) => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalLogs, setTotalLogs] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchLogs = async () => {
            const db = getDatabase();
            const dbRef = ref(db, 'logs');

            // Check if the 'logs' folder exists
            const snapshot = await get(dbRef);

            if (!snapshot.exists()) {
                // If 'logs' folder does not exist, create it
                await set(dbRef, {});
            }

            // Fetch the logs
            const logEntries = [];
            snapshot.forEach((childSnapshot) => {
                logEntries.push(childSnapshot.val());
            });

            logEntries.sort((a, b) => new Date(b.time) - new Date(a.time));

            setTotalLogs(logEntries.length); // Set total logs count
            setLogs(logEntries);
        };

        fetchLogs();

        // Cleanup function
        return () => {
            // Perform any necessary cleanup here
        };
    }, []);

    const indexOfLastLog = currentPage * itemsPerPage;
    const indexOfFirstLog = indexOfLastLog - itemsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="main activity_logs">
          <div className="activity-log__list-container">
            <h1 className="activity-logs__title">Activity Logs</h1>
            
                <table className="activity-log__table">
                    <thead className="activity-log__table-header">
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody className="activity-log__table-body">
                        {/* Render the current page of logs */}
                        {currentLogs.map((log, index) => (
                            <tr key={index}>
                                <td>{new Date(log.time).toLocaleDateString()}</td>
                                <td>{new Date(log.time).toLocaleTimeString()}</td>
                                <td>{log.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
                <div className="pagination">
                    <button className="prev" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                        Previous
                    </button>
                    <span className="page">Page {currentPage} of {Math.ceil(totalLogs / itemsPerPage)}</span>
                    <button className="next" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === Math.ceil(totalLogs / itemsPerPage)}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;
