/**
 * Email Templates for Appointment Notifications
 * Professional, responsive HTML emails
 */

// Base email styles
const emailStyles = `
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    margin: 0; 
    padding: 0; 
    background-color: #f5f5f5;
  }
  .email-container { 
    max-width: 600px; 
    margin: 0 auto; 
    background: #ffffff; 
    border-radius: 12px; 
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .email-header { 
    background: linear-gradient(135deg, #BF4E4E, #D46A6A); 
    color: white; 
    padding: 40px 30px; 
    text-align: center; 
  }
  .email-header h1 { 
    margin: 0; 
    font-size: 28px; 
    font-weight: 700; 
  }
  .email-body { 
    padding: 40px 30px; 
  }
  .appointment-card {
    background: #f9f9f9;
    border-left: 4px solid #BF4E4E;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
  }
  .appointment-card h3 {
    margin-top: 0;
    color: #BF4E4E;
    font-size: 18px;
  }
  .info-row {
    margin: 12px 0;
    display: flex;
    align-items: flex-start;
  }
  .info-label {
    font-weight: 600;
    color: #666;
    min-width: 120px;
  }
  .info-value {
    color: #333;
  }
  .button {
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, #BF4E4E, #D46A6A);
    color: white !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 20px 0;
    text-align: center;
  }
  .email-footer {
    background: #f9f9f9;
    padding: 30px;
    text-align: center;
    color: #666;
    font-size: 14px;
    border-top: 1px solid #e0e0e0;
  }
  .divider {
    height: 1px;
    background: #e0e0e0;
    margin: 30px 0;
  }
  .highlight {
    color: #BF4E4E;
    font-weight: 600;
  }
`;

/**
 * Format date for emails
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Appointment Confirmation Email
 */
export function getAppointmentConfirmationEmail(appointment, doctor = null) {
  const doctorName = appointment.doctorName || (doctor ? doctor.name : 'Our medical team');
  const formattedDate = formatDate(appointment.appointmentDate);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${emailStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>✅ Appointment Confirmed</h1>
    </div>
    
    <div class="email-body">
      <p>Dear <strong>${appointment.patientName}</strong>,</p>
      
      <p>Great news! Your appointment has been <span class="highlight">confirmed</span>.</p>
      
      <div class="appointment-card">
        <h3>📅 Appointment Details</h3>
        
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Time:</span>
          <span class="info-value">${appointment.appointmentTime}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Doctor:</span>
          <span class="info-value">Dr. ${doctorName}</span>
        </div>
        
        ${appointment.reason ? `
        <div class="info-row">
          <span class="info-label">Reason:</span>
          <span class="info-value">${appointment.reason}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="divider"></div>
      
      <h3>📋 What to Bring:</h3>
      <ul>
        <li>Valid ID or insurance card</li>
        <li>Any previous medical records (if applicable)</li>
        <li>List of current medications</li>
        <li>Questions or concerns you'd like to discuss</li>
      </ul>
      
      <h3>⏰ Please Arrive:</h3>
      <p>Please arrive <strong>15 minutes early</strong> to complete any necessary paperwork.</p>
      
      <div class="divider"></div>
      
      <p><strong>Need to reschedule or cancel?</strong></p>
      <p>Please contact us at least 24 hours in advance:</p>
      <p>📞 Phone: (555) 123-4567<br>
      📧 Email: appointments@clinic.com</p>
    </div>
    
    <div class="email-footer">
      <p><strong>Clinic Name</strong></p>
      <p>123 Medical Center Drive, Suite 100<br>
      City, State 12345</p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        This is an automated confirmation email. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Appointment Cancellation Email
 */
export function getAppointmentCancellationEmail(appointment, doctor = null) {
  const doctorName = appointment.doctorName || (doctor ? doctor.name : 'Our medical team');
  const formattedDate = formatDate(appointment.appointmentDate);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${emailStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, #dc3545, #c82333);">
      <h1>❌ Appointment Cancelled</h1>
    </div>
    
    <div class="email-body">
      <p>Dear <strong>${appointment.patientName}</strong>,</p>
      
      <p>This is to inform you that your appointment has been <span class="highlight" style="color: #dc3545;">cancelled</span>.</p>
      
      <div class="appointment-card" style="border-left-color: #dc3545;">
        <h3 style="color: #dc3545;">📅 Cancelled Appointment</h3>
        
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Time:</span>
          <span class="info-value">${appointment.appointmentTime}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Doctor:</span>
          <span class="info-value">Dr. ${doctorName}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <h3>📞 Need to Reschedule?</h3>
      <p>We apologize for any inconvenience. If you would like to schedule a new appointment, please contact us:</p>
      
      <p>
        📞 <strong>Phone:</strong> (555) 123-4567<br>
        📧 <strong>Email:</strong> appointments@clinic.com<br>
        🌐 <strong>Website:</strong> Visit our online booking system
      </p>
      
      <p>Our team is here to help you find a new time that works for you.</p>
    </div>
    
    <div class="email-footer">
      <p><strong>Clinic Name</strong></p>
      <p>123 Medical Center Drive, Suite 100<br>
      City, State 12345</p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        This is an automated notification email. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Appointment Completed Email (Thank You)
 */
export function getAppointmentCompletedEmail(appointment, doctor = null) {
  const doctorName = appointment.doctorName || (doctor ? doctor.name : 'our medical team');
  const formattedDate = formatDate(appointment.appointmentDate);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${emailStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, #28a745, #218838);">
      <h1>🙏 Thank You for Your Visit</h1>
    </div>
    
    <div class="email-body">
      <p>Dear <strong>${appointment.patientName}</strong>,</p>
      
      <p>Thank you for visiting our clinic on <strong>${formattedDate}</strong>. We hope your appointment with Dr. ${doctorName} was helpful.</p>
      
      <div class="divider"></div>
      
      <h3>💊 Follow-Up Care:</h3>
      <ul>
        <li>Follow any instructions provided during your visit</li>
        <li>Take medications as prescribed</li>
        <li>Schedule any recommended follow-up appointments</li>
        <li>Contact us if you have any questions or concerns</li>
      </ul>
      
      <h3>📝 Your Feedback Matters:</h3>
      <p>We would love to hear about your experience. Your feedback helps us improve our services.</p>
      
      <div class="divider"></div>
      
      <h3>📞 Questions or Concerns?</h3>
      <p>If you have any questions about your visit or need to speak with our medical team:</p>
      
      <p>
        📞 <strong>Phone:</strong> (555) 123-4567<br>
        📧 <strong>Email:</strong> care@clinic.com<br>
        🌐 <strong>Patient Portal:</strong> Access your records online
      </p>
      
      <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0;"><strong>🏥 We're Here for You</strong></p>
        <p style="margin: 10px 0 0 0;">Your health and well-being are our top priorities. Don't hesitate to reach out if you need anything.</p>
      </div>
      
      <p style="margin-top: 30px;">Thank you for choosing our clinic for your healthcare needs.</p>
      <p><strong>Wishing you good health,</strong><br>The Medical Team</p>
    </div>
    
    <div class="email-footer">
      <p><strong>Clinic Name</strong></p>
      <p>123 Medical Center Drive, Suite 100<br>
      City, State 12345</p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        This is an automated thank you email. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

