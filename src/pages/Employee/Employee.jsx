import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import {
    getDatabase,
    ref,
    onValue,
    query,
    orderByChild,
    push,
    get,
} from "firebase/database";
import { auth } from "../../firebase";
import "./Employee.css";

const Employee = () => {
    const [employees, setEmployees] = useState({});
    const [searchInput, setSearchInput] = useState("");
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        const database = getDatabase();
        const employeesRef = ref(database, "employees");

        const employeesQuery = query(employeesRef, orderByChild("idNumber"));

        onValue(
            employeesQuery,
            (snapshot) => {
                const employeesData = snapshot.val();
                const employeesArray = Object.entries(employeesData)
                    .map(([id, employee]) => ({
                        id,
                        ...employee,
                    }))
                    .sort((a, b) => a.idNumber.localeCompare(b.idNumber));
                setEmployees(employeesArray);
            }
        );
    }, []); 

    useEffect(() => {
        if (Array.isArray(employees) && employees.length > 0) {
            const statusPromises = employees.map(employee => {
                return handleStatusToday(employee.id, new Date().toISOString().split('T')[0]);
            });
    
            Promise.all(statusPromises)
                .then(statuses => {
                    const updatedEmployees = employees.map((employee, index) => ({
                        ...employee,
                        statusToday: statuses[index]
                    }));
                    setEmployees(updatedEmployees);
                })
                .catch(error => {
                    console.error("Error fetching statuses:", error);
                });
        }
    }, [employees]);

    const searchEmployees = Object.values(employees).filter((employee) => {
        if (!searchInput) return true;

        const idNumber = `${employee.idNumber}`
        const searchTerm = searchInput.toLowerCase();
        const fullName = `${employee.lastName.toLowerCase()} ${employee.firstName.toLowerCase()} ${
            employee.middleName?.toLowerCase() || ""}`;
        
        return fullName.includes(searchTerm) || idNumber.includes(searchTerm);
    });

    const handleEmployeeClick = (employeeName) => {
        const clickTime = new Date().toISOString();
        const database = getDatabase();
        const logsRef = ref(database, "logs");
        const logMessage = `Employee ${employeeName} details viewed`;
        push(logsRef, { action: logMessage, time: clickTime });
    };

    const indexOfLastEmployee = currentPage * itemsPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
    const currentEmployees = searchEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const handleNextPage = () => {
        if (currentPage < Math.ceil(searchEmployees.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };
    
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleStatusToday = (userId, date) => {
        const database = getDatabase();
        const attendanceRef = ref(database, `employees/${userId}/attendance`);
    
        return get(attendanceRef)
            .then((snapshot) => {
                const attendanceData = snapshot.val();
    
                if (attendanceData) {
                    const dates = Object.keys(attendanceData || {}).map(dateString => {
                        const date = new Date(dateString);
                        return isNaN(date.getTime()) ? null : date;
                    }).filter(date => date !== null);
                
                    dates.sort((a, b) => {
                        if (!a) return 1;
                        if (!b) return -1;
                        return a.getTime() - b.getTime();
                    });
                
                    const lastAttendanceDate = dates[dates.length - 1];
                
                    const lastAttendance = new Date(lastAttendanceDate);
                    const dateToday = new Date(date);
                
                    let statusToday = "Absent";
                    if (dateToday.toDateString() === lastAttendance.toDateString()) {
                        statusToday = "Present";
                    }
    
                    return statusToday;
                } else {
                    return "Absent";
                }
            })
            .catch((error) => {
                console.error("Error fetching attendance data: ", error);
                return "Absent";
            });
    };

    return (
        <div className="main employee">
            <div className="employee__searchBox-wrapper">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="employee__searchBox-icon"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                </svg>
                <input
                    className="employee__searchBox"
                    type="text"
                    placeholder="Search"
                    name="searchBox"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </div>
            <hr className="employee__hr" />

            <div className="employee__list-container">
                <h1 className="employee__title">Full Employee Details</h1>
                <div className="employee__tables">
                    <table className="employee__table">
                        <thead className="employee__table-header">
                            <tr>
                                <th>No.</th>
                                <th>Id Number</th>
                                <th>Name</th>
                                <th>Contact #</th>
                                <th>Status Today</th>
                            </tr>
                        </thead>
                        {currentEmployees.length > 0 && (
                            <tbody className="employee__table-body">
                                {currentEmployees.map((employee, index) => {
                                    const latestAttendanceStatus = employee.statusToday || "Absent";

                                    return (
                                        <tr
                                            className="employee__list-row"
                                            key={employee.key}
                                        >
                                            <td>{index + 1}</td>
                                            <td>{employee.idNumber}</td>
                                            <td>
                                                <Link
                                                    to={`/employee-details/${employee.id}`}
                                                    onClick={() => handleEmployeeClick(`${employee.firstName} ${employee.middleName} ${employee.lastName}`)}
                                                >
                                                    {employee.firstName}{" "}
                                                    {employee.middleName}{" "}
                                                    {employee.lastName}
                                                </Link>
                                            </td>
                                            <td>{employee.contactNum}</td>
                                            <td>
                                                <span
                                                    className={latestAttendanceStatus}
                                                >
                                                    {latestAttendanceStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        )}
                    </table>
                </div>
                {searchEmployees.length > itemsPerPage && (
                    <nav className="pagination">
                        <button className="prev" onClick={handlePrevPage} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span className="page"> 
                            Page {currentPage} of {Math.ceil(searchEmployees.length / itemsPerPage)}
                        </span>
                        <button className="name" onClick={handleNextPage} disabled={currentPage === Math.ceil(searchEmployees.length / itemsPerPage)}>
                            Next
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default Employee;
