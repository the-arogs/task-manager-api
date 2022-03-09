const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

 const sendWelcEmail = (email, name)=> {sgMail.send({
    to: email,
    
    subject: 'This is a test',
    text: `Welcome to the app, ${name}. Enjoy `
})}

const sendExitMail = (email, name) => {
    sgMail.send({
        to: email,
        
        subject: 'Goodbye',
        text: `Just before you go ${name}, please tell us more`

    })
}



module.exports = {
    sendWelcEmail,
    sendExitMail
}