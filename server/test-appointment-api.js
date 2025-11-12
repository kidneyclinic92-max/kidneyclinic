// Quick test for appointment API
async function testAppointmentAPI() {
  const API_BASE = 'http://localhost:3001';
  
  console.log('🧪 Testing Appointment API...\n');
  
  // Test 1: Check if server is running
  console.log('1️⃣ Checking server connection...');
  try {
    const healthCheck = await fetch(`${API_BASE}/health`);
    const health = await healthCheck.json();
    console.log('   ✅ Server is running:', health);
  } catch (error) {
    console.error('   ❌ Server is not running!');
    console.error('   Please start the server with: cd server && npm run dev');
    process.exit(1);
  }
  
  // Test 2: Try to create an appointment
  console.log('\n2️⃣ Testing appointment creation...');
  const testAppointment = {
    patientName: 'Test Patient',
    patientEmail: 'test@example.com',
    patientPhone: '555-1234',
    doctorId: null,
    doctorName: null,
    appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    appointmentTime: '10:00',
    reason: 'Test appointment',
    status: 'pending'
  };
  
  try {
    const response = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAppointment)
    });
    
    console.log('   Response status:', response.status);
    
    const result = await response.json();
    console.log('   Response data:', result);
    
    if (response.ok) {
      console.log('   ✅ Appointment created successfully!');
      console.log('   Appointment ID:', result.id);
      
      // Test 3: Retrieve the appointment
      console.log('\n3️⃣ Testing appointment retrieval...');
      const getResponse = await fetch(`${API_BASE}/api/appointments/${result.id}`);
      const appointment = await getResponse.json();
      console.log('   ✅ Retrieved appointment:', appointment);
      
      // Test 4: Get all appointments
      console.log('\n4️⃣ Testing list all appointments...');
      const listResponse = await fetch(`${API_BASE}/api/appointments`);
      const appointments = await listResponse.json();
      console.log('   ✅ Total appointments:', appointments.length);
      
      // Clean up - delete test appointment
      console.log('\n5️⃣ Cleaning up test data...');
      await fetch(`${API_BASE}/api/appointments/${result.id}`, { method: 'DELETE' });
      console.log('   ✅ Test appointment deleted');
      
    } else {
      console.error('   ❌ Failed to create appointment');
      console.error('   Error:', result);
      
      if (result.error && result.error.includes('required')) {
        console.log('\n🔧 Fix: The Appointment model requires certain fields.');
        console.log('   Make sure the backend server has been restarted after adding the Appointment model.');
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Appointment API Test Complete');
  console.log('='.repeat(50));
}

testAppointmentAPI();

