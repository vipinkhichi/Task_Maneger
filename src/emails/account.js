const sgMail = require('@sendgrid/mail');

const sendgridAPIKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridAPIKey);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'kumarvipin2502@gmail.com',
        subject: 'Thanks for joining In!',
        text: `Welcome to the app, ${name}. let me know how you get along with the app.`
        //html element also can set
    })
}
 
const sendCancelationEmail = (email, name) =>{
    sgMail.send({
        to: email,
        from: 'kumarvipin2502@gmail.com',
        Subject: 'Sorry to see You go!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon.`
    })
} 


module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}