const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema({
    employeeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Employee", 
        required: true 
    },
    month: { type: String, required: true }, // Format: "2024-03"
    baseSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    taxDeduction: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    paymentDate: { type: Date, default: null },
    status: { 
        type: String, 
        enum: ["Pending", "Processed", "Paid"], 
        default: "Pending" 
    },
    bankDetails: { type: String, default: "" },
    notes: { type: String, default: "" }
}, { timestamps: true });

// Compound index for unique payroll per employee per month
payrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);
