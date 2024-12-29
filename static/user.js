// Store data for users
let users = [];

// Fetch Users and update the table dynamically
function fetchUsers() {
  fetch('/api/users')
    .then(response => response.json())
    .then(data => {
      users = data;
      updateTable('usersTableBody', users, addUserToTable);
    });
}

// Function to update the table with user data
function addUserToTable(user) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', user._id);  // Set user _id for reference
  row.innerHTML = `
    <td>${user._id}</td>
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>*****</td>  <!-- Don't show password, just mask it -->
    <td>
      <button class="btn btn-edit" onclick="editUser('${user._id}')">Edit</button>
      <button class="btn btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
    </td>
  `;
  return row;
}

// Edit User
function editUser(id) {
  const user = users.find(user => user._id === id);
  document.getElementById('userId').value = user._id;
  document.getElementById('userName').value = user.name;
  document.getElementById('userEmail').value = user.email;

  openModal('EditUserModal');
  
  // After user updates and submits, send PUT request
  document.getElementById('userForm').onsubmit = function(event) {
    event.preventDefault();
    const updatedUser = {
      _id: user._id,
      name: document.getElementById('userName').value,
      email: document.getElementById('userEmail').value,
    };
    
    fetch(`/api/users/${user._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser),
    })
      .then(() => {
        user.name = updatedUser.name;  // Update local array
        user.email = updatedUser.email;
        updateTable('usersTableBody', users, addUserToTable);
        closeModal('EditUserModal');
      })
      .catch(err => console.error('Error editing user:', err));
  };
}

// Delete User
// Variable to store the ID of the user to be deleted
let userToDelete = null;

// Open the confirmation modal
function deleteUser(id) {
  userToDelete = id;  // Store the ID of the user to be deleted
  openModal('DeleteUserModal');  // Show the confirmation modal
}

// Confirm deletion
document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
  if (userToDelete !== null) {
    fetch(`/api/users/${userToDelete}`, { method: 'DELETE' })
      .then(() => {
        console.log(`Deleted user with ID: ${userToDelete}`);
        users = users.filter(user => user._id !== userToDelete);  // Remove from local array
        updateTable('usersTableBody', users, addUserToTable);  // Update the table
        closeModal('DeleteUserModal');  // Close the modal after deletion
        userToDelete = null;  // Reset the variable
      })
      .catch(err => console.error('Error deleting user:', err));
  }
});

// Add User
function handleUserSubmit(event) {
  event.preventDefault();  // Prevent form from submitting the traditional way

  const userId = document.getElementById('userId').value;
  const userName = document.getElementById('userName').value;
  const userEmail = document.getElementById('userEmail').value;

  const newUser = {
    _id: userId,
    name: userName,
    email: userEmail
  };

  // Send a POST request to the server to add the user to the database
  fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newUser),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);  // Show error if email already exists
      } else {
        users.push(data);  // Add the new user to the local users array
        updateTable('usersTableBody', users, addUserToTable);  // Update the table with the new user
        closeModal('AddUserModal');  // Close the modal
      }
    })
    .catch(err => console.error('Error adding user:', err));
}

// Search Users
function searchUsers() {
  const searchTerm = document.querySelector('.search-bar').value.toLowerCase();
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm) || 
    user.email.toLowerCase().includes(searchTerm)
  );
  updateTable('usersTableBody', filteredUsers, addUserToTable);
}

// Add event listener for search input
document.querySelector('.search-bar').addEventListener('input', searchUsers);

// Call fetchUsers when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
  fetchUsers();
});

// Function to open the modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';  // Show the modal
  }
}

// Function to close the modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';  // Hide the modal
  }
}
