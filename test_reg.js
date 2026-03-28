fetch('http://localhost:3000/registration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: '51527fe5-01fb-48da-b6ff-5559fb5d1ca0',
    userId: '3'
  })
}).then(res => res.text()).then(t => console.log('Response:', t)).catch(console.error);
