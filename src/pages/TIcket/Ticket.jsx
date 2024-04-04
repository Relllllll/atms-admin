import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, update, push } from "firebase/database";
import "./Ticket.css";

const Ticket = () => {
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const messagesRef = ref(getDatabase(), "ticketMessages");
        onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val();
            if (messagesData) {
                const messagesArray = Object.entries(messagesData).map(
                    ([key, value]) => ({
                        id: key,
                        ...value,
                    })
                );
                setMessages(messagesArray);

                // Check if there are unread messages
                const unread = messagesArray.some((message) => !message.read);
                setUnreadMessages(unread);
            } else {
                setMessages([]);
                setUnreadMessages(false);
            }
        });
    }, []);

    const markAsRead = (messageId) => {
        const messageIndex = messages.findIndex(
            (message) => message.id === messageId
        );
        if (messageIndex !== -1) {
            const updatedMessages = [...messages];
            updatedMessages[messageIndex].read =
                !updatedMessages[messageIndex].read; // Toggle read status
            setMessages(updatedMessages);

            // Update read status in Firebase
            const messageRef = ref(
                getDatabase(),
                `ticketMessages/${messageId}`
            );
            update(messageRef, { read: updatedMessages[messageIndex].read });

            // Check if there are any unread messages after toggling read status
            const unread = updatedMessages.some((message) => !message.read);
            setUnreadMessages(unread);

            // Log the action
            const logRef = ref(getDatabase(), "logs");
            const logMessage = `Message with ID ${messageId} marked as ${
                updatedMessages[messageIndex].read ? "Read" : "Unread"
            }`;
            push(logRef, {
                action: logMessage,
                time: new Date().toISOString(),
            });
        }
    };

    const indexOfLastMessage = currentPage * itemsPerPage;
    const indexOfFirstMessage = indexOfLastMessage - itemsPerPage;
    const currentMessages = messages.slice(
        indexOfFirstMessage,
        indexOfLastMessage
    );

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const paginationRange = 5; // Number of pages to display in the pagination bar
    const totalPages = Math.ceil(messages.length / itemsPerPage);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const startPage = Math.max(
            1,
            currentPage - Math.floor(paginationRange / 2)
        );
        const endPage = Math.min(totalPages, startPage + paginationRange - 1);

        if (startPage > 1) {
            pageNumbers.push(1); // Add the first page number
            if (startPage > 2) {
                pageNumbers.push("ellipsis"); // Add ellipsis if needed
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages - 1) {
            pageNumbers.push("ellipsis"); // Add ellipsis if needed
        }

        if (endPage < totalPages) {
            pageNumbers.push(totalPages); // Add the last page number
        }

        return pageNumbers;
    };

    return (
        <div className="main ticket">
            <hr className="ticket__hr" />
            <div className="ticket__list-container">
                <h1 className="ticket__tittle">
                    Tickets{" "}
                    {unreadMessages && <span className="red-dot"></span>}
                </h1>
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
                            <tr
                                key={index}
                                className={message.read ? "read" : "unread"}
                                onClick={() => markAsRead(message.id)}
                            >
                                <td>{index + 1}</td>
                                <td>
                                    {new Date(
                                        message.timestamp
                                    ).toLocaleDateString()}
                                </td>
                                <td>{message.name}</td>
                                <td>{message.message}</td>
                                <td>{message.read ? "Read" : "Unread"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
                <nav className="pagination">
                    {/* Display page numbers */}
                    {Array.from(getPageNumbers()).map((pageNumber, index) => {
                        if (pageNumber === "ellipsis") {
                            return (
                                <span key={index} className="ellipsis">
                                    ...
                                </span>
                            );
                        }
                        return (
                            <button
                                key={index}
                                className={`page-number ${
                                    currentPage === pageNumber ? "active" : ""
                                }`}
                                onClick={() => paginate(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Ticket;
