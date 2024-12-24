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

  openModal('userModal');
  
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
        closeModal('userModal');
      })
      .catch(err => console.error('Error editing user:', err));
  };
}

// Delete User
function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user?')) {
    fetch(`/api/users/${id}`, { method: 'DELETE' })
      .then(() => {
        console.log(`Deleted user with ID: ${id}`);
        users = users.filter(user => user._id !== id);  // Remove from local array
        updateTable('usersTableBody', users, addUserToTable);
      })
      .catch(err => console.error('Error deleting user:', err));
  }
}

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

  fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newUser),
  })
    .then(response => response.json())
    .then(data => {
      users.push(data);  // Add new user to the users array
      updateTable('usersTableBody', users, addUserToTable);
      closeModal('userModal');
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
