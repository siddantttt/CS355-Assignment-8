'use strict';

const $ = selector => document.querySelector(selector);

let authToken = '';
let currentUser = '';

function showError(msg) {
  $('#error').innerText = msg;
}

function clearInputs() {
  document.querySelectorAll('input').forEach(i => i.value = '');
}

function switchScreen(show) {
  ['loginScreen', 'registerScreen', 'homeScreen'].forEach(id => {
    $(`#${id}`).classList.add('hidden');
  });
  $(`#${show}`).classList.remove('hidden');
  showError('');
  clearInputs();
}

// Switch buttons
$('#loginLink').onclick = () => switchScreen('loginScreen');
$('#registerLink').onclick = () => switchScreen('registerScreen');
$('#logoutBtn').onclick = () => {
  fetch('/users/logout', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username: currentUser })
  }).then(() => {
    authToken = '';
    currentUser = '';
    switchScreen('loginScreen');
  });
};

// Login
$('#loginBtn').onclick = () => {
  const data = {
    username: $('#loginUsername').value,
    password: $('#loginPassword').value
  };
  if (!data.username || !data.password) return showError('Fill all fields.');

  fetch('/users/auth', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  }).then(res => res.json())
    .then(doc => {
      if (doc.error) return showError(doc.error);
      authToken = doc.authenticationToken;
      currentUser = doc.username;
      showHome(doc);
    }).catch(err => showError('Error: ' + err));
};

// Register
$('#registerBtn').onclick = () => {
  const data = {
    username: $('#registerUsername').value,
    password: $('#registerPassword').value,
    name: $('#registerName').value,
    email: $('#registerEmail').value
  };
  if (!data.username || !data.password || !data.name || !data.email)
    return showError('All fields required.');

  fetch('/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  }).then(res => res.json())
    .then(doc => {
      if (doc.error) return showError(doc.error);
      authToken = doc.authenticationToken;
      currentUser = doc.username;
      showHome(doc);
    }).catch(err => showError('Error: ' + err));
};

// Update
$('#updateBtn').onclick = () => {
  const data = {
    name: $('#updateName').value,
    email: $('#updateEmail').value
  };

  fetch(`/users/${currentUser}/${authToken}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  }).then(res => res.json())
    .then(doc => {
      if (doc.error) return showError(doc.error);
      alert("Info updated!");
    }).catch(err => showError('Error: ' + err));
};

// Delete
$('#deleteBtn').onclick = () => {
  if (!confirm("Are you sure you want to delete your profile?")) return;

  fetch(`/users/${currentUser}/${authToken}`, {
    method: 'DELETE'
  }).then(res => res.json())
    .then(doc => {
      if (doc.error) return showError(doc.error);
      authToken = '';
      currentUser = '';
      switchScreen('loginScreen');
    }).catch(err => showError('Error: ' + err));
};

function showHome(doc) {
  $('#name').innerText = doc.name;
  $('#username').innerText = doc.username;
  $('#updateName').value = doc.name;
  $('#updateEmail').value = doc.email;
  switchScreen('homeScreen');
  loadUsers();
}

function loadUsers() {
  fetch('/users')
    .then(res => res.json())
    .then(users => {
      $('#userlist').innerHTML = '';
      users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = `${u.username} (${u.email})`;
        $('#userlist').appendChild(li);
      });
    });
}

// Start on login screen
switchScreen('loginScreen');
