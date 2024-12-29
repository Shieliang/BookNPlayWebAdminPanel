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

// Update Table with filtered facilities (for search)
function updateTable(tableId, items, rowCreator) {
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = ''; // Clear existing rows
  items.forEach(item => {
    tbody.appendChild(rowCreator(item));
  });
}

// Add Facility to Table (helper function)
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

// Edit Facility (pre-fill the form with existing data)
function editFacility(id) {
  const facility = facilities.find(facility => facility._id === id);
  
  // Pre-fill the form with facility data
  document.getElementById('editFacilityId').value = facility._id;
  document.getElementById('editFacilityName').value = facility.facility_name;
  document.getElementById('editFacilityLocation').value = facility.location;
  document.getElementById('editFacilityStatus').value = facility.status;

  openModal('EditFacilityModal'); // Open the modal for editing
}

// Handle Add or Edit Facility Submit
function handleFacilitySubmit(event, mode) {
  event.preventDefault();

  let facilityData = {};
  if (mode === 'add') {
    // Add facility logic
    facilityData = {
      facility_name: document.getElementById('addFacilityName').value,
      location: document.getElementById('addFacilityLocation').value,
      status: document.getElementById('addFacilityStatus').value
    };

    fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facilityData)
    })
      .then(response => response.json())
      .then(data => {
        facilities.push(data); // Add new facility to the local array
        updateTable('facilitiesTableBody', facilities, addFacilityToTable); // Update the table
        closeModal('AddFacilityModal');
      })
      .catch(err => console.error('Error adding facility:', err));
  } else if (mode === 'edit') {
    // Edit facility logic
    const updatedFacility = {
      _id: document.getElementById('editFacilityId').value,
      facility_name: document.getElementById('editFacilityName').value,
      location: document.getElementById('editFacilityLocation').value,
      status: document.getElementById('editFacilityStatus').value
    };

    fetch(`/api/facilities/${updatedFacility._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFacility)
    })
      .then(() => {
        const index = facilities.findIndex(facility => facility._id === updatedFacility._id);
        facilities[index] = updatedFacility;
        updateTable('facilitiesTableBody', facilities, addFacilityToTable);
        closeModal('EditFacilityModal');
      })
      .catch(err => console.error('Error editing facility:', err));
  }
}

// Delete Facility
let facilityToDelete = null;

function deleteFacility(id) {
  facilityToDelete = id;  
  openModal('DeleteFacilityModal');  
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
  if (facilityToDelete !== null) {
    fetch(`/api/facilities/${facilityToDelete}`, { method: 'DELETE' })
      .then(() => {
        console.log(`Deleted facility with ID: ${facilityToDelete}`);
        facilities = facilities.filter(facility => facility._id !== facilityToDelete);  
        updateTable('facilitiesTableBody', facilities, addFacilityToTable);  
        closeModal('DeleteFacilityModal');  
        facilityToDelete = null;  
      })
      .catch(err => console.error('Error deleting facility:', err));
  }
});

// Function to open Add Facility Modal (clear fields)
function openAddFacilityModal() {
  // Reset fields for a new facility
  document.getElementById('addFacilityId').value = '';  // Ensure no ID is pre-filled
  document.getElementById('addFacilityName').value = '';
  document.getElementById('addFacilityLocation').value = '';
  document.getElementById('addFacilityStatus').value = 'active';  // Default to active

  openModal('AddFacilityModal'); // Open the modal
}

// Search Facilities
function searchFacilities() {
  const searchTerm = document.querySelector('.search-bar').value.toLowerCase();
  const filteredFacilities = facilities.filter(facility => 
    facility.facility_name.toLowerCase().includes(searchTerm) ||  
    facility._id.toLowerCase().includes(searchTerm)
  );
  updateTable('facilitiesTableBody', filteredFacilities, addFacilityToTable);
}

// Add event listener for search input
document.querySelector('.search-bar').addEventListener('input', searchFacilities);

// Fetch Facilities when the page loads
document.addEventListener('DOMContentLoaded', function () {
  fetchFacilities();
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