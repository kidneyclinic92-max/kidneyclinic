import nodemailer from 'nodemailer';
import { getAppointmentConfirmationEmail, getAppointmentCancellationEmail, getAppointmentCompletedEmail } from './email-templates.js';

// Email configuration
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false  // Allow self-signed certificates (for development)
  }
};

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS in .env file.');
      return null;
    }
    
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('✅ Email service initialized with:', EMAIL_CONFIG.auth.user);
  }
  return transporter;
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation(appointment, doctor = null) {
  const transport = getTransporter();
  if (!transport) {
    console.log('📧 Email skipped (not configured):', appointment.patientEmail);
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const emailHtml = getAppointmentConfirmationEmail(appointment, doctor);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || EMAIL_CONFIG.auth.user,
      to: appointment.patientEmail,
      subject: '✅ Appointment Confirmed - Clinic',
      html: emailHtml
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to:', appointment.patientEmail);
    console.log('   Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send appointment cancellation email
 */
export async function sendAppointmentCancellation(appointment, doctor = null) {
  const transport = getTransporter();
  if (!transport) {
    console.log('📧 Email skipped (not configured):', appointment.patientEmail);
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const emailHtml = getAppointmentCancellationEmail(appointment, doctor);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || EMAIL_CONFIG.auth.user,
      to: appointment.patientEmail,
      subject: '❌ Appointment Cancelled - Clinic',
      html: emailHtml
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Cancellation email sent to:', appointment.patientEmail);
    console.log('   Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send cancellation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send appointment completed email (thank you)
 */
export async function sendAppointmentCompleted(appointment, doctor = null) {
  const transport = getTransporter();
  if (!transport) {
    console.log('📧 Email skipped (not configured):', appointment.patientEmail);
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const emailHtml = getAppointmentCompletedEmail(appointment, doctor);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || EMAIL_CONFIG.auth.user,
      to: appointment.patientEmail,
      subject: '🙏 Thank You for Your Visit - Clinic',
      html: emailHtml
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Thank you email sent to:', appointment.patientEmail);
    console.log('   Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send thank you email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection() {
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: 'Email not configured' };
  }

  try {
    await transport.verify();
    console.log('✅ Email connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Email connection failed:', error);
    return { success: false, error: error.message };
  }
}

