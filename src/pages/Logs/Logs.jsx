import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker styles
import {
  getDatabase,
  ref,
  onValue,
  query,
  orderByChild,
} from "firebase/database";
import { auth } from "../../firebase";
import "./Logs.css";

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [user] = useAuthState(auth);
    const [startDate, setStartDate] = useState(null); // State to store start date of range
    const [endDate, setEndDate] = useState(null); // State to store end date of range
    const navigate = useNavigate();
  
    useEffect(() => {
      if (!user) {
        navigate("/");
      }
    }, [user, navigate]);
  
    useEffect(() => {
      const database = getDatabase();
      const employeesRef = ref(database, "employees");
  
      const employeesQuery = query(employeesRef, orderByChild("lastName"));
  
      const unsubscribe = onValue(
        employeesQuery,
        (snapshot) => {
          const employeesData = snapshot.val();
  
          if (employeesData) {
            const newLogs = [];
  
            // Loop through each employee
            for (const employeeId in employeesData) {
              const employee = employeesData[employeeId];
              const { firstName, lastName, attendance } = employee;
  
              // Loop through attendance entries
              for (const date in attendance) {
                const entry = attendance[date];
                const { status, timeIn, timeOut } = entry;
  
                // Create log entry
                const logEntry = {
                  userId: employeeId, 
                  idNumber: `${employee.idNumber}`,
                  userName: `${firstName} ${lastName}`,
                  date: new Date(date).toLocaleDateString(),
                  timeIn: timeIn
                    ? new Date(timeIn).toLocaleTimeString()
                    : "-----",
                  timeOut: timeOut
                    ? new Date(timeOut).toLocaleTimeString()
                    : "-----",
                  status,
                };
  
                // Check if log entry falls within selected date range
                if (
                  startDate &&
                  endDate &&
                  new Date(logEntry.date) >= startDate &&
                  new Date(logEntry.date) <= endDate
                ) {
                  newLogs.push(logEntry);
                } else if (!startDate && !endDate) {
                  // If no date range is selected, add all logs
                  newLogs.push(logEntry);
                }
              }
            }
  
            // Sort logs by date and time in descending order
            newLogs.sort(
              (a, b) =>
                new Date(b.date + " " + b.timeIn) -
                new Date(a.date + " " + a.timeIn)
            );
  
            setLogs(newLogs);
          }
        },
        { onlyOnce: true }
      );
  
      
      // Cleanup function to unsubscribe when the component unmounts
      return () => unsubscribe();
    }, [startDate, endDate]);
    useEffect(() => {
        if (startDate && !endDate) {
          setEndDate(startDate);
        }
      }, [startDate, endDate]);
  
    const handleDownloadLogs = () => {
      // Get the current date
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  
      // Create a new PDF document
      const doc = new jsPDF();
  
      // Set the title of the document
      doc.setFontSize(18);
      doc.text("Logs", 105, 10, { align: "center" });
  
      // Define table headers
      const headers = ["Id Number", "Name", "Date", "Time In", "Time Out", "Status"];
  
      // Define table data
      const data = logs.map((logEntry) => [
        logEntry.idNumber,
        logEntry.userName,
        logEntry.date,
        logEntry.timeIn,
        logEntry.timeOut,
        logEntry.status,
      ]);
  
      // Set the position of the table
      const startY = 20; // Adjust as needed
      const startX = 10; // Adjust as needed
  
      // Add the table to the PDF
      doc.autoTable({
        startY,
        head: [headers],
        body: data,
        startY,
        theme: "grid",
        styles: { fontSize: 12 },
        columnStyles: { 0: { cellWidth: 20 } }, // Adjust column width if necessary
      });
  
      // Save the PDF with the current date in the file name
      doc.save(`logs_${formattedDate}.pdf`);
    };
  
    return (
      <div className="main logs">
        <hr className="logs__hr" />
  
        <div className="logs__list-container">
          <h1 className="logs__title">Logs</h1>
        <div className="logs__date-picker">
            <h3>Date Filter</h3>
            {/* Date range picker */}
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            dateFormat="MM/dd/yyyy"
            className="startDate"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            dateFormat="MM/dd/yyyy"
            className="endDate"
          />
        </div>
          
  
          <table className="logs__table">
            <thead className="logs__table-header">
              <tr>
                <th>No. </th>
                <th>ID Number</th>
                <th>Name </th>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="logs__table-body">
              {logs.map((logEntry, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{logEntry.idNumber}</td>
                  <td>{logEntry.userName}</td>
                  <td>{logEntry.date}</td>
                  <td>{logEntry.timeIn}</td>
                  <td>{logEntry.timeOut}</td>
                  <td>
                    <span className={logEntry.status.toLowerCase()}>
                      {logEntry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="download-button" onClick={handleDownloadLogs}>
          Download Logs
        </button>
      </div>
    );
  };
  
  export default Logs;
  
