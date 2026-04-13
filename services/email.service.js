const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.send = async({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"Book Store" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};