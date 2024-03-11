import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import {
    getDatabase,
    ref,
    onValue,
    query,
    orderByChild,
    equalTo,
} from "firebase/database";
import { auth } from "../../firebase";
import "./Employee.css";

const Employee = () => {
    const [employees, setEmployees] = useState({});
    const [searchInput, setSearchInput] = useState("");
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

        onValue(
            employeesRef,
            (snapshot) => {
                const employeesData = snapshot.val();
                // Convert object to array with id included
                const employeesArray = Object.entries(employeesData).map(
                    ([id, employee]) => ({
                        id,
                        ...employee,
                    })
                );
                setEmployees(employeesArray);
            },
            { onlyOnce: true }
        );
    }, []); // Empty dependency array to run only once

    const searchEmployees = Object.values(employees).filter((employee) => {
        if (!searchInput) return true; //Return all

        const idNumber = `${employee.idNumber}`
        const searchTerm = searchInput.toLowerCase();
        const fullName = `${employee.lastName.toLowerCase()} ${employee.firstName.toLowerCase()} ${
            employee.middleName?.toLowerCase() || ""}`;
        
        return fullName.includes(searchTerm) || idNumber.includes(searchTerm);
        
    });
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
                        {searchEmployees.length > 0 ? (
                            <tbody className="employee__table-body">
                                {searchEmployees.map((employee, index) => {
                                    const attendanceKeys = Object.keys(
                                        employee.attendance || {}
                                    );
                                    const latestAttendanceKey =
                                        attendanceKeys[
                                            attendanceKeys.length - 1
                                        ];
                                    const latestAttendance =
                                        employee.attendance?.[
                                            latestAttendanceKey
                                        ] || {};
                                    const latestAttendanceStatus =
                                        latestAttendance.status || "-----";

                                    const statusClass =
                                        latestAttendanceStatus.toLowerCase();

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
                                                >
                                                    {employee.firstName}{" "}
                                                    {employee.middleName}{" "}
                                                    {employee.lastName}
                                                </Link>
                                            </td>
                                            <td>{employee.contactNum}</td>
                                            <td>
                                                <span
                                                    className={latestAttendanceStatus.toLowerCase()}
                                                >
                                                    {latestAttendanceStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <></>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Employee;
