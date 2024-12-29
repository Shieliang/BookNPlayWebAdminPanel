// Store data for bookings
let bookings = [];

// Fetch bookings and update the table dynamically
function fetchBookings() {
  fetch('/api/bookings')
    .then(response => response.json())
    .then(data => {
      bookings = data;
      updateTable('bookingsTableBody', bookings, addBookingToTable);
    })
    .catch(err => console.error('Error fetching bookings:', err));
}

// Update table with filtered bookings (for search)
function updateTable(tableId, items, rowCreator) {
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = ''; // Clear existing rows
  items.forEach(item => {
    tbody.appendChild(rowCreator(item));
  });
}

// Add booking to the table (helper function)
function addBookingToTable(booking) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', booking._id);  // Set booking _id for reference
  row.innerHTML = `
    <td>${booking._id}</td>
    <td>${booking.facility_id}</td>
    <td>${booking.facility_name}</td>
    <td>${booking.time}</td>
    <td>${booking.date}</td>
    <td>${booking.user_id}</td>
    <td>${booking.user_name}</td>
    <td>${booking.status}</td>
    <td>
      <button class="btn btn-edit" onclick="editBooking('${booking._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteBooking('${booking._id}')">Delete</button>
    </td>
  `;
  return row;
}

// Edit booking (pre-fill the form with existing data)
function editBooking(id) {
  const booking = bookings.find(booking => booking._id === id);
  
  // Pre-fill the form with booking data
  document.getElementById('editBookingId').value = booking._id;
  document.getElementById('editBookingUser').value = booking.user_id;
  document.getElementById('editBookingFacility').value = booking.facility_id;
  document.getElementById('editBookingTime').value = booking.time;
  document.getElementById('editBookingDate').value = booking.date;
  document.getElementById('editBookingStatus').value = booking.status;

  openModal('EditBookingModal');
}

// Handle Add or Edit Booking Submit
function handleBookingSubmit(event, mode) {
  event.preventDefault(); // Prevent default form submission

  let bookingData = {};
  if (mode === 'add') {
    // Add booking logic
    bookingData = {
      user_id: document.getElementById('bookingUser').value,
      facility_id: document.getElementById('bookingFacility').value,
      time: document.getElementById('bookingTime').value,
      date: document.getElementById('bookingDate').value,
      status: document.getElementById('bookingStatus').value,
    };

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })
      .then(response => response.json())
      .then(data => {
        bookings.push(data); // Add new booking to local array
        updateTable('bookingsTableBody', bookings, addBookingToTable); // Update the table
        closeModal('AddBookingModal');
      })
      .catch(err => console.error('Error adding booking:', err));

  } else if (mode === 'edit') {
    // Edit booking logic
    const updatedBooking = {
      _id: document.getElementById('editBookingId').value,
      user_id: document.getElementById('editBookingUser').value,
      facility_id: document.getElementById('editBookingFacility').value,
      time: document.getElementById('editBookingTime').value,
      date: document.getElementById('editBookingDate').value,
      status: document.getElementById('editBookingStatus').value,
    };

    fetch(`/api/bookings/${updatedBooking._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBooking)
    })
      .then(() => {
        const index = bookings.findIndex(booking => booking._id === updatedBooking._id);
        bookings[index] = updatedBooking;
        updateTable('bookingsTableBody', bookings, addBookingToTable); // Update the table
        closeModal('EditBookingModal');
      })
      .catch(err => console.error('Error editing booking:', err));
  }
}

// Delete booking
let bookingToDelete = null;

function deleteBooking(id) {
  bookingToDelete = id;
  openModal('DeleteBookingModal');
}

document.getElementById('confirmDeleteBookingBtn').addEventListener('click', function () {
  if (bookingToDelete !== null) {
    fetch(`/api/bookings/${bookingToDelete}`, { method: 'DELETE' })
      .then(() => {
        console.log(`Deleted booking with ID: ${bookingToDelete}`);
        bookings = bookings.filter(booking => booking._id !== bookingToDelete); // Remove from local array
        updateTable('bookingsTableBody', bookings, addBookingToTable); // Update table
        closeModal('DeleteBookingModal');
        bookingToDelete = null;
      })
      .catch(err => console.error('Error deleting booking:', err));
  }
});

// Function to open Add Booking Modal (clear fields)
function openAddBookingModal() {
  document.getElementById('bookingUser').value = '';
  document.getElementById('bookingFacility').value = '';
  document.getElementById('bookingTime').value = '';
  document.getElementById('bookingDate').value = '';
  document.getElementById('bookingStatus').value = 'pending';

  openModal('AddBookingModal');
}

// Search bookings
function searchBookings() {
  const searchTerm = document.querySelector('.search-bar').value.toLowerCase();
  const filteredBookings = bookings.filter(booking =>
    booking.user_id.toLowerCase().includes(searchTerm) ||
    booking._id.toLowerCase().includes(searchTerm) ||
    booking.facility_name.toLowerCase().includes(searchTerm)
  );
  updateTable('bookingsTableBody', filteredBookings, addBookingToTable);
}

// Add event listener for search input
document.querySelector('.search-bar').addEventListener('input', searchBookings);

// Fetch bookings when the page loads
document.addEventListener('DOMContentLoaded', function () {
  fetchBookings();
});

// Open Modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

// Close Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}
