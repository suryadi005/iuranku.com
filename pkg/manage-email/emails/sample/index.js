const EmailTemplates = require('swig-email-templates');
const transporter = require('../../transporter')
const path = require('path')

function sendSampleEmail(context,onSuccess,onError) {
    
    var templates = new EmailTemplates();

     
    templates.render(path.join(__dirname, 'meatball-sandwich.html'), context, async function(err, html, text, subject) {
     
      // Send email
      console.log(html)
      try {
          if (err) throw err
          await transporter.sendMail({
              from: 'universe@iuranku.com',
              to: 'suryadi.skom05@gmail.com',
              subject: 'test',
              html: html,
          });
          onSuccess()
      } catch(e) {
          onError(e)
      }
     
    });
}

module.exports = sendSampleEmail