// Store data
let users = [];
let facilities = [];
let bookings = [];

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    const sectionId = link.getAttribute('data-section');
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
  });
});

// Modal Functions
function openModal(modalId, itemToEdit = null) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'block';
  
  if (itemToEdit) {
    fillModalForm(modalId, itemToEdit);
    modal.setAttribute('data-edit-id', itemToEdit._id);
  } else {
    modal.removeAttribute('data-edit-id');
    document.getElementById(modalId.replace('Modal', 'Form')).reset();
  }

  if (modalId === 'bookingModal') {
    updateBookingFormSelects(itemToEdit);
  }
}

function fillModalForm(modalId, item) {
  switch (modalId) {
    case 'userModal':
      document.getElementById('userName').value = item.name;
      document.getElementById('userEmail').value = item.email;
      document.getElementById('userRole').value = item.role;
      document.querySelector('#userModal .modal-header h2').textContent = 'Edit User';
      document.querySelector('#userModal button[type="submit"]').textContent = 'Save Changes';
      break;
    case 'facilityModal':
      document.getElementById('facilityName').value = item.name;
      document.getElementById('facilityLocation').value = item.location;
      document.getElementById('facilityStatus').value = item.status;
      document.querySelector('#facilityModal .modal-header h2').textContent = 'Edit Facility';
      document.querySelector('#facilityModal button[type="submit"]').textContent = 'Save Changes';
      break;
    case 'bookingModal':
      document.getElementById('bookingUser').value = item.user;
      document.getElementById('bookingFacility').value = item.facility;
      document.getElementById('bookingDate').value = item.date;
      document.getElementById('bookingStatus').value = item.status;
      document.querySelector('#bookingModal .modal-header h2').textContent = 'Edit Booking';
      document.querySelector('#bookingModal button[type="submit"]').textContent = 'Save Changes';
      break;
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'none';
  modal.removeAttribute('data-edit-id');
  document.getElementById(modalId.replace('Modal', 'Form')).reset();
  
  // Reset modal title and button text
  document.querySelector(`#${modalId} .modal-header h2`).textContent = `Add New ${modalId.replace('Modal', '')}`;
  document.querySelector(`#${modalId} button[type="submit"]`).textContent = 'Add';
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    closeModal(event.target.id);
  }
}

// Handle Form Submissions
function handleUserSubmit(event) {
  event.preventDefault();
  const modal = document.getElementById('userModal');
  const editId = modal.getAttribute('data-edit-id');
  
  const userData = {
    _id: editId ? editId : Date.now().toString(),  // Use timestamp for new _id
    name: document.getElementById('userName').value,
    email: document.getElementById('userEmail').value,
    role: document.getElementById('userRole').value
  };
  
  if (editId) {
    const index = users.findIndex(user => user._id === editId);
    users[index] = userData;
  } else {
    users.push(userData);
  }
  
  updateTable('usersTableBody', users, addUserToTable);
  closeModal('userModal');
}

function handleFacilitySubmit(event) {
  event.preventDefault();
  const modal = document.getElementById('facilityModal');
  const editId = modal.getAttribute('data-edit-id');
  
  const facilityData = {
    _id: editId ? editId : Date.now().toString(),
    name: document.getElementById('facilityName').value,
    location: document.getElementById('facilityLocation').value,
    status: document.getElementById('facilityStatus').value
  };
  
  if (editId) {
    const index = facilities.findIndex(facility => facility._id === editId);
    facilities[index] = facilityData;
  } else {
    facilities.push(facilityData);
  }
  
  updateTable('facilitiesTableBody', facilities, addFacilityToTable);
  closeModal('facilityModal');
}

function handleBookingSubmit(event) {
  event.preventDefault();
  const modal = document.getElementById('bookingModal');
  const editId = modal.getAttribute('data-edit-id');
  
  const bookingData = {
    _id: editId ? editId : Date.now().toString(),
    user: document.getElementById('bookingUser').value,
    facility: document.getElementById('bookingFacility').value,
    date: document.getElementById('bookingDate').value,
    status: document.getElementById('bookingStatus').value
  };
  
  if (editId) {
    const index = bookings.findIndex(booking => booking._id === editId);
    bookings[index] = bookingData;
  } else {
    bookings.push(bookingData);
  }
  
  updateTable('bookingsTableBody', bookings, addBookingToTable);
  closeModal('bookingModal');
}

// Table functions
function updateTable(tableId, items, rowCreator) {
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = '';
  items.forEach(item => {
    tbody.appendChild(rowCreator(item));
  });
}

function addUserToTable(user) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', user._id);
  row.innerHTML = `
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>${user.role}</td>
    <td>
      <button class="btn btn-edit" onclick="editUser('${user._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
    </td>
  `;
  return row;
}

function addFacilityToTable(facility) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', facility._id);
  row.innerHTML = `
    <td>${facility.name}</td>
    <td>${facility.location}</td>
    <td>${facility.status}</td>
    <td>
      <button class="btn btn-edit" onclick="editFacility('${facility._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteFacility('${facility._id}')">Delete</button>
    </td>
  `;
  return row;
}

function addBookingToTable(booking) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', booking._id);
  row.innerHTML = `
    <td>${booking.user}</td>
    <td>${booking.facility}</td>
    <td>${booking.date}</td>
    <td>${booking.status}</td>
    <td>
      <button class="btn btn-edit" onclick="editBooking('${booking._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteBooking('${booking._id}')">Delete</button>
    </td>
  `;
  return row;
}

function editUser(id) {
  const user = users.find(u => u._id === id);
  if (user) {
    openModal('userModal', user);
  }
}

function editFacility(id) {
  const facility = facilities.find(f => f._id === id);
  if (facility) {
    openModal('facilityModal', facility);
  }
}

function editBooking(id) {
  const booking = bookings.find(b => b._id === id);
  if (booking) {
    openModal('bookingModal', booking);
  }
}

function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user?')) {
    users = users.filter(user => user._id !== id);
    updateTable('usersTableBody', users, addUserToTable);
  }
}

function deleteFacility(id) {
  if (confirm('Are you sure you want to delete this facility?')) {
    facilities = facilities.filter(facility => facility._id !== id);
    updateTable('facilitiesTableBody', facilities, addFacilityToTable);
  }
}

function deleteBooking(id) {
  if (confirm('Are you sure you want to delete this booking?')) {
    bookings = bookings.filter(booking => booking._id !== id);
    updateTable('bookingsTableBody', bookings, addBookingToTable);
  }
}

// Search functions
document.querySelectorAll('.search-bar').forEach(searchBar => {
  searchBar.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const section = this.closest('.section');
    const tableBody = section.querySelector('tbody');
    const rows = tableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
});
