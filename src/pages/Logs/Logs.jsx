import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker styles
import {
    getDatabase,
    ref,
    onValue,
    query,
    orderByChild,
    push,
} from "firebase/database";
import { auth } from "../../firebase";
import "./Logs.css";

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [user] = useAuthState(auth);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalLogs, setTotalLogs] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState("");

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

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
                    let newLogs = [];
                    let total = 0; // Track total logs for pagination

                    // Loop through each employee
                    for (const employeeId in employeesData) {
                        const employee = employeesData[employeeId];
                        const { firstName, lastName, attendance } = employee;

                        // Loop through attendance entries
                        for (const date in attendance) {
                            const entry = attendance[date];
                            const { status, timeIn, timeOut } = entry;

                            // Create log entry and filter by status if applicable
                            if (!selectedStatus || status === selectedStatus) {
                                const logEntry = {
                                    userId: employeeId,
                                    idNumber: `${employee.idNumber}`,
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
                                newLogs.push(logEntry); // Push log entry to the array
                                total++; // Increment total count
                            }
                        }
                    }

                    // Apply additional filtering by date range
                    newLogs = newLogs.filter(
                        (log) =>
                            (startDate &&
                                endDate &&
                                new Date(log.date) >= startDate &&
                                new Date(log.date) <= endDate) ||
                            (!startDate && !endDate)
                    );

                    // Sort logs by date (latest on top)
                    newLogs.sort((a, b) => {
                        if (a.date === b.date) {
                            return (
                                new Date(`${b.date} ${b.timeIn}`).getTime() -
                                new Date(`${a.date} ${a.timeIn}`).getTime()
                            );
                        }
                        return (
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        );
                    });

                    // Apply pagination
                    const offset = (currentPage - 1) * itemsPerPage;
                    const paginatedLogs = newLogs.slice(
                        offset,
                        offset + itemsPerPage
                    );

                    setTotalLogs(total); // Update total log count after all filtering
                    setLogs(paginatedLogs); // Set displayed logs for current page
                }
            },
            { onlyOnce: false } // Set to `false` for continuous updates
        );

        // Cleanup function to unsubscribe when the component unmounts
        return () => unsubscribe();
    }, [startDate, endDate, selectedStatus, currentPage, itemsPerPage]);

    useEffect(() => {
        if (startDate && !endDate) {
            setEndDate(startDate);
        }
    }, [startDate, endDate]);

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

    const handleDownloadLogs = () => {
        const clickTime = new Date().toISOString();
        const database = getDatabase();
        const logsRef = ref(database, "logs");
        const logMessage = "download logs";
        push(logsRef, { action: logMessage, time: clickTime });
        // Get the current date
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Create a new PDF document
        const doc = new jsPDF();

        // Set the title of the document
        doc.setFontSize(18);
        doc.text("Logs", 105, 10, { align: "center" });

        // Define table headers
        const headers = [
            "Id Number",
            "Name",
            "Date",
            "Time In",
            "Time Out",
            "Status",
        ];

        // Define table data
        const data = logs.map((logEntry) => [
            logEntry.idNumber,
            logEntry.userName,
            logEntry.date,
            logEntry.timeIn,
            logEntry.timeOut,
            logEntry.status,
        ]);

        // Set the position of the table
        const startY = 20; // Adjust as needed
        const startX = 10; // Adjust as needed

        // Add the table to the PDF
        doc.autoTable({
            startY,
            head: [headers],
            body: data,
            startX,
            theme: "grid",
            styles: { fontSize: 12 },
            columnStyles: { 0: { cellWidth: 20 } }, // Adjust column width if necessary
        });

        // Save the PDF with the current date in the file name
        doc.save(`logs_${formattedDate}.pdf`);
    };
    const handleStatusFilterChange = (event) => {
        setSelectedStatus(event.target.value);
    };

    return (
        <div className="main logs">
            <hr className="logs__hr" />

            <div className="logs__list-container">
                <h1 className="logs__title">Logs</h1>
                <div className="logs__date-picker">
                    <h3>Date Filter</h3>
                    {/* Date range picker */}
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        dateFormat="MM/dd/yyyy"
                        className="startDate"
                    />
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        dateFormat="MM/dd/yyyy"
                        className="endDate"
                    />
                    {/* Status filter */}
                    <h3>Status Filter</h3>
                    <select
                        className="status-dropdown"
                        value={selectedStatus}
                        onChange={handleStatusFilterChange}
                    >
                        <option value="">All Statuses</option>
                        {/* Add options for available statuses based on your data */}
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Undertime">Undertime</option>
                        <option value="Overtime">Overtime</option>
                        {/* Add more options as needed */}
                    </select>
                </div>

                <table className="logs__table">
                    <thead className="logs__table-header">
                        <tr>
                            <th>No. </th>
                            <th>ID Number</th>
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
                                <td>{logEntry.idNumber}</td>
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
                <nav className="pagination">
                    {/* Display page numbers */}
                    {Array.from(getPageNumbers()).map((pageNumber, index) => {
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

                    {/* Display the last page number
                    <button
                        className={`page-number ${
                            currentPage === totalPages ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(totalPages)}
                    >
                        {totalPages}
                    </button> */}
                </nav>
            </div>
            <button className="download-button" onClick={handleDownloadLogs}>
                Download Logs
            </button>
        </div>
    );
};

export default Logs;
