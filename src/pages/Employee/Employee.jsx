import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from "../../firebase";
import "./Employee.css";

const Employee = () => {
    const [employees, setEmployees] = useState({});
    const [searchInput, setSearchInput] = useState();
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

        onValue(
            employeesRef,
            (snapshot) => {
                const employeesData = snapshot.val();
                setEmployees(employeesData);
            },
            { onlyOnce: true }
        );
    }, []); // Empty dependency array to run only once
    return (
        <div className="main employee">
            <div className="employee__searchBox-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="employee__searchBox-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input className="employee__searchBox" type="text" placeholder="Search" name="searchBox" />
            </div>
            <hr/>
            <h1>Full Employee Details</h1>
            <ul>
                {Object.values(employees).map((employee) => (
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
    );
};

export default Employee;
