import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, push, set } from "firebase/database";
import { auth } from "../../firebase";
import "./Register.css";

const Register = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        contactNum: "",
        address: "",
        age: "",
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const database = getDatabase();
            const newEmployeeKey = push(ref(database, "employees")).key;
            const newEmployeeRef = ref(database, `employees/${newEmployeeKey}`);

            await set(newEmployeeRef, formData);

            console.log("Employee data submitted successfully!");
        } catch (error) {
            console.error("Error submitting!", error);
        }
    };

    return (
        <div className="register">
            <h1>Register</h1>
            <div className="register__input-wrapper">
                <label htmlFor="firstName">First Name: </label>
                <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="register__input-wrapper">
                <label htmlFor="middleName">Middle Name: </label>
                <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    placeholder="Middle Name"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="register__input-wrapper">
                <label htmlFor="lastName">Last Name: </label>
                <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="register__input-wrapper">
                <label htmlFor="contactNum">Contact Number: </label>
                <input
                    type="number"
                    id="contactNum"
                    name="contactNum"
                    placeholder="First Name"
                    value={formData.contactNum}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="register__input-wrapper">
                <label htmlFor="address">Address: </label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="register__input-wrapper">
                <label htmlFor="age">Age: </label>
                <input
                    type="number"
                    id="age"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <button onClick={handleSubmit} className="register__button">
                Register
            </button>
        </div>
    );
};

export default Register;
