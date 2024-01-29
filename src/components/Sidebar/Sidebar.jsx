import { Link } from "react-router-dom";

const Sidebar = () => {
    return (
        <div>
            <h1>Sidebar</h1>
            <Link to="/employee-list">Employee List</Link> <br />
            <Link to="/register-employee">Register Employee</Link>
        </div>
    );
};

export default Sidebar;
