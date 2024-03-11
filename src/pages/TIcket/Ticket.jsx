
import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import "./Ticket.css";

const Ticket = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const messagesRef = ref(getDatabase(), "ticketMessages");
        onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val();
            if (messagesData) {
                const messagesArray = Object.values(messagesData);
                setMessages(messagesArray);
            } else {
                setMessages([]);
            }
        });
    }, []);

    return (
        <div className="main ticket">
            <hr className="ticket__hr" />

            <div className="ticket__list-container">
            <h1 className="ticket__tittle">Tickets</h1>

            
            
            <table className="ticket__table">
            <thead className="ticket__table-header">
                        <tr>
                            <th>No. </th>
                            <th>date</th>
                            <th>Id Number </th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody className="ticket__table-body">
                    {messages.map((message, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{new Date(message.timestamp).toLocaleDateString()}</td>
                        <td>{message.name}</td>
                        <td>{message.message}</td>
                        
                    </tr>
                    ))}
                    </tbody>
                
                
            </table>
            
            </div>
        </div>
    );
};

export default Ticket;
