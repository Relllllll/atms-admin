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
import Notification from "../../components/Notification/Notification";
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
    const imagePreviewRef = useRef(null);

    const storage = getStorage();

    const [formData, setFormData] = useState({
        idNumber: "",
        firstName: "",
        middleName: "",
        lastName: "",
        contactNum: "",
        address: "",
        age: "",
        image: null,
    });
    const resetForm = () => {
        setFormData({
            idNumber: "",
            firstName: "",
            middleName: "",
            lastName: "",
            contactNum: "",
            address: "",
            age: "",
            image: null,
        });
        setImageUrl(null);
        setShowRegistrationForm(false);
    };

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
            const filteredLines = lines.filter((line) => line.trim() !== ""); // Remove empty lines
            console.log("Extracted Lines:", filteredLines);
            await worker.terminate();

            // Custom logic to find and extract the ID number
            const idNumberPattern = /(\d{4}-\d{6})/;

            let idNumber;
            for (let i = 0; i < filteredLines.length; i++) {
                const line = filteredLines[i];
                const match = idNumberPattern.exec(line);
                if (match) {
                    idNumber = match[0]; // Extracted ID number
                    console.log("ID Number Match:", match);
                    console.log("ID Number:", idNumber);

                    // Assuming the name is located directly above the ID number
                    const nameIndex = i - 1;
                    const nameLine = filteredLines[nameIndex];
                    console.log("Name Line:", nameLine);

                    // Filter special characters from the name
                    const filteredName = nameLine.replace(
                        /[^a-zA-Z0-9,. ]/g,
                        ""
                    );
                    console.log("Filtered Name:", filteredName);

                    // Splitting the name into last name, first name, and middle name
                    const [lastName, ...rest] = filteredName.split(",");
                    const firstNameParts = rest.join(",").trim().split(/\s+/);
                    const middleName = firstNameParts.pop().replace(".", ""); // Remove period from the last part
                    const firstName = firstNameParts.join(" "); // Concatenate remaining parts as first name
                    console.log("First Name:", firstName);
                    console.log("Middle Name:", middleName);
                    console.log("Last Name:", lastName);

                    // Update form data with extracted ID number and name
                    setFormData({
                        ...formData,
                        idNumber: idNumber,
                        firstName: firstName,
                        middleName: middleName,
                        lastName: lastName.trim(),
                    });

                    break;
                }
            }
        };

        convertImageToText();
    }, [selectedID]);

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    const [imageUrl, setImageUrl] = useState(null);
    const [notification, setNotification] = useState("");
    const closePopup = () => setNotification("");

    const handleSkipIDStep = () => {
        setShowRegistrationForm(true);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        // Validate input based on name
        if (name === "contactNum") {
            // Allow only numbers
            if (/^\d*$/.test(value)) {
                setFormData({ ...formData, [name]: value });
            }
        } else if (
            name === "firstName" ||
            name === "middleName" ||
            name === "lastName"
        ) {
            // Allow only letters
            if (/^[a-zA-Z\s]*$/.test(value)) {
                setFormData({ ...formData, [name]: value });
            }
        } else {
            // For other inputs, set value directly
            setFormData({ ...formData, [name]: value });
        }
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

    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        setImageUrl(URL.createObjectURL(file));
        formData.image = file; // Update formData for submission
        const blob = await resizeImage(file);
        setImageUrl(URL.createObjectURL(blob));
    };

    const resizeImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    const maxWidth = 400; // Set your desired max width
                    const maxHeight = 400; // Set your desired max height

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, file.type);
                };
            };
        });
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
        const clickTime = new Date().toISOString();
        const database = getDatabase();
        const logsRef = ref(database, "logs");
        const logMessage = "admin Registered an employee";
        push(logsRef, { action: logMessage, time: clickTime });
        event.preventDefault();

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
                setNotification("Registration successful");
                resetForm();

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
            <Notification notification={notification} closePopup={closePopup} />
            {!showRegistrationForm ? (
                <>
                    <h1 className="register__title">Register - Upload ID</h1>
                    <div
                        className="register__image-upload-container"
                        onClick={() => idImageInputRef.current.click()}
                    >
                        <img
                            className="register__image-upload-plus"
                            src="/image-gallery.png"
                        />
                        <input
                            type="file"
                            id="id-image-input"
                            accept="image/*"
                            onChange={handleIDImageChange}
                            ref={idImageInputRef}
                            hidden
                        />
                    </div>

                    <button
                        onClick={handleSkipIDStep}
                        className="register__button register__skip"
                    >
                        SKIP
                    </button>
                </>
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
                                    Id Number{" "}
                                </label>
                                <input
                                    className="register__input-inputBox"
                                    type="text"
                                    id="idNumber"
                                    name="idNumber"
                                    placeholder="Enter Id Number..."
                                    value={formData.idNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
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
                                    placeholder="Enter first name..."
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
                                    placeholder="Enter middle name..."
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
                                    placeholder="Enter last name..."
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
                                    placeholder="Enter contact number..."
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
                                    placeholder="Enter address..."
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="register__input-label">
                                    Face Picture:
                                </label>
                                <div
                                    className="register__image-upload-container"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        generalImageInputRef.current.click()
                                    }
                                >
                                    {imageUrl ? (
                                        <div className="register__image-preview">
                                            <img
                                                className="register__image-previewImg"
                                                src={imageUrl}
                                                alt="Uploaded ID Image"
                                            />
                                        </div>
                                    ) : (
                                        <div className="register__image-upload-container">
                                            <img
                                                className="register__image-upload-plus"
                                                src="/image-gallery.png"
                                                alt="Default Image"
                                            />
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        id="image-input"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        ref={generalImageInputRef}
                                        hidden
                                    />
                                </div>
                            </div>

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
                                REGISTER
                            </button>
                        </div>
                    </>
                )
            )}
        </div>
    );
};

export default Register;
