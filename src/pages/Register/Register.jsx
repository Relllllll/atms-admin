import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, ref, push, set } from "firebase/database";
import {
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage";
import { auth } from "../../firebase";
import { createWorker } from "tesseract.js";
import "./Register.css";

const Register = () => {
    const [selectedID, setSelectedID] = useState(null);
    const [textResult, setTextResult] = useState("");
    const [extractedLines, setExtractedLines] = useState([]);
    const [resultInputText, setResultInputText] = useState("");

    const [idImage, setIdImage] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);

    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const idImageInputRef = useRef(null);
    const generalImageInputRef = useRef(null);
    // const fileInputRef = useRef(null);

    const storage = getStorage();

    const uploadToImageStorage = async (file, employeeName) => {
        const storageReference = storageRef(
            storage,
            `images/${employeeName}_${file.name}`
        );

        const uploadTaskSnapshot = await uploadBytes(storageReference, file);
        const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);

        return downloadURL;
    };

    useEffect(() => {
        const workerInitialization = async () => {
            const worker = await createWorker();
            return worker;
        };

        const convertImageToText = async () => {
            if (!selectedID) return;
            const worker = await workerInitialization();
            const { data } = await worker.recognize(selectedID);

            setTextResult(data.text);
            const lines = data.text.split("\n");
            setExtractedLines(lines);
            console.log("Extracted Lines:", extractedLines);

            // adjustable
            if (lines.length >= 5) {
                setResultInputText(lines[3]);
                console.log("Selected Line:", lines[3]);
            }
            await worker.terminate();
        };

        convertImageToText();
    }, [selectedID]);

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

    const handleSkipIDStep = () => {
        setShowRegistrationForm(true);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleIDImageChange = (e) => {
        if (e.target.files[0]) {
            setSelectedID(e.target.files[0]);
            setIdImage(e.target.files[0]);
            setShowRegistrationForm(true);
        } else {
            setSelectedID(null);
            setTextResult("");
            setResultInputText("");
        }
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

        // try {
        //     const storageRef = ref(
        //         storage,
        //         `images/${formData.lastName}_${formData.firstName}`
        //     );
        //     await uploadBytes(storageRef, formData.image);

        //     const downloadURL = await getDownloadURL(storageRef);

        //     const database = getDatabase();
        //     const newEmployeeKey = push(ref(database, "employees")).key;
        //     const newEmployeeRef = ref(database, `employees/${newEmployeeKey}`);

        //     const formDataWithImage = new FormData();
        //     formDataWithImage.append("image", formData.image);

        //     // Add other form fields to the FormData object
        //     Object.entries(formData).forEach(([key, value]) => {
        //         if (key !== "image") {
        //             formDataWithImage.append(key, value);
        //         }
        //     });

        //     await set(newEmployeeRef, Object.fromEntries(formDataWithImage));

        //     console.log("Employee data submitted successfully!");
        // } catch (error) {
        //     console.error("Error submitting!", error);
        // }

        try {
            if (formData.image) {
                const imageUrl = await uploadToImageStorage(
                    formData.image,
                    `${formData.firstName}_${formData.lastName}`
                );

                const database = getDatabase();

                const newEmployeeKey = push(ref(database, "employees")).key;

                const newEmployeeRef = ref(
                    database,
                    `employees/${newEmployeeKey}`
                );

                const dataToSubmit = {
                    ...formData,
                    image: imageUrl,
                };

                await set(newEmployeeRef, dataToSubmit);

                console.log("Employee data submitted successfully");
            } else {
                console.error("Image not provided. Please upload an image.");
            }
        } catch (error) {
            console.error("Error submitting!", error);
        }
    };

    return (
        <div className="register main">
            {!showRegistrationForm ? (
                <div>
                    <div
                        className="register__image-upload-container"
                        onClick={() => idImageInputRef.current.click()}
                    >
                        <img
                            className="register__image-upload-plus"
                            src="/add.png"
                        />
                        <input
                            type="file"
                            id="id-image-input"
                            accept="image/*"
                            onChange={handleIDImageChange}
                            ref={idImageInputRef}
                        />
                    </div>

                    <button
                        onClick={handleSkipIDStep}
                        className="register__button"
                    >
                        Skip
                    </button>
                </div>
            ) : (
                showRegistrationForm && (
                    <>
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
                                <label
                                    className="register__input-label"
                                    htmlFor="lastName"
                                >
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
                                <label
                                    className="register__input-label"
                                    htmlFor="age"
                                >
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
                                <label
                                    className="register__input-label"
                                    htmlFor="address"
                                >
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
                                onClick={() =>
                                    generalImageInputRef.current.click()
                                }
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
                                    ref={generalImageInputRef}
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

                            {/* <input
                    type="file"
                    id="id-image-input"
                    accept="image/*"
                    onChange={handleIDImageChange}
                    ref={fileInputRef}
                /> */}

                            <button
                                onClick={handleSubmit}
                                className="register__button"
                            >
                                Register
                            </button>
                        </div>
                    </>
                )
            )}
        </div>
    );
};

export default Register;
