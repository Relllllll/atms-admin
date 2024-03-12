import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import "./Ticket.css";

const Ticket = () => {
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(false);

    useEffect(() => {
        const messagesRef = ref(getDatabase(), "ticketMessages");
        onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val();
            if (messagesData) {
                const messagesArray = Object.entries(messagesData).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                setMessages(messagesArray);

                // Check if there are unread messages
                const unread = messagesArray.some(message => !message.read);
                setUnreadMessages(unread);
            } else {
                setMessages([]);
                setUnreadMessages(false);
            }
        });
    }, []);

    const markAsRead = (messageId) => {
        const messageIndex = messages.findIndex(message => message.id === messageId);
        if (messageIndex !== -1) {
            const updatedMessages = [...messages];
            updatedMessages[messageIndex].read = !updatedMessages[messageIndex].read; // Toggle read status
            setMessages(updatedMessages);

            // Update read status in Firebase
            const messageRef = ref(getDatabase(), `ticketMessages/${messageId}`);
            update(messageRef, { read: updatedMessages[messageIndex].read });

            // Check if there are any unread messages after toggling read status
            const unread = updatedMessages.some(message => !message.read);
            setUnreadMessages(unread);
        }
    };

    return (
        <div className="main ticket">
            <hr className="ticket__hr" />
            <div className="ticket__list-container">
                <h1 className="ticket__tittle">Tickets {unreadMessages && <span className="red-dot"></span>}</h1>
                <table className="ticket__table">
                    <thead className="ticket__table-header">
                        <tr>
                            <th>No.</th>
                            <th>Date</th>
                            <th>Id Number</th>
                            <th>Message</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody className="ticket__table-body">
                        {messages.map((message, index) => (
                            <tr key={index} className={message.read ? "read" : "unread"} onClick={() => markAsRead(message.id)}>
                                <td>{index + 1}</td>
                                <td>{new Date(message.timestamp).toLocaleDateString()}</td>
                                <td>{message.name}</td>
                                <td>{message.message}</td>
                                <td>{message.read ? "Read" : "Unread"}</td> {/* Display status */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Ticket;