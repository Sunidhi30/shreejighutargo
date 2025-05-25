// const nodemailer = require('nodemailer');
console.log("send is working")
const sendNotification = async ({ to, subject, message }) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
  
      const info = await transporter.sendMail({
        from: `"Vendor Panel" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: `<p>${message}</p>`
      });
  
      console.log('📧 Email sent:', info.response);
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  };
  
  module.exports = sendNotification;
  