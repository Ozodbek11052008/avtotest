// scripts/admin.js
// Cookie utility functions
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// 1. Admin check
if (getCookie('isAdmin') !== 'true') {
  window.location.href = '/login';
} else {
  // 2. Create new user
  const createUserBtn = document.getElementById('createUser');
  const statusSelect = document.getElementById('statusSelect');

  if (createUserBtn && statusSelect) {
    createUserBtn.addEventListener('click', async () => {
      const email = prompt("Foydalanuvchi emailini kiriting:");
      if (!email) return;

      const password = prompt("Foydalanuvchi parolini kiriting (kamida 6 belgi):");
      if (!password || password.length < 6) {
        alert("Parol kamida 6 belgidan iborat bo'lishi kerak!");
        return;
      }

      // Normalize status values (supports Uzbek labels and internal keys)
      const rawStatus = String(statusSelect.value || '').trim().toLowerCase();
      const statusMap = {
        temporary: 'temporary',
        vaqtinchalik: 'temporary',
        permanent: 'permanent',
        doimiy: 'permanent',
        completed: 'completed',
        tolangan: 'completed',
        "to‘langan": 'completed',
        "to'langan": 'completed',
      };
      const status = statusMap[rawStatus] || rawStatus;
      const validStatuses = ['temporary', 'permanent', 'completed'];

      if (!validStatuses.includes(status)) {
        alert("Faqat 'vaqtinchalik', 'doimiy' yoki 'tolangan' holatini tanlash mumkin!");
        return;
      }

      try {
        // IMPORTANT: creating a user via primary `auth` signs the admin out.
        // Use a secondary Firebase app instance so the admin stays logged in.
        const secondaryAppName = 'AdminCreateUser';
        let secondaryApp;
        try {
          secondaryApp = firebase.app(secondaryAppName);
        } catch (e) {
          // Use the already-initialized app's options (firebaseConfig isn't global here)
          secondaryApp = firebase.initializeApp(firebase.app().options, secondaryAppName);
        }
        const secondaryAuth = secondaryApp.auth();

        const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);

        // Calculate expiration date based on status
        let expiresAtDate;
        if (status === 'permanent' || status === 'completed') {
          expiresAtDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
        } else if (status === 'temporary') {
          expiresAtDate = new Date(Date.now() + 30 * 60 * 1000);
        }

        // Use a client timestamp for immediate UI ordering (serverTimestamp resolves later)
        const createdAtClient = firebase.firestore.Timestamp.now();

        await db.collection('users').doc(userCredential.user.uid).set({
          email,
          password,
          status,
          expiresAt: firebase.firestore.Timestamp.fromDate(expiresAtDate),
          createdAt: createdAtClient,
          createdAtServer: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: createdAtClient,
          lastUpdatedServer: firebase.firestore.FieldValue.serverTimestamp(),
          isBlocked: false,
          isLoggedIn: false
        });

        // Clean up secondary auth/app
        try { await secondaryAuth.signOut(); } catch (e) {}

        const message = `Yangi foydalanuvchi qo'shildi!\nEmail: ${email}\nParol: ${password}`;
        await sendTelegramMessage(message);

        alert(`Foydalanuvchi muvaffaqiyatli qo'shildi!`);
        fetchUsers();
      } catch (error) {
        console.error('Create user error:', error);
        alert("Xatolik yuz berdi: " + (error.code ? `${error.code} - ` : '') + error.message);
      }
    });
  }

  // 3. Fetch and display users with real-time active status
  const userList = document.getElementById('userList');
  let activeUsersMap = {};

  function setupRealtimeListener() {
    if (!window.realtimeDb) {
      setTimeout(setupRealtimeListener, 300);
      return;
    }
    try {
      const activeUsersRef = window.realtimeDb.ref('activeUsers');
      activeUsersRef.on('value', function (snapshot) {
        const data = snapshot.val();
        activeUsersMap = data || {};
        renderLoadedUsers();
      });
    } catch (err) {
      console.error('Admin: Realtime DB listener error', err);
      setTimeout(setupRealtimeListener, 500);
    }
  }

  setupRealtimeListener();

  const PAGE_SIZE = 15;
  let lastDoc = null;
  let loadedUsers = [];
  let hasMorePages = true;

  function renderLoadedUsers() {
    if (!userList) return;
    userList.innerHTML = '';
    const activeHeader = document.createElement('h2');
    activeHeader.textContent = 'Faol Foydalanuvchilar (Onlayn)';
    userList.appendChild(activeHeader);
    const activeUsersList = document.createElement('div');
    activeUsersList.id = 'activeUsersList';
    userList.appendChild(activeUsersList);
    const allUsersHeader = document.createElement('h2');
    allUsersHeader.textContent = 'Oxirgi yaratilgan foydalanuvchilar';
    userList.appendChild(allUsersHeader);
    const allUsersList = document.createElement('div');
    allUsersList.id = 'allUsersList';
    userList.appendChild(allUsersList);
    loadedUsers.forEach(({ doc, user, userId }) => {
      const isActive = activeUsersMap[userId] && activeUsersMap[userId].online === true;
      renderUser(doc, user, userId, isActive, activeUsersList, allUsersList);
    });
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'loadMoreUsers';
    loadMoreBtn.textContent = '+';
    loadMoreBtn.title = 'Yana yuklash';
    loadMoreBtn.style.marginTop = '15px';
    loadMoreBtn.style.fontSize = '20px';
    loadMoreBtn.style.padding = '8px 20px';
    loadMoreBtn.onclick = () => fetchUsers(false);
    loadMoreBtn.style.display = (loadedUsers.length > 0 && hasMorePages) ? 'inline-block' : 'none';
    userList.appendChild(loadMoreBtn);
  }

  function renderUser(doc, user, userId, isActive, activeUsersList, allUsersList) {
    if (user.status === 'forsale') return;
    const createdAt = user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'N/A';
    const expiresAt = user.expiresAt?.seconds ? new Date(user.expiresAt.seconds * 1000).toLocaleString() : 'N/A';
    const userDiv = document.createElement('div');
    userDiv.style.border = isActive ? '2px solid #4caf50' : '1px solid #eee';
    userDiv.innerHTML = `
      <div class="user-details">
        <strong>Email:</strong> ${user.email || 'N/A'} ${isActive ? 'ONLAYN' : 'OFLAN'}<br>
        <strong>Holat:</strong> ${user.status}<br>
        <strong>Yaratilgan:</strong> ${createdAt}<br>
        <strong>Amal qilish:</strong> ${expiresAt}
      </div>
      <div class="user-actions">
        <button onclick="deleteUser('${doc.id}', ${isActive})">
          ${isActive ? 'Sessiyani Yakunlash' : 'O\'chirish'}
        </button>
      </div>
    `;
    if (isActive) activeUsersList.appendChild(userDiv);
    else allUsersList.appendChild(userDiv);
  }

  async function fetchUsers(reset = true) {
    if (!userList || !window.db) return;
    try {
      if (reset) {
        lastDoc = null;
        loadedUsers = [];
        // Fetch users without orderBy (no index needed), sort by createdAt in memory
        const snapshot = await db.collection('users').limit(200).get();
        const list = [];
        snapshot.forEach(doc => {
          const user = doc.data();
          if (user.status === 'forsale') return;
          list.push({ doc, user, userId: doc.id });
        });
        list.sort((a, b) => {
          const tA = a.user.createdAt?.seconds ?? 0;
          const tB = b.user.createdAt?.seconds ?? 0;
          return tB - tA;
        });
        loadedUsers = list;
        hasMorePages = false;
      }

      renderLoadedUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  window.deleteUser = async (userId, isActive = false) => {
    if (window.confirm('Ishonchingiz komilmi?')) {
      try {
        if (window.realtimeDb) {
          const logoutSignalRef = window.realtimeDb.ref(`logoutSignals/${userId}`);
          await logoutSignalRef.set({ forceLogout: true, deleted: true, timestamp: Date.now() });
          if (isActive) await window.realtimeDb.ref(`activeUsers/${userId}`).remove();
          setTimeout(() => logoutSignalRef.remove(), 5000);
        }
        await db.collection('users').doc(userId).delete();
        alert('O\'chirildi');
        fetchUsers();
      } catch (error) {
        alert('Xato: ' + error.message);
      }
    }
  };

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.auth) await auth.signOut();
      deleteCookie('isAdmin');
      window.location.href = '/login';
    });
  }

  async function sendTelegramMessage(message) {
    try {
      const res = await fetch(`/api/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('Telegram notify failed:', res.status, text);
      }
    } catch (e) { }
  }

  fetchUsers();
}
