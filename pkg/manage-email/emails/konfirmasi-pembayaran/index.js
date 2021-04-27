const EmailTemplates = require('swig-email-templates');
const transporter = require('../../transporter')
const path = require('path')
const nodemailer = require('nodemailer');


function sendKonfirmasiEmail(context,onSuccess,onError) {
    
    var templates = new EmailTemplates();
    context.homeUrl = process.env.HOME_URL
    templates.render(path.join(__dirname, 'konfirmasi-pembayaran-email.html'), context, async function(err, html, text, subject) {
      // Send email
      try {
          if (err) throw err
          const info =  await transporter.sendMail({
            from: 'universe@iuranku.com',
            to: context.order.email,
            subject: 'Pembayaranmu telah diterima ',
            html: html,
          });
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
          onSuccess()
      } catch(e) {
          onError(e)
      }
     
    });
}

module.exports = sendKonfirmasiEmail