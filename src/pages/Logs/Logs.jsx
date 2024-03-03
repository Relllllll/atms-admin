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
import "./Logs.css";

const Logs = () => {
    const [logs, setLogs] = useState({});
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        const database = getDatabase();
        const logsRef = ref(database, "logs");

        const logsQuery = query(logsRef, orderByChild("lastName"));

        onValue(
            logsRef,
            (snapshot) => {
                const logsData = snapshot.val();
                if (logsData) {
                    setLogs(logsData);
                }
            },
            { onlyOnce: true }
        );
    }, []);
    return (
        <div className="main logs">
            <hr className="logs__hr"/>

            <div className="logs__list-container">
                <h1 className="logs__title">Logs</h1>
            </div>
        </div>
    )
}
export default Logs
