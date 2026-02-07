// scripts/superadmin.js
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

// 1. Superadmin check
if (getCookie('isSuperAdmin') !== 'true') {
  window.location.href = '/login';
} else {
  // 2. Create new for sale user
  const createUserBtn = document.getElementById('createForSaleUser');
  const userEmailInput = document.getElementById('userEmail');
  const userPasswordInput = document.getElementById('userPassword');

  if (createUserBtn) {
    createUserBtn.addEventListener('click', async () => {
      const email = userEmailInput.value.trim();
      const password = userPasswordInput.value.trim();

      if (!email || !password) {
        alert("Iltimos, email va parolni kiriting!");
        return;
      }

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 2);

        await db.collection('users').doc(userCredential.user.uid).set({
          email,
          password,
          status: 'forsale',
          expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          isBlocked: false,
          isLoggedIn: false
        });

        await auth.signOut();
        alert(`For Sale user muvaffaqiyatli qo'shildi!`);
        userEmailInput.value = '';
        userPasswordInput.value = '';
        fetchUsers();
      } catch (error) {
        alert("Xatolik yuz berdi: " + error.message);
      }
    });
  }

  // 3. Fetch and display for sale users with real-time active status
  const userList = document.getElementById('superUserList') || document.getElementById('userList');
  let activeUsersMap = {};

  function setupRealtimeListener() {
    if (!window.realtimeDb) {
      setTimeout(setupRealtimeListener, 500);
      return;
    }

    const activeUsersRef = window.realtimeDb.ref('activeUsers');
    activeUsersRef.on('value', (snapshot) => {
      activeUsersMap = snapshot.val() || {};
      renderLoadedUsers();
    });
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
    activeHeader.textContent = 'Faol Sotuvdagi Foydalanuvchilar (Onlayn)';
    userList.appendChild(activeHeader);
    const activeUsersList = document.createElement('div');
    activeUsersList.id = 'activeForSaleUsersList';
    userList.appendChild(activeUsersList);
    const allUsersHeader = document.createElement('h2');
    allUsersHeader.textContent = 'Oxirgi yaratilgan foydalanuvchilar';
    userList.appendChild(allUsersHeader);
    const allUsersList = document.createElement('div');
    allUsersList.id = 'allForSaleUsersList';
    userList.appendChild(allUsersList);
    loadedUsers.forEach(({ doc, user, userId }) => {
      const isActive = activeUsersMap[userId] && activeUsersMap[userId].online === true;
      renderUser(doc, user, userId, isActive, activeUsersList, allUsersList);
    });
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'loadMoreForSaleUsers';
    loadMoreBtn.textContent = '+';
    loadMoreBtn.title = 'Yana yuklash';
    loadMoreBtn.className = 'btn-super';
    loadMoreBtn.style.marginTop = '15px';
    loadMoreBtn.style.background = '#2e7d32';
    loadMoreBtn.onclick = () => fetchUsers(false);
    loadMoreBtn.style.display = (loadedUsers.length > 0 && hasMorePages) ? 'inline-block' : 'none';
    userList.appendChild(loadMoreBtn);
  }

  function renderUser(doc, user, userId, isActive, activeUsersList, allUsersList) {
    const expiresAt = user.expiresAt?.seconds ? new Date(user.expiresAt.seconds * 1000).toLocaleString() : 'N/A';
    const userDiv = document.createElement('div');
    userDiv.style.border = isActive ? '2px solid #4caf50' : '1px solid #eee';
    userDiv.style.padding = '15px';
    userDiv.style.marginBottom = '10px';
    userDiv.style.borderRadius = '5px';
    userDiv.innerHTML = `
      <div class="user-details">
        <strong>Email:</strong> ${user.email || 'N/A'} ${isActive ? 'ONLAYN' : 'OFLAN'}<br>
        <strong>Amal qilish:</strong> ${expiresAt}
      </div>
      <div class="user-actions" style="margin-top:10px;text-align:right">
        <button onclick="deleteUser('${doc.id}', ${isActive})" class="btn-super btn-danger">
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
        loadedUsers = [];
        // Fetch forsale users (no composite index needed), then sort in memory
        const snapshot = await db.collection('users')
          .where('status', '==', 'forsale')
          .limit(200)
          .get();
        const list = [];
        snapshot.forEach(doc => {
          const user = doc.data();
          list.push({ doc, user, userId: doc.id });
        });
        list.sort((a, b) => {
          const tA = a.user.createdAt?.seconds ?? 0;
          const tB = b.user.createdAt?.seconds ?? 0;
          return tB - tA;
        });
        loadedUsers = list;
      }

      hasMorePages = false; // we load all forsale users in one go
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
        alert('Xatolik yuz berdi.');
      }
    }
  };

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.auth) await auth.signOut();
      deleteCookie('isSuperAdmin');
      window.location.href = '/login';
    });
  }

  fetchUsers();
}

