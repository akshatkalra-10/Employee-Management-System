const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    employeeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Employee", 
        required: true 
    },
    date: { type: Date, required: true },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    status: { 
        type: String, 
        enum: ["Present", "Absent", "Late", "Leave"], 
        default: "Absent" 
    },
    notes: { type: String, default: "" }
}, { timestamps: true });

// Compound index for unique attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: false });

module.exports = mongoose.model("Attendance", attendanceSchema);
