/**
 * script.js
 * 10/29/2025
 * Ayra Babar
 * Kyle Revelo
 * Khalil Velasco
 */

let editingEntryId = null;

/* =========================================
   PROTECTED ROUTES: /gallery, /chat, /profile
========================================= */
document.addEventListener('DOMContentLoaded', () => {
  const protectedPaths = ['/gallery', '/chat', '/profile'];
  const currentPath = window.location.pathname;

  if (protectedPaths.includes(currentPath)) {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      // no token? send user back to login & display message
      localStorage.setItem('redirectMessage', 'true');
      window.location.href = '/login';
    } else {
      const protectedContent = document.getElementById('protected-content');
      if (protectedContent) {
        protectedContent.style.visibility = 'visible';
      }
    }
  }
});

/* =========================================
   PROFILE PICTURE PREVIEW
========================================= */
(function () {
  const uploadInput = document.getElementById('uploadInput');
  const profilePic = document.getElementById('profilePic');

  if (!uploadInput || !profilePic) return;

  uploadInput.addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      profilePic.src = e.target.result; // instant preview
    };
    reader.readAsDataURL(file);
  });
})();

/* =========================================
   SIGN UP
========================================= */
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(signupForm);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await res.json();
    const messageBox = document.getElementById('form-message-display');
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = '/gallery';
    } else {
      if (messageBox) {
        messageBox.textContent = data.message || 'sign up failed';
        messageBox.style.display = 'block';
      } else {
        alert(data.message || 'sign up failed');
      }
    }
  });
}

/* =========================================
   LOGIN
========================================= */
(function () {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = '/gallery';
      } else {
        alert(data.message || 'login failed');
      }
    } catch (err) {
      console.error('login error', err);
      alert('something went wrong logging in');
    }
  });
})();

/* =========================================
   REDIRECT MESSAGE (when bounced to /login)
========================================= */
(function () {
  const msgEl = document.getElementById('message');
  if (!msgEl) return;

  const showMessage = localStorage.getItem('redirectMessage');
  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get('from');

  if (showMessage || fromParam === 'profile') {
    msgEl.style.visibility = 'visible';
    localStorage.removeItem('redirectMessage');
  }
})();

/* =========================================
   LOG OUT + DELETE ACCOUNT
========================================= */
function logOut() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

async function deleteAccount() {
  const confirmation = window.confirm(
    'are you sure you want to delete your account? this will permanently delete it.'
  );

  if (!confirmation) return;

  const token = localStorage.getItem('token');
  if (!token) {
    localStorage.setItem('redirectMessage', 'true');
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('/api/account', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    if (!response.ok) {
      let msg = 'error in deleting account';
      try {
        const data = await response.json();
        if (data.message) msg = data.message;
      } catch (_) {}
      alert(msg);
      return;
    }

    localStorage.removeItem('token');
    window.location.href = '/';
  } catch (err) {
    console.error('error deleting account:', err);
    alert('something went wrong. please try again.');
  }
}

/* =========================================
   HOMEPAGE SCROLL ARROW
========================================= */
function moveDown() {
  window.scroll({
    top: 912,
    left: 0,
    behavior: 'smooth',
  });
}

/* =========================================
   DATE FORMATTING FOR ENTRIES
========================================= */
function formatEntryDate(dateValue) {
  if (!dateValue) return '';

  // already YYYY-MM-DD
  if (
    typeof dateValue === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    const [y, m, d] = dateValue.split('-');
    return `${m}/${d}/${y}`;
  }

  // otherwise handle ISO (take only YYYY-MM-DD)
  const iso = String(dateValue);
  const ymd = iso.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, d] = ymd.split('-');
    return `${m}/${d}/${y}`;
  }

  return '';
}

/* =========================================
   GALLERY PAGE: ENTRIES + POPUP + DEEP LINK
========================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const gallery = document.getElementById('gallery-grid');
  const entryPopup = document.getElementById('entry');
  const form = document.getElementById('entry-form');
  const cancelButton = document.getElementById('entry-cancel');
  const addButton = document.getElementById('gallery-button');

  // if there's no gallery grid, we're not on the gallery page
  if (!gallery) return;

  // gallery UI pieces should exist on the gallery page
  if (!entryPopup || !form || !cancelButton || !addButton) return;

  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') {
    localStorage.setItem('redirectMessage', 'true');
    window.location.href = '/login';
    return;
  }

  // --- handle "send to gallery" from chat page ---
  const hash = window.location.hash;
  const pendingImageUrl = localStorage.getItem('pendingImageUrl');

  if (hash === '#new-entry' && pendingImageUrl) {
    localStorage.removeItem('pendingImageUrl');

    editingEntryId = null;
    form.reset();
    entryPopup.classList.remove('hidden');

    if (form.elements.imageUrl) {
      form.elements.imageUrl.value = pendingImageUrl;
    }

    const saveBtn = form.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'save entry';

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '/gallery');
    }
  }
  // --- end "send to gallery" block ---

  // show popup for new entry
  addButton.addEventListener('click', () => {
    editingEntryId = null;
    form.reset();
    entryPopup.classList.remove('hidden');

    const saveBtn = form.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'save entry';
  });

  // hide popup
  cancelButton.addEventListener('click', () => {
    editingEntryId = null;
    form.reset();
    entryPopup.classList.add('hidden');

    const saveBtn = form.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'save entry';
  });

  // create / edit entry
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const title = formData.get('title');
    const bodyText = formData.get('bodyText');
    const imageUrl = formData.get('imageUrl');
    const location = formData.get('location');
    const entryDate = formData.get('entryDate');

    const url = editingEntryId
      ? `/api/entries/${editingEntryId}`
      : '/api/entries';
    const method = editingEntryId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ title, bodyText, imageUrl, location, entryDate }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            (editingEntryId ? 'error editing entry' : 'error saving entry')
        );
        return;
      }

      editingEntryId = null;
      form.reset();
      entryPopup.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      console.error('error saving/editing entry', err);
      alert('something went wrong saving the entry');
    }
  });

  // load entries
  try {
    const res = await fetch('/api/entries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
    });

    const data = await res.json();

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    if (!res.ok || !data.success) {
      alert(data.message || 'error loading entries');
      return;
    }

    const entries = data.entries || [];
    gallery.innerHTML = '';

    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.textContent =
        'no entries yet — click the magenta plus button to add one.';
      empty.classList.add('placeholder-text');
      gallery.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement('div');
      card.classList.add('gallery-entry');
      card.id = `entry-${entry.id}`;

      // --- actions (hover icons) ---
      const actions = document.createElement('div');
      actions.classList.add('entry-actions');

      const editButton = document.createElement('button');
      editButton.classList.add('edit-button');
      editButton.setAttribute('title', 'edit entry');
      editButton.innerHTML =
        '<img src="/images/edit-icon.png" alt="edit icon">';

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-button');
      deleteButton.setAttribute('title', 'delete entry');
      deleteButton.innerHTML =
        '<img src="/images/delete-icon.png" alt="delete icon">';

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);

      // --- content ---
      const titleEl = document.createElement('h3');
      titleEl.textContent = entry.title;

      const bodyEl = document.createElement('p');
      bodyEl.textContent = entry.bodyText;

      if (entry.imageUrl) {
        const img = document.createElement('img');
        img.src = entry.imageUrl;
        img.alt = entry.title || 'journal image';
        img.classList.add('gallery-image');
        card.appendChild(img);
      }

      const metaData = document.createElement('small');
      const formattedDate = formatEntryDate(entry.entryDate);
      metaData.innerHTML = `<span>${entry.location || ''}</span>${
        formattedDate ? ` • <span>${formattedDate}</span>` : ''
      }`.trim();

      if (entry.imageUrl) {
        card.classList.add('tall');
      } else {
        card.classList.add('text-only');
      }

      if ((entry.bodyText || '').length > 120) {
        card.classList.add('wide');
      }

      card.appendChild(actions);
      card.appendChild(titleEl);
      card.appendChild(bodyEl);
      card.appendChild(metaData);

      // EDIT click
      editButton.addEventListener('click', () => {
        editingEntryId = entry.id;

        entryPopup.classList.remove('hidden');

        form.elements.title.value = entry.title || '';
        form.elements.bodyText.value = entry.bodyText || '';
        form.elements.imageUrl.value = entry.imageUrl || '';
        form.elements.location.value = entry.location || '';
        form.elements.entryDate.value = entry.entryDate
          ? String(entry.entryDate).split('T')[0]
          : '';

        const saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.textContent = 'save changes';
      });

      // DELETE click
      deleteButton.addEventListener('click', async () => {
        const ok = window.confirm(
          'are you sure you want to delete this entry? this action cannot be undone.'
        );
        if (!ok) return;

        try {
          const deleteRes = await fetch(`/api/entries/${entry.id}`, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token },
          });

          const deleteData = await deleteRes.json();

          if (!deleteRes.ok || !deleteData.success) {
            alert(deleteData.message || 'error deleting entry');
            return;
          }

          card.remove();
        } catch (err) {
          console.error('error deleting entry', err);
          alert('something went wrong deleting the entry');
        }
      });

      gallery.appendChild(card);
    });

    // ⭐ Deep link: /gallery#entry-123 scrolls to that card
    const deepLinkHash = window.location.hash;
    if (deepLinkHash && deepLinkHash.startsWith('#entry-')) {
      const target = document.querySelector(deepLinkHash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  } catch (err) {
    console.error('error getting entries', err);
    alert('something went wrong getting your entries');
  }
});

/* =========================================
   PROFILE PAGE: "your beautiful thoughts"
========================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const thoughtsGrid = document.querySelector('.thoughts__grid');
  if (!thoughtsGrid) return; // not on profile page

  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') {
    // profile route itself is already protected, but just in case:
    return;
  }

  try {
    const res = await fetch('/api/entries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error('error loading profile thoughts:', data);
      return;
    }

    const entries = data.entries || [];

    thoughtsGrid.innerHTML = '';
    thoughtsGrid.classList.remove('thoughts__grid--empty');

    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.classList.add('placeholder-text');
      empty.textContent =
        'nothing here yet — your beautiful thoughts will appear soon.';
      thoughtsGrid.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement('article');
      card.classList.add('gallery-entry');
      card.style.cursor = 'pointer';

      // clicking a thought jumps to that entry in the gallery
      card.addEventListener('click', () => {
        window.location.href = `/gallery#entry-${entry.id}`;
      });

      const titleEl = document.createElement('h3');
      titleEl.textContent = entry.title;

      const bodyEl = document.createElement('p');
      bodyEl.textContent = entry.bodyText;

      if (entry.imageUrl) {
        const img = document.createElement('img');
        img.src = entry.imageUrl;
        img.alt = entry.title || 'journal image';
        img.classList.add('gallery-image');
        card.appendChild(img);
      }

      const metaEl = document.createElement('small');
      const formattedDate = formatEntryDate(entry.entryDate);
      const parts = [];
      if (entry.location) parts.push(entry.location);
      if (formattedDate) parts.push(formattedDate);
      metaEl.textContent = parts.join(' • ');

      card.appendChild(titleEl);
      card.appendChild(bodyEl);
      card.appendChild(metaEl);

      thoughtsGrid.appendChild(card);
    });
  } catch (err) {
    console.error('error loading profile thoughts:', err);
  }
});
