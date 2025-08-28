const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendResetMail(toEmail, resetURL, userName = "User", host) {
  const mailOptions = {
    from: process.env.GMAIL,
    to: toEmail,
    subject: `${host} Password Reset Link`,
    html: `
      <p>Hello ${userName},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>This link will expire in 10 minutes.
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    return { error: `Error sending email: ${err.message}` };
  }
}

module.exports = sendResetMail;
