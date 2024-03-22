import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getDatabase, ref, onValue, update, push, set, get } from "firebase/database";
import jsPDF from "jspdf"
import "jspdf-autotable";
import "./EmployeeDetails.css";

const EmployeeDetails = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [statusToday, setStatusToday] = useState(null);
    const [userId, setUserId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [addMode, setAddMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState(""); // State to store the selected date
    const [timeIn, setTimeIn] = useState("");
    const [timeOut, setTimeOut] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const recognizedUserId =
            location.pathname.split("/employee-details/")[1];

        if (recognizedUserId) {
            setUserId(recognizedUserId);
            fetchEmployeeData(recognizedUserId);
        }
    }, [location.pathname]);


    const fetchEmployeeData = (userId) => {
        try {
            const database = getDatabase();
            const employeesRef = ref(database, `employees/${userId}`);
            const attendanceLogsRef = ref(
                database,
                `employees/${userId}/attendance`
            );

            // Fetch employee data
            onValue(employeesRef, (snapshot) => {
                const employeeData = snapshot.val();
                setEmployeeData(employeeData);
            });

            // Fetch attendance logs
            onValue(attendanceLogsRef, (snapshot) => {
                const logsData = snapshot.val();
                if (logsData) {
                    const logsArray = Object.entries(logsData).map(
                        ([date, log]) => ({ date, ...log })
                    );
                    setAttendanceLogs(logsArray);
                    setStatusToday(getStatusForToday(logsArray));
                }
            });
        } catch (error) {
            console.error("Error fetching employee data: ", error);
        }
    };

    const getStatusForToday = (logsArray) => {
        // Sort logsArray by date in descending order
        logsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
    
        // Get the most recent log entry
        const mostRecentLog = logsArray[0];
    
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];
    
        // Check if the most recent log entry date is today
        if (mostRecentLog.date === today) {
            return mostRecentLog.status;
        } else {
            return "-----";
        }
    };

    // Function to calculate total hours and days
    const calculateTotalStats = () => {
        let totalMilliseconds = 0;
        let totalDays = 0;
    
        attendanceLogs.forEach((log) => {
            if (log.timeIn && log.timeOut) {
                const timeIn = new Date(log.timeIn);
                const timeOut = new Date(log.timeOut);
                const millisecondsWorked = timeOut - timeIn;
                totalMilliseconds += millisecondsWorked;
    
                totalDays++;
            }
        });
    
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const totalHours = totalSeconds / 3600;
    
        const hours = Math.floor(totalHours);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
    
        // Calculate remaining decimal part after subtracting whole hours
        const remainingDecimalHours = totalHours - hours;
        const decimalMinutes = Math.floor((remainingDecimalHours * 60) % 60);
        const decimalSeconds = Math.floor((remainingDecimalHours * 3600) % 60);
    
        const formattedTotalTime = `${hours}:${minutes}:${seconds}`;
        
    
        return {
            totalHours: totalHours.toFixed(2),
            totalDays,
            hours,
            minutes,
            seconds,
            formattedTotalTime: `${formattedTotalTime}.${decimalMinutes}${decimalSeconds}`, 

        };
    };
    
    const { formattedTotalTime, totalDays } = calculateTotalStats();
    const formattedTotalTimeWithoutDecimal = formattedTotalTime.split('.')[0];

    // Function to format the date
    const formatDate = (dateString) => {
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const formattedDate = new Date(dateString).toLocaleDateString(
            undefined,
            options
        );
        return formattedDate;
    };

    const handleUpdateEmployee = () => {
        const database = getDatabase();
        const employeeRef = ref(database, `employees/${userId}`);
        update(employeeRef, {
            firstName: employeeData.firstName,
            middleName: employeeData.middleName,
            lastName: employeeData.lastName,
            contactNum: employeeData.contactNum,
            address: employeeData.address,
            age: employeeData.age,
        });

        setEditMode(false);
    };

    const handleAddAttendance = async () => {
        if (!selectedDate || !timeIn) {
            // If required fields are missing, return
            return;
        }
    
        try {
            const database = getDatabase();
            const attendanceRef = ref(database, `employees/${userId}/attendance/${selectedDate}`);
    
            // Push new attendance data without appending the selectedDate
            await set(attendanceRef, {
                
                    status: "Present",
                    timeIn: selectedDate + 'T' + timeIn,
                    timeOut: selectedDate + 'T' + timeOut
                
            });
    
            setAddMode(false);
        } catch (error) {
            console.error("Error adding attendance:", error);
            // Handle error if needed
        }
    };
    const handleEmployeeEditClick = (employeeName) => {
        const clickTime = new Date().toISOString();
        const database = getDatabase();
        const logsRef = ref(database, "logs");
        const logMessage = `Employee ${employeeName} edit employee details`;
        push(logsRef, { action: logMessage, time: clickTime });
        setEditMode(true);
    };
    const handleAddClick = (employeeName) => {
        const clickTime = new Date().toISOString();
        const database = getDatabase();
        const logsRef = ref(database, "logs");
        const logMessage = `Employee ${employeeName}, admin add manual time`;
        push(logsRef, { action: logMessage, time: clickTime });
        setAddMode(true);
    };
    const handleDownloadPersonalLog = () => {
        // Create a new jsPDF instance
        const doc = new jsPDF();
        // Set the font size (adjust as needed)
        doc.setFontSize(12); // You might need to adjust this based on content length
      
        // Add employee name to the PDF
        doc.text(`Employee Name: ${employeeData.firstName} ${employeeData.middleName || ""} ${employeeData.lastName}`, 10, 10 );
      
        // Generate table data
        const tableData = attendanceLogs.map((log, index) => {
          return [index + 1, ...[
            formatDate(log.date),
            log.status,
            log.timeIn ? new Date(log.timeIn).toLocaleTimeString() : "-----",
            log.timeOut ? new Date(log.timeOut).toLocaleTimeString() : "-----",
          ]];
        });
        const tableWidth = 100;
        const header = ['','Date','Status','Time in','Time Out'];
        doc.autoTable({
            head : [header],
            body: tableData,
            theme: "grid",
            styles: {fontSize: 12},
            columnStyles: {0: {columnWidth : 10}}
        })
    //     const mainHeader = ['Day','','AM','','PM','','Undertime',]; 
        
    //     const subHeaders = ['','Arrival', 'Departure', 'Arrival', 'Departure', ' Arrival', ' Departure'];
        
    //     const combinedHeaders = [
    //     mainHeader,subHeaders
    //     ];
    // const tableWidth = 50;
        
    //     doc.autoTable({
        
    //       head: combinedHeaders,
    //       body: tableData,
    //       theme: "grid", // Optional table theme
    //       styles: { fontSize: 2.5 }, // Adjust font size as needed
    //       columnStyles: {
    //         0: { columnWidth: 5 }, // Adjust width for Day column
    //         1: { columnWidth: tableWidth / 6 }, // Distribute remaining width equally
    //         2: { columnWidth: tableWidth / 6 },
    //         3: { columnWidth: tableWidth / 6 },
    //         4: { columnWidth: tableWidth / 6 },
    //         5: { columnWidth: tableWidth / 6 },
    //         6: { columnWidth: tableWidth / 6 },
            
    //       },
    //       // Add manual line breaks for subheaders (optional)
          
    //     });
      
        // Trigger the download of the PDF
        doc.save(`${employeeData.firstName} ${employeeData.middleName || ""} ${employeeData.lastName}.pdf`);
      };
      const totalLogs = attendanceLogs.length;
      const indexOfLastLog = currentPage * itemsPerPage;
      const indexOfFirstLog = indexOfLastLog - itemsPerPage;
      const currentLogs = attendanceLogs.slice(indexOfFirstLog, indexOfLastLog);

    return (
        <div className="main">
            <div className="employeeDetails__top">
                <Link to="/employee-list" className="employeeDetails__link">
                    Employee
                </Link>{" "}
                &gt;{" "}
                <span className="employeeDetails__active">
                    Employee Details
                </span>
            </div>
            <div className="employeeDetails__title-wrapper">
                <h1 className="employeeDetails__title">Employee Details</h1>
                <button className="download-personal-log" onClick={handleDownloadPersonalLog}>Download Personal Log</button>
                {!editMode && (
                    <button
                        className="employeeDetails__title-edit"
                        onClick={() => handleEmployeeEditClick(`${employeeData.firstName} ${employeeData.middleName} ${employeeData.lastName}`)}
                    >
                        Edit
                    </button>
                )}
                {editMode && (
                    <button
                        className="employeeDetails__title-edit"
                        onClick={handleUpdateEmployee}
                    >
                        Update
                    </button>
                )}
                
            </div>
            {employeeData && (
                <div className="employee__details-parent">
                    <div className="employeeDetails__data">
                        <img
                            className="employeeDetails__image"
                            src={employeeData.image}
                            alt="Employee"
                        />
                        <div className="employeeDetails__details-container">
                            <div className="employeeDetails__detail-wrapper">
                                <p className="employeeDetails__detail-title">
                                    {" "}
                                    Name
                                </p>
                                {!editMode ? (
                                    <p className="employeeDetails__detail">{`${
                                        employeeData.firstName
                                    } ${employeeData.middleName || ""} ${
                                        employeeData.lastName
                                    }`}</p>
                                ) : (
                                    <input
                                        type="text"
                                        className="employeeDetails__input"
                                        value={employeeData.firstName}
                                        onChange={(e) =>
                                            setEmployeeData({
                                                ...employeeData,
                                                firstName: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                            <div className="employeeDetails__detail-wrapper">
                                <p className="employeeDetails__detail-title">
                                    {" "}
                                    Contact Number
                                </p>
                                {!editMode ? (
                                    <p className="employeeDetails__detail">
                                        {employeeData.contactNum}
                                    </p>
                                ) : (
                                    <input
                                        className="employeeDetails__input"
                                        type="text"
                                        value={employeeData.contactNum}
                                        onChange={(e) =>
                                            setEmployeeData({
                                                ...employeeData,
                                                contactNum: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                            <div className="employeeDetails__detail-wrapper">
                                <p className="employeeDetails__detail-title">
                                    {" "}
                                    Address
                                </p>
                                {!editMode ? (
                                    <p className="employeeDetails__detail">
                                        {employeeData.address}
                                    </p>
                                ) : (
                                    <input
                                        className="employeeDetails__input"
                                        type="text"
                                        value={employeeData.address}
                                        onChange={(e) =>
                                            setEmployeeData({
                                                ...employeeData,
                                                address: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                            <div className="employeeDetails__detail-wrapper">
                                <p className="employeeDetails__detail-title">
                                    {" "}
                                    Age
                                </p>
                                {!editMode ? (
                                    <p className="employeeDetails__detail">
                                        {employeeData.age} yrs old
                                    </p>
                                ) : (
                                    <input
                                        className="employeeDetails__input"
                                        type="text"
                                        value={employeeData.age}
                                        onChange={(e) =>
                                            setEmployeeData({
                                                ...employeeData,
                                                age: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                            <div className="employeeDetails__detail-wrapper">
                                <p className="employeeDetails__detail-title">
                                    {" "}
                                    Status Today
                                </p>
                                <p className="employeeDetails__detail">
                                    {statusToday !== null ? (
                                        <p className={statusToday}>
                                            {statusToday}
                                        </p>
                                    ) : (
                                        <p>-----</p>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="employeeDetails__stats">
                        <div className="employeeDetails__stats-wrapper">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="employeeDetails__stats-icon"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                                />
                            </svg>

                            <div className="employeeDetails__stats-details-wrapper">
                                <p className="employeeDetails__stats-details">
                                    {totalDays} days
                                </p>
                                <p className="employeeDetails__stats-details-title">
                                    Total Attendance
                                </p>
                            </div>
                        </div>

                        <div className="employeeDetails__stats-wrapper">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="employeeDetails__stats-icon"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                                        
                            <div className="employeeDetails__stats-details-wrapper">
                                <p className="employeeDetails__stats-details">
                                    {formattedTotalTimeWithoutDecimal} 
                                </p>
                                <div className="timeFormat">HH:MM:SS</div>
                                <p className="employeeDetails__stats-details-title">
                                    Total Hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {attendanceLogs.length > 0 && (
                <div className="employeeDetails__logs">
                    <div className="employeeDetails__logs-tittle-wrapper">
    <h2 className="employeeDetails__logs-title">
        Attendance History
    </h2>
    {!addMode && (
        <button
            className="employeeDetails__title-edit"
            onClick={() =>handleAddClick(`${employeeData.firstName} ${employeeData.middleName} ${employeeData.lastName}`)} // Set addMode to true when clicked
        >
            Add
        </button>
    )}
    
</div>
                    <div className="employeeDetails__logs-container">
                        {attendanceLogs.map((log) => (
                            <div
                            className={`employeeDetails__logs-box employeeDetails__logs-box-${log.status ? log.status.toLowerCase() : ''}`}
                            key={log.date}
                        >
                            <div className="employeeDetails__logs-top">
                                <p className="employeeDetails__logs-date">
                                    {formatDate(log.date)}
                                </p>
                                <p
                                    className={`employeeDetails__logs-status employeeDetails__logs-status-${log.status ? log.status.toLowerCase() : ''}`}
                                >
                                    <span className="employeeDetails__logs-status-bullet">
                                        &#8226;
                                    </span>
                                    {log.status}
                                </p>
                            </div>
                            <div className="employeeDetails__logs-bot">
                                    {log.timeIn ? (
                                        <div className="employeeDetails__logs-time-container">
                                            <p className="employeeDetails__logs-time-title">
                                                Time In:{" "}
                                            </p>
                                            <p className="employeeDetails__logs-time">
                                                {new Date(
                                                    log.timeIn
                                                ).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="employeeDetails__logs-time-container">
                                            <p className="employeeDetails__logs-time-title">
                                                Time In:
                                            </p>
                                            <p className="employeeDetails__logs-time">
                                                -----
                                            </p>
                                        </div>
                                    )}
                                    {log.timeOut ? (
                                        <div className="employeeDetails__logs-time-container">
                                            <p className="employeeDetails__logs-time-title">
                                                Time Out:{" "}
                                            </p>
                                            <p className="employeeDetails__logs-time">
                                                {new Date(
                                                    log.timeOut
                                                ).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="employeeDetails__logs-time-container">
                                            <p className="employeeDetails__logs-time-title">
                                                Time Out:
                                            </p>
                                            <p className="employeeDetails__logs-time">
                                                -----
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
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
            )}

{addMode && (
    <div className="employeeDetails__add-attendance">
        <h2 className="employeeDetails__add-attendance-title">Add Attendance</h2>
        <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
            type="time"
            value={timeIn}
            onChange={(e) => setTimeIn(e.target.value)}
        />
        <input
            type="time"
            value={timeOut}
            onChange={(e) => setTimeOut(e.target.value)}
        />
        <button
            className="employeeDetails__add-attendance-button"
            onClick={handleAddAttendance}
        >
            Add Attendance
        </button>
    </div>
)}
        </div>
    );
};

export default EmployeeDetails;
