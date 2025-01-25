import nodemailer from "nodemailer"

export function sendEmail({ email, subject, message }) {
    return new Promise((resolve, reject) => {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: `${process.env.GoogleAccount}`,
          pass: `${process.env.GOOGLEAPPASSWORD}`,
        },
      });
  
      const mail_configs = {
        from: "example@gmail.com",
        to: email,
        subject: subject,
        html: `
        <p>${message}</p>
        <p>OTP</p>
        `,
      };
      transporter.sendMail(mail_configs, function (error, info) {
        if (error) {
          console.log(error);
          return reject({ message: `An error has occurred` });
        }
        return resolve({ message: "Email sent successfully" });
      });
    }); 
  }