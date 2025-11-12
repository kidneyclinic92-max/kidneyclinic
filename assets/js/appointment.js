const API_BASE = 'http://localhost:3001';

let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;
let doctors = [];

// Load doctors for the dropdown
async function loadDoctors() {
  try {
    const response = await fetch(`${API_BASE}/api/doctors`);
    doctors = await response.json();
    
    const select = document.getElementById('doctor-select');
    doctors.forEach(doctor => {
      const option = document.createElement('option');
      option.value = doctor.id;
      option.textContent = `Dr. ${doctor.name} - ${doctor.title}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load doctors:', error);
  }
}

// Render calendar
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Update month display
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('current-month').textContent = `${months[month]} ${year}`;
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day disabled';
    calendar.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    // Check if day is in the past
    if (dayDate < today) {
      dayElement.classList.add('past');
    }
    // Check if it's today
    else if (dayDate.getTime() === today.getTime()) {
      dayElement.classList.add('today');
    }
    // Check if Sunday (0) or Saturday (6) - clinic closed
    else if (dayDate.getDay() === 0 || dayDate.getDay() === 6) {
      dayElement.classList.add('disabled');
      dayElement.title = 'Clinic closed on weekends';
    }
    
    // Check if selected
    if (selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year) {
      dayElement.classList.add('selected');
    }
    
    // Add click handler
    if (!dayElement.classList.contains('past') && !dayElement.classList.contains('disabled')) {
      dayElement.addEventListener('click', () => selectDate(new Date(year, month, day)));
    }
    
    calendar.appendChild(dayElement);
  }
}

// Select date
function selectDate(date) {
  selectedDate = date;
  selectedTime = null;
  renderCalendar();
  loadTimeSlots(date);
  
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  document.getElementById('selected-date-display').textContent = dateStr;
}

// Load available time slots for selected date
async function loadTimeSlots(date) {
  const dateStr = date.toISOString().split('T')[0];
  const slotsContainer = document.getElementById('time-slots');
  slotsContainer.innerHTML = '<div style="grid-column:1/-1;text-align:center">Loading...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/api/appointments/available-slots/${dateStr}`);
    const data = await response.json();
    
    slotsContainer.innerHTML = '';
    
    if (data.availableSlots.length === 0) {
      slotsContainer.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted)">No available slots for this date</div>';
      return;
    }
    
    data.availableSlots.forEach(slot => {
      const slotElement = document.createElement('div');
      slotElement.className = 'time-slot';
      
      // Convert 24h to 12h format
      const [hours, minutes] = slot.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      slotElement.textContent = `${hour12}:${minutes} ${ampm}`;
      
      if (selectedTime === slot) {
        slotElement.classList.add('selected');
      }
      
      slotElement.addEventListener('click', () => selectTime(slot));
      slotsContainer.appendChild(slotElement);
    });
  } catch (error) {
    console.error('Failed to load time slots:', error);
    slotsContainer.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:red">Failed to load available slots</div>';
  }
}

// Select time
function selectTime(time) {
  selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('selected');
  });
  event.target.classList.add('selected');
}

// Calendar navigation
document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Handle form submission
document.getElementById('appointment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!selectedDate || !selectedTime) {
    showMessage('Please select a date and time for your appointment', 'error');
    return;
  }
  
  const formData = new FormData(e.target);
  const data = {
    patientName: formData.get('patientName'),
    patientEmail: formData.get('patientEmail'),
    patientPhone: formData.get('patientPhone'),
    doctorId: formData.get('doctorId') || null,
    doctorName: formData.get('doctorId') ? doctors.find(d => d.id === formData.get('doctorId'))?.name : null,
    appointmentDate: selectedDate.toISOString(),
    appointmentTime: selectedTime,
    reason: formData.get('reason') || null,
    status: 'pending'
  };
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    console.log('Submitting appointment:', data);
    
    const response = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      showMessage('✅ Appointment request submitted successfully! You will receive a confirmation email once approved.', 'success');
      e.target.reset();
      selectedDate = null;
      selectedTime = null;
      renderCalendar();
      document.getElementById('time-slots').innerHTML = '';
      document.getElementById('selected-date-display').textContent = 'Please select a date first';
    } else {
      showMessage('❌ Failed to submit appointment: ' + (result.error || result.message || 'Unknown error'), 'error');
      console.error('Server error:', result);
    }
  } catch (error) {
    console.error('Appointment submission error:', error);
    showMessage('❌ Failed to submit appointment. Server may be offline. Error: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Request Appointment';
  }
});

// Show message
function showMessage(message, type) {
  const container = document.getElementById('message-container');
  container.innerHTML = `<div class="${type}-message">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 8000);
  // Scroll to message
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize
loadDoctors();
renderCalendar();

