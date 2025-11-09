import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail", // or "smtp.mailtrap.io" or others
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your app password (not personal one)
  },
});

export const sendMail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: `"Zilla Panchayat" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
