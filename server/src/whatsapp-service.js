/**
 * WhatsApp Business API Service
 * Uses Meta's WhatsApp Cloud API to send messages
 */

// WhatsApp Business API Configuration
const WHATSAPP_CONFIG = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  baseUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v21.0'}`
};

/**
 * Format phone number for WhatsApp (remove non-digits, add country code if missing)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If phone doesn't start with country code, assume it needs one
  // You may need to adjust this based on your default country code
  // For now, we'll return as-is and let the API handle validation
  return cleaned;
}

/**
 * Format appointment date and time for display
 */
function formatAppointmentDateTime(appointment) {
  const date = new Date(appointment.appointmentDate);
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = appointment.appointmentTime || 'TBD';
  return `${dateStr} at ${timeStr}`;
}

/**
 * Generate appointment confirmation message text
 */
function getAppointmentConfirmationMessage(appointment, doctor = null) {
  const dateTime = formatAppointmentDateTime(appointment);
  const doctorName = doctor ? doctor.name : (appointment.doctorName || 'Your assigned doctor');
  const doctorTitle = doctor ? doctor.title : '';
  
  let message = `✅ *Appointment Confirmed*\n\n`;
  message += `Dear ${appointment.patientName},\n\n`;
  message += `Your appointment has been confirmed!\n\n`;
  message += `*Appointment Details:*\n`;
  message += `📅 Date & Time: ${dateTime}\n`;
  message += `👨‍⚕️ Doctor: ${doctorName}${doctorTitle ? ` - ${doctorTitle}` : ''}\n`;
  
  if (appointment.reason) {
    message += `📋 Reason: ${appointment.reason}\n`;
  }
  
  message += `\n*Contact Information:*\n`;
  message += `📧 Email: ${appointment.patientEmail}\n`;
  message += `📱 Phone: ${appointment.patientPhone}\n`;
  
  message += `\nPlease arrive 15 minutes before your scheduled time.\n`;
  message += `If you need to reschedule or cancel, please contact us as soon as possible.\n\n`;
  message += `We look forward to seeing you!\n\n`;
  message += `Best regards,\nClinic Team`;
  
  return message;
}

/**
 * Generate appointment cancellation message text
 */
function getAppointmentCancellationMessage(appointment, doctor = null) {
  const dateTime = formatAppointmentDateTime(appointment);
  const doctorName = doctor ? doctor.name : (appointment.doctorName || 'Your assigned doctor');
  
  let message = `❌ *Appointment Cancelled*\n\n`;
  message += `Dear ${appointment.patientName},\n\n`;
  message += `Your appointment has been cancelled.\n\n`;
  message += `*Cancelled Appointment Details:*\n`;
  message += `📅 Date & Time: ${dateTime}\n`;
  message += `👨‍⚕️ Doctor: ${doctorName}\n`;
  
  if (appointment.notes) {
    message += `\n*Note:* ${appointment.notes}\n`;
  }
  
  message += `\nIf you need to reschedule, please contact us.\n\n`;
  message += `Best regards,\nClinic Team`;
  
  return message;
}

/**
 * Send WhatsApp message using Meta's Cloud API
 */
async function sendWhatsAppMessage(phoneNumber, messageText) {
  // Check if WhatsApp is configured
  if (!WHATSAPP_CONFIG.accessToken || !WHATSAPP_CONFIG.phoneNumberId) {
    console.log('📱 WhatsApp skipped (not configured):', phoneNumber);
    return { success: false, reason: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone) {
    console.error('❌ Invalid phone number:', phoneNumber);
    return { success: false, error: 'Invalid phone number' };
  }

  const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: false, // Set to true if you want to enable link previews
      body: messageText
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.messages && result.messages[0]) {
      console.log('✅ WhatsApp message sent to:', phoneNumber);
      console.log('   Message ID:', result.messages[0].id);
      return { 
        success: true, 
        messageId: result.messages[0].id,
        wamid: result.messages[0].id
      };
    } else {
      console.error('❌ Failed to send WhatsApp message:', result);
      return { 
        success: false, 
        error: result.error?.message || 'Unknown error',
        errorDetails: result.error
      };
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send appointment confirmation via WhatsApp
 */
export async function sendAppointmentConfirmationWhatsApp(appointment, doctor = null) {
  if (!appointment.patientPhone) {
    console.log('📱 WhatsApp skipped (no phone number):', appointment.patientEmail);
    return { success: false, reason: 'No phone number provided' };
  }

  const messageText = getAppointmentConfirmationMessage(appointment, doctor);
  return await sendWhatsAppMessage(appointment.patientPhone, messageText);
}

/**
 * Send appointment cancellation via WhatsApp
 */
export async function sendAppointmentCancellationWhatsApp(appointment, doctor = null) {
  if (!appointment.patientPhone) {
    console.log('📱 WhatsApp skipped (no phone number):', appointment.patientEmail);
    return { success: false, reason: 'No phone number provided' };
  }

  const messageText = getAppointmentCancellationMessage(appointment, doctor);
  return await sendWhatsAppMessage(appointment.patientPhone, messageText);
}

/**
 * Test WhatsApp connection
 */
export async function testWhatsAppConnection() {
  if (!WHATSAPP_CONFIG.accessToken || !WHATSAPP_CONFIG.phoneNumberId) {
    return { success: false, error: 'WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env file' };
  }

  try {
    // Test by fetching phone number info
    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.phoneNumberId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ WhatsApp connection verified successfully');
      return { 
        success: true, 
        phoneNumber: result.display_phone_number || 'N/A',
        verifiedName: result.verified_name || 'N/A'
      };
    } else {
      console.error('❌ WhatsApp connection failed:', result);
      return { 
        success: false, 
        error: result.error?.message || 'Connection failed',
        errorDetails: result.error
      };
    }
  } catch (error) {
    console.error('❌ Error testing WhatsApp connection:', error);
    return { success: false, error: error.message };
  }
}


