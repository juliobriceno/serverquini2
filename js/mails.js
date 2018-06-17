module.exports = {
    SendEmail: function SendEmail(message, to, subject, callback)
    {

        var nodemailer = require('nodemailer');
        var smtpTransport = require('nodemailer-smtp-transport');

        var mailAccountUser = 'innovacionesjoka@gmail.com'
        var mailAccountPassword = 'joka2020**'

        var fromEmailAddress = 'innovacionesjoka@gmail.com'
        var toEmailAddress = to

        var transport = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            auth: {
                user: mailAccountUser,
                pass: mailAccountPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        }))

        var mail = {
            from: fromEmailAddress,
            to: toEmailAddress,
            subject: subject,
            text: "Hello!",
            html: message
        }

        transport.sendMail(mail, function (error, response) {
          transport.close();
          if (error){
            return callback(false);
          }
          else{
            return callback(true);
          }
        });

    }
}
