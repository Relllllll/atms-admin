import React from "react";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

const Notification =({ notification, closePopup }) => {
    return (
      <Popup open={!!notification} onClose={closePopup}>
        <div className="popup-content">
          <p>{notification}</p>
          <button onClick={closePopup}>Close</button>
        </div>
      </Popup>
    );
  };

export default Notification;
