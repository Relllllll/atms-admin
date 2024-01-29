import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from "../../firebase";
import "./Employee.css";

const Employee = () => {
    const [employees, setEmployees] = useState({});
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
        <div>
            <h1>Employee</h1>
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
