// Store data for bookings
let bookings = [];

// Fetch Bookings and update the table dynamically
function fetchBookings() {
  fetch('/api/bookings')
    .then(response => response.json())
    .then(data => {
      bookings = data;
      updateTable('bookingsTableBody', bookings, addBookingToTable);
    });
}

// Function to update the table with booking data
function addBookingToTable(booking) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', booking._id);  // Set booking _id for reference
  row.innerHTML = `
    <td>${booking.bookingId}</td>
    <td>${booking.facilityId}</td>
    <td>${booking.facilityName}</td>
    <td>${booking.time}</td>
    <td>${booking.date}</td>
    <td>${booking.userId}</td>
    <td>${booking.userName}</td>
    <td>${booking.status}</td>
    <td>
      <button class="btn btn-edit" onclick="editBooking('${booking._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteBooking('${booking._id}')">Delete</button>
    </td>
  `;
  return row;
}

// Function to delete booking
function deleteBooking(id) {
  if (confirm('Are you sure you want to delete this booking?')) {
    fetch(`/api/bookings/${id}`, {
      method: 'DELETE'
    }).then(() => {
      bookings = bookings.filter(booking => booking._id !== id);
      updateTable('bookingsTableBody', bookings, addBookingToTable);
    });
  }
}

// Call fetchBookings when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchBookings();
});

// Utility function to update table content
function updateTable(tableId, items, rowCreator) {
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = ''; // Clear existing rows
  items.forEach(item => {
    tbody.appendChild(rowCreator(item));
  });
}
