const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    department: { type: String, required: true },
    position: { type: String, default: "" },
    salary: { type: Number, required: true },
    joinDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    address: { type: String, default: "" },
    profileImage: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);
