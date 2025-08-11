// Simple email notification utility
// In production, you would use a service like SendGrid, AWS SES, etc.

interface RecipientEmailData {
    recipientEmail: string;
    recipientName: string;
    accessCode: string;
    fileCount: number;
}

export async function sendRecipientNotificationEmail(data: RecipientEmailData): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
    const accessUrl = `${baseUrl}/access`;

    // In production, replace this with actual email sending logic
    console.log('=== EMAIL NOTIFICATION ===');
    console.log(`TO: ${data.recipientName} <${data.recipientEmail}>`);
    console.log('SUBJECT: You have received digital legacy files');
    console.log('BODY:');
    console.log(`Dear ${data.recipientName},`);
    console.log('');
    console.log('You have been designated to receive digital legacy files.');
    console.log(`Number of files available: ${data.fileCount}`);
    console.log('');
    console.log('To access your files, please visit:');
    console.log(accessUrl);
    console.log('');
    console.log('Your access code is:');
    console.log(`    ${data.accessCode}`);
    console.log('');
    console.log('You will need both your email address and this access code to log in.');
    console.log('');
    console.log('Important: Please save this access code. You will need it to access your files.');
    console.log('We recommend downloading all files as soon as possible.');
    console.log('');
    console.log('Best regards,');
    console.log('Corvo Digital Legacy System');
    console.log('========================');

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
}

// Email template for production use
export function getRecipientEmailHtml(data: RecipientEmailData): string {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
    const accessUrl = `${baseUrl}/access`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Digital Legacy Access</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e293b; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f8f9fa; padding: 30px; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .access-code { background-color: #e5e7eb; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 20px; text-align: center; margin: 20px 0; letter-spacing: 2px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Digital Legacy Access</h1>
        </div>
        <div class="content">
            <p>Dear ${data.recipientName},</p>
            
            <p>You have been designated to receive digital legacy files through the Corvo Digital Legacy System.</p>
            
            <p><strong>Number of files available:</strong> ${data.fileCount}</p>
            
            <p>To access your files:</p>
            
            <ol>
                <li>Visit the access portal:</li>
                <center>
                    <a href="${accessUrl}" class="button">Access Portal</a>
                </center>
                
                <li>Log in with:</li>
                <ul>
                    <li><strong>Email:</strong> ${data.recipientEmail}</li>
                    <li><strong>Access Code:</strong></li>
                </ul>
                
                <div class="access-code">
                    ${data.accessCode}
                </div>
            </ol>
            
            <div class="warning">
                <strong>Important:</strong>
                <ul>
                    <li>Save this email - you will need the access code to log in</li>
                    <li>Your access code is: <strong>${data.accessCode}</strong></li>
                    <li>Download all files as soon as possible</li>
                    <li>The files are encrypted and can only be accessed with your email and access code</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from Corvo Digital Legacy System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
}