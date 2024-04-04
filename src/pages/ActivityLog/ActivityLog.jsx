import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { auth } from "../../firebase";
import "./ActivityLog.css";

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
            const dbRef = ref(db, "logs");

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

    const paginationRange = 5; // Number of pages to display in the pagination bar
    const totalPages = Math.ceil(totalLogs / itemsPerPage);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const startPage = Math.max(
            1,
            currentPage - Math.floor(paginationRange / 2)
        );
        const endPage = Math.min(totalPages, startPage + paginationRange - 1);

        if (startPage > 1) {
            pageNumbers.push(1); // Add the first page number
            if (startPage > 2) {
                pageNumbers.push("ellipsis"); // Add ellipsis if needed
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages - 1) {
            pageNumbers.push("ellipsis"); // Add ellipsis if needed
        }

        if (endPage < totalPages) {
            pageNumbers.push(totalPages); // Add the last page number
        }

        return pageNumbers;
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const indexOfLastLog = currentPage * itemsPerPage;
    const indexOfFirstLog = indexOfLastLog - itemsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);

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
                                <td>
                                    {new Date(log.time).toLocaleDateString()}
                                </td>
                                <td>
                                    {new Date(log.time).toLocaleTimeString()}
                                </td>
                                <td>{log.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
                <div className="pagination">
                    {/* Display page numbers */}
                    {getPageNumbers().map((pageNumber, index) => {
                        if (pageNumber === "ellipsis") {
                            return (
                                <span key={index} className="ellipsis">
                                    ...
                                </span>
                            );
                        }
                        return (
                            <button
                                key={index}
                                className={`page-number ${
                                    currentPage === pageNumber ? "active" : ""
                                }`}
                                onClick={() => handlePageChange(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;
