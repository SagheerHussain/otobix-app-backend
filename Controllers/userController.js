const UserModel = require("../Models/userModel");
const transporter = require("../Config/mailer");

const saveUserToDB = async (userData) => {
    const user = new UserModel(userData);
    await user.save();
    return user;
};

const sendWelcomeEmail = async (email, name) => {
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "Welcome to OtoBix!",
        html: `<h2>Hello ${name},</h2><p>Welcome to OtoBix. We're glad you're here!</p>`,
    };

    await transporter.sendMail(mailOptions);
};

const registerUser = async (req, res) => {
    try {
        const { name, email, phoneNumber } = req.body;

        if (!name || !email || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and phone number are required.",
            });
        }


        // Save user to DB
        const user = await saveUserToDB({ name, email, phoneNumber });

        // Send welcome email
        await sendWelcomeEmail(email, name);

        return res.status(201).json({
            success: true,
            message: "User registered and welcome email sent.",
            user,
        });
    } catch (error) {
        console.error("Error in registerUser:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    saveUserToDB,
    sendWelcomeEmail,
    registerUser,
};
