// Store data for facilities
let facilities = [];

// Fetch Facilities and update the table dynamically
function fetchFacilities() {
  fetch('/api/facilities')
    .then(response => response.json())
    .then(data => {
      facilities = data;
      updateTable('facilitiesTableBody', facilities, addFacilityToTable);
    });
}

// Function to update the table with facility data
function addFacilityToTable(facility) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', facility._id);  // Set facility _id for reference
  row.innerHTML = `
    <td>${facility._id}</td>
    <td>${facility.facility_name}</td>
    <td>${facility.location}</td>
    <td>${facility.operation_time.open} - ${facility.operation_time.close}</td>
    <td>${facility.booking_time_slots.map(slot => `${slot.start_time} - ${slot.end_time}: ${slot.status}`).join(', ')}</td>
    <td>${facility.status}</td>
    <td>
      <button class="btn btn-edit" onclick="editFacility('${facility._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteFacility('${facility._id}')">Delete</button>
    </td>
  `;
  return row;
}

// Function to delete facility
function deleteFacility(id) {
  if (confirm('Are you sure you want to delete this facility?')) {
    fetch(`/api/facilities/${id}`, {
      method: 'DELETE'
    }).then(() => {
      facilities = facilities.filter(facility => facility._id !== id);
      updateTable('facilitiesTableBody', facilities, addFacilityToTable);
    });
  }
}

// Call fetchFacilities when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchFacilities();
});

// Utility function to update table content
function updateTable(tableId, items, rowCreator) {
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = ''; // Clear existing rows
  items.forEach(item => {
    tbody.appendChild(rowCreator(item));
  });
}
