const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const rootEnvPath = path.join(__dirname, "..", ".env");
const backendEnvPath = path.join(__dirname, ".env");
require("dotenv").config({
    path: fs.existsSync(rootEnvPath) ? rootEnvPath : backendEnvPath,
});

const Employee = require("./models/employee");
const Attendance = require("./models/attendance");
const Leave = require("./models/leave");
const Payroll = require("./models/payroll");

const app = express();
const uploadsDir = process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to your .env file.");
    if (process.env.VERCEL) {
        throw new Error("MONGODB_URI is not set");
    }
    process.exit(1);
}

let dbConnected = false;
async function connectToDatabase() {
    if (dbConnected || mongoose.connection.readyState === 1) return;

    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    console.log("MongoDB connected");
}

connectToDatabase().catch((err) => {
    console.log(err);
});

// ==================== AUTHENTICATION ====================
app.post("/login", (req, res) => {
    const {username, password} = req.body;
    if(username === "admin" && password === "admin123"){
        res.json({success: true, message: "Login successful"});
    } else {
        res.status(401).json({success: false, message: "Invalid credentials"});
    }
});

// ==================== EMPLOYEE MANAGEMENT ====================
app.post("/addEmployee", async (req, res) => {
    try {
        if (!req.body.name || !req.body.email || !req.body.department || !req.body.salary) {
            return res.status(400).json({
                success: false, 
                message: "Missing required fields: name, email, department, and salary are required"
            });
        }

        const emp = new Employee(req.body);
        await emp.save();
        res.status(201).json({success: true, message: "Employee Added Successfully", data: emp});
    } catch (error) {
        let message = error.message;
        if (error.code === 11000) {
            message = `Email already exists. Please use a different email.`;
        }
        res.status(400).json({success: false, message});
    }
});

app.get("/employees", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const department = req.query.department || "";
        const status = req.query.status || "";
        const sortBy = req.query.sortBy || "name";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }
        
        if (department) query.department = department;
        if (status) query.status = status;

        const total = await Employee.countDocuments(query);
        const employees = await Employee.find(query)
            .sort({ [sortBy]: sortOrder })
            .limit(limit)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            data: employees,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/employees/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }
        res.json({success: true, data: employee});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.put("/updateEmployee/:id", async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!employee) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }
        res.json({success: true, message: "Employee Updated Successfully", data: employee});
    } catch (error) {
        let message = error.message;
        if (error.code === 11000) {
            message = `Email already exists. Please use a different email.`;
        }
        res.status(400).json({success: false, message});
    }
});

app.delete("/deleteEmployee/:id", async (req, res) => {
    try {
        const result = await Employee.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }
        res.json({success: true, message: "Employee Deleted Successfully"});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// ==================== PROFILE IMAGE UPLOAD ====================
app.post("/uploadProfile/:id", upload.single("profileImage"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({success: false, message: "No file uploaded"});
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { profileImage: `/uploads/${req.file.filename}` },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }

        res.json({
            success: true,
            message: "Profile image uploaded successfully",
            data: employee
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// ==================== ATTENDANCE MANAGEMENT ====================
app.post("/attendance/checkin", async (req, res) => {
    try {
        const { employeeId, date, checkIn } = req.body;
        
        if (!employeeId || !date) {
            return res.status(400).json({
                success: false,
                message: "employeeId and date are required"
            });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let attendance = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!attendance) {
            attendance = new Attendance({
                employeeId,
                date: new Date(date),
                checkIn: checkIn || new Date().toLocaleTimeString(),
                status: "Present"
            });
        } else {
            attendance.checkIn = checkIn || new Date().toLocaleTimeString();
            attendance.status = "Present";
        }

        await attendance.save();
        res.json({success: true, message: "Check-in recorded", data: attendance});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.post("/attendance/checkout", async (req, res) => {
    try {
        const { employeeId, date, checkOut } = req.body;
        
        if (!employeeId || !date) {
            return res.status(400).json({
                success: false,
                message: "employeeId and date are required"
            });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!attendance) {
            return res.status(404).json({success: false, message: "Check-in record not found"});
        }

        attendance.checkOut = checkOut || new Date().toLocaleTimeString();
        await attendance.save();
        res.json({success: true, message: "Check-out recorded", data: attendance});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/attendance/report/:employeeId", async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find({ employeeId: req.params.employeeId });
        
        const stats = {
            total: attendanceRecords.length,
            present: attendanceRecords.filter(a => a.status === "Present").length,
            absent: attendanceRecords.filter(a => a.status === "Absent").length,
            late: attendanceRecords.filter(a => a.status === "Late").length,
            percentage: attendanceRecords.length ? 
                ((attendanceRecords.filter(a => a.status === "Present").length / attendanceRecords.length) * 100).toFixed(2) : 0
        };

        res.json({success: true, data: stats, attendance: attendanceRecords});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// Get all attendance for a specific date (across all employees)
app.get("/attendance/date/:date", async (req, res) => {
    try {
        const dateStr = req.params.date; // Expected format: YYYY-MM-DD
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate("employeeId", "name email department position").sort({ createdAt: -1 });

        res.json({success: true, data: attendance});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/attendance/:employeeId", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { employeeId: req.params.employeeId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query).sort({ date: -1 });
        res.json({success: true, data: attendance});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// ==================== LEAVE MANAGEMENT ====================

app.post("/leave/apply", async (req, res) => {
    try {
        const { employeeId, startDate, endDate, leaveType, reason } = req.body;

        if (!employeeId || !startDate || !endDate || !leaveType || !reason) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const leave = new Leave({
            employeeId,
            startDate,
            endDate,
            leaveType,
            reason
        });

        await leave.save();
        res.status(201).json({success: true, message: "Leave application submitted", data: leave});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/leave", async (req, res) => {
    try {
        const { employeeId, status } = req.query;
        let query = {};

        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;

        const leaves = await Leave.find(query)
            .populate("employeeId", "name email")
            .populate("approvedBy", "name")
            .sort({ createdAt: -1 });

        res.json({success: true, data: leaves});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.put("/leave/:id/approve", async (req, res) => {
    try {
        const { approvedBy, approvalNotes } = req.body;

        const updateData = {
            status: "Approved",
            approvalDate: new Date(),
            approvalNotes: approvalNotes || ""
        };

        if (approvedBy && mongoose.Types.ObjectId.isValid(approvedBy)) {
            updateData.approvedBy = approvedBy;
        }

        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({success: false, message: "Leave request not found"});
        }

        res.json({success: true, message: "Leave approved", data: leave});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.put("/leave/:id/reject", async (req, res) => {
    try {
        const { approvedBy, approvalNotes } = req.body;

        const updateData = {
            status: "Rejected",
            approvalDate: new Date(),
            approvalNotes: approvalNotes || ""
        };

        if (approvedBy && mongoose.Types.ObjectId.isValid(approvedBy)) {
            updateData.approvedBy = approvedBy;
        }

        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({success: false, message: "Leave request not found"});
        }

        res.json({success: true, message: "Leave rejected", data: leave});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// ==================== PAYROLL MANAGEMENT ====================
app.post("/payroll/generate", async (req, res) => {
    try {
        const { employeeId, month, bonus, deductions, taxDeduction } = req.body;

        if (!employeeId || !month) {
            return res.status(400).json({
                success: false,
                message: "employeeId and month are required"
            });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }

        const baseSalary = employee.salary;
        const parsedBonus = Number(bonus) || 0;
        const parsedDeductions = Number(deductions) || 0;
        const parsedTaxDeduction = Number(taxDeduction) || 0;
        const netSalary = baseSalary + parsedBonus - parsedDeductions - parsedTaxDeduction;

        const existingPayroll = await Payroll.findOne({ employeeId, month });

        if (existingPayroll) {
            existingPayroll.baseSalary = baseSalary;
            existingPayroll.bonus = parsedBonus;
            existingPayroll.deductions = parsedDeductions;
            existingPayroll.taxDeduction = parsedTaxDeduction;
            existingPayroll.netSalary = netSalary;

            await existingPayroll.save();
            return res.json({
                success: true,
                message: "Payroll updated for selected month",
                data: existingPayroll
            });
        }

        const payroll = new Payroll({
            employeeId,
            month,
            baseSalary,
            bonus: parsedBonus,
            deductions: parsedDeductions,
            taxDeduction: parsedTaxDeduction,
            netSalary
        });

        await payroll.save();
        res.status(201).json({success: true, message: "Payroll generated", data: payroll});
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Payroll for this employee and month already exists"
            });
        }
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/payroll/:employeeId", async (req, res) => {
    try {
        const payrolls = await Payroll.find({ employeeId: req.params.employeeId })
            .populate("employeeId", "name email")
            .sort({ month: -1 });

        res.json({success: true, data: payrolls});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.put("/payroll/:id/mark-paid", async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndUpdate(
            req.params.id,
            {
                status: "Paid",
                paymentDate: new Date()
            },
            { new: true }
        );

        if (!payroll) {
            return res.status(404).json({success: false, message: "Payroll record not found"});
        }

        res.json({success: true, message: "Marked as paid", data: payroll});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// ==================== EXPORT FUNCTIONALITY ====================
app.get("/export/employees/csv", async (req, res) => {
    try {
        const employees = await Employee.find();
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(employees);

        res.header("Content-Type", "text/csv");
        res.header("Content-Disposition", "attachment; filename=employees.csv");
        res.send(csv);
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/export/employees/excel", async (req, res) => {
    try {
        const employees = await Employee.find();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Employees");

        worksheet.columns = [
            { header: "ID", key: "_id", width: 25 },
            { header: "Name", key: "name", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Phone", key: "phone", width: 15 },
            { header: "Department", key: "department", width: 15 },
            { header: "Position", key: "position", width: 15 },
            { header: "Salary", key: "salary", width: 12 },
            { header: "Join Date", key: "joinDate", width: 15 },
            { header: "Status", key: "status", width: 12 },
            { header: "Address", key: "address", width: 30 }
        ];

        employees.forEach(emp => {
            worksheet.addRow(emp);
        });

        worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" }
        };

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=employees.xlsx");
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get("/export/employees/pdf", async (req, res) => {
    try {
        const employees = await Employee.find();
        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=employees.pdf");

        doc.pipe(res);

        doc.fontSize(20).text("Employee Directory", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" });
        doc.moveDown();

        employees.forEach((emp, index) => {
            doc.fontSize(11).text(`${index + 1}. ${emp.name}`, { underline: true });
            doc.fontSize(9)
                .text(`Email: ${emp.email}`)
                .text(`Phone: ${emp.phone || "N/A"}`)
                .text(`Department: ${emp.department}`)
                .text(`Position: ${emp.position || "N/A"}`)
                .text(`Salary: ${emp.salary}`)
                .text(`Status: ${emp.status}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// ==================== STATISTICS ====================
app.get("/statistics", async (req, res) => {
    try {
        const total = await Employee.countDocuments();
        const active = await Employee.countDocuments({ status: "Active" });
        const inactive = await Employee.countDocuments({ status: "Inactive" });
        const avgSalary = await Employee.aggregate([
            { $group: { _id: null, average: { $avg: "$salary" } } }
        ]);
        const departments = await Employee.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive,
                avgSalary: avgSalary[0]?.average || 0,
                departments
            }
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// Get departments list
app.get("/departments", async (req, res) => {
    try {
        const departments = await Employee.distinct("department");
        res.json({success: true, data: departments});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;