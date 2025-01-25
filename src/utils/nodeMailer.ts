
import nodemailer from "nodemailer"

export function sendMailPassword({ email, randomPassword }:{
  email: string,
  randomPassword: string
}) {
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
        subject: "Your Temporary Password",
        html: `
        <p>Your temporary password is: <strong>${randomPassword}</strong></p>
        <p>Please login and change your password immediately.</p>
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