import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getDatabase, ref, onValue, update } from "firebase/database";
import "./EmployeeDetails.css";

const EmployeeDetails = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [statusToday, setStatusToday] = useState(null);
    const [userId, setUserId] = useState(null);
    const [editMode, setEditMode] = useState(false);

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
        let totalHours = 0;
        let totalDays = 0;

        attendanceLogs.forEach((log) => {
            if (log.timeIn && log.timeOut) {
                const timeIn = new Date(log.timeIn);
                const timeOut = new Date(log.timeOut);
                const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60); // Convert milliseconds to hours
                totalHours += hoursWorked;
                totalDays += 1;
            }
        });

        return { totalHours, totalDays };
    };

    const { totalHours, totalDays } = calculateTotalStats();

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
                {!editMode && (
                    <button
                        className="employeeDetails__title-edit"
                        onClick={() => setEditMode(true)}
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
                                stroke-width="1.5"
                                stroke="currentColor"
                                className="employeeDetails__stats-icon"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
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
                                stroke-width="1.5"
                                stroke="currentColor"
                                className="employeeDetails__stats-icon"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>

                            <div className="employeeDetails__stats-details-wrapper">
                                <p className="employeeDetails__stats-details">
                                    {totalHours.toFixed(2)} hrs
                                </p>
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
                    <h2 className="employeeDetails__logs-title">
                        Attendance History
                    </h2>

                    <div className="employeeDetails__logs-container">
                        {attendanceLogs.map((log) => (
                            <div
                                className={`employeeDetails__logs-box employeeDetails__logs-box-${log.status.toLowerCase()}`}
                                key={log.date}
                            >
                                <div className="employeeDetails__logs-top">
                                    <p className="employeeDetails__logs-date">
                                        {formatDate(log.date)}
                                    </p>
                                    <p
                                        className={`employeeDetails__logs-status employeeDetails__logs-status-${log.status.toLowerCase()}`}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDetails;
