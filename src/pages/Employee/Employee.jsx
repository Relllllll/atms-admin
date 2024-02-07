import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
                setEmployees(employeesData);
            },
            { onlyOnce: true }
        );
    }, []); // Empty dependency array to run only once

    const searchEmployees = Object.values(employees).filter((employee) => {
        if (!searchInput) return true; //Return all

        const searchTerm = searchInput.toLowerCase();
        const fullName = `${employee.lastName.toLowerCase()} ${employee.firstName.toLowerCase()} ${
            employee.middleName?.toLowerCase() || ""
        }`;
        return fullName.includes(searchTerm);
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
            <hr />
            <div className="employee__list">
                <h1>Full Employee Details</h1>
                <ul>
                    {searchEmployees.map((employee) => (
                        <li key={employee.key}>
                            <p>
                                Name: {employee.firstName} {employee.middleName}{" "}
                                {employee.lastName}
                            </p>
                            <p>Contact Number: {employee.contactNum}</p>
                            <p>Address: {employee.address}</p>
                            <p>Age: {employee.age}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Employee;
