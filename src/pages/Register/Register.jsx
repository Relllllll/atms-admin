import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, push, set } from "firebase/database";
import { auth } from "../../firebase";
import "./Register.css";

const Register = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

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
        image: null,
    });

    const [imageUrl, setImageUrl] = useState(null);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setImageUrl(URL.createObjectURL(file));
        formData.image = file; // Update formData for submission
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
            handleImageChange(event);
        } else {
            alert("Please select an image file.");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const database = getDatabase();
            const newEmployeeKey = push(ref(database, "employees")).key;
            const newEmployeeRef = ref(database, `employees/${newEmployeeKey}`);

            const formDataWithImage = new FormData();
            formDataWithImage.append("image", formData.image);

            // Add other form fields to the FormData object
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== "image") {
                    formDataWithImage.append(key, value);
                }
            });

            await set(newEmployeeRef, Object.fromEntries(formDataWithImage));

            console.log("Employee data submitted successfully!");
        } catch (error) {
            console.error("Error submitting!", error);
        }
    };

    return (
        <div className="register main">
            <h1 className="register__title">Register</h1>
            <div className="register__inputs-container">
                <div className="register__input-wrapper">
                    <label
                        className="register__input-label"
                        htmlFor="firstName"
                    >
                        First Name:{" "}
                    </label>
                    <input
                        className="register__input-inputBox"
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
                    <label
                        className="register__input-label"
                        htmlFor="middleName"
                    >
                        Middle Name:{" "}
                    </label>
                    <input
                        className="register__input-inputBox"
                        type="text"
                        id="middleName"
                        name="middleName"
                        placeholder="Middle Name"
                        value={formData.middleName}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="register__input-wrapper">
                    <label className="register__input-label" htmlFor="lastName">
                        Last Name:{" "}
                    </label>
                    <input
                        className="register__input-inputBox"
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
                    <label className="register__input-label" htmlFor="age">
                        Age:{" "}
                    </label>
                    <input
                        className="register__input-inputBox"
                        type="number"
                        id="age"
                        name="age"
                        placeholder="Age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="register__input-wrapper">
                    <label
                        className="register__input-label"
                        htmlFor="contactNum"
                    >
                        Contact Number:{" "}
                    </label>
                    <input
                        className="register__input-inputBox"
                        type="number"
                        id="contactNum"
                        name="contactNum"
                        placeholder="Contact Number"
                        value={formData.contactNum}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="register__input-wrapper">
                    <label className="register__input-label" htmlFor="address">
                        Address:{" "}
                    </label>
                    <input
                        className="register__input-inputBox"
                        type="text"
                        id="address"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                {/* New input field for image upload */}
                <div
                    className="register__image-upload-container"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                >
                    <img
                        className="register__image-upload-plus"
                        src="/add.png"
                    />
                    <input
                        type="file"
                        id="image-input"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        hidden
                    />
                </div>

                {imageUrl && (
                    <div className="register__image-preview">
                        <img
                            className="register__image-previewImg"
                            src={imageUrl}
                            alt="Uploaded ID Image"
                        />
                    </div>
                )}

                <button onClick={handleSubmit} className="register__button">
                    Register
                </button>
            </div>
        </div>
    );
};

export default Register;
