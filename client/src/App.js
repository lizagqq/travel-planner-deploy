import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import AddRoutePage from "./pages/AddRoutePage";
import RoutesPage from "./pages/RoutesPage";
import AdminPanel from "./pages/AdminPanel";
import PrivateRoute from "./components/PrivateRoute";

function App() {
    console.log("App rendered");
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/add-route" element={<AddRoutePage />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/routes" element={<RoutesPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;