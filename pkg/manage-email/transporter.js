const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'universe@iuranku.com', 
      pass: 'ozwudshopkhirrez', 
    },
  //   host: 'smtp.ethereal.email',
  //   port: 587,
  //   auth: {
  //       user: 'adolphus.feil80@ethereal.email',
  //       pass: 'J4XvSjstwVgG93Cwmm'
  //   }
  });

module.exports = transporter