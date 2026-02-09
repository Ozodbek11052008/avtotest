// scripts/user.js
// Cookie utility functions
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;
}

/** Clear all user data: cookies, localStorage, sessionStorage - used when admin deletes user */
function clearAllUserData() {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const name = cookies[i].split('=')[0].trim();
    if (name) {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;
    }
  }
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.warn('Error clearing storage:', e);
  }
}

// 1. Check login state
const userCookie = getCookie('user');
let userData;
try {
  userData = userCookie ? JSON.parse(userCookie) : null;
  // Restrict UI by status
  // Permanent users should only see ".item.testlar" on the home page.
  if (userData && userData.status === 'permanent') {
    // Wait until the home DOM exists (scripts can run before elements are painted)
    const applyPermanentUI = () => {
      const items = document.querySelectorAll('.main-items .item');
      if (!items || items.length === 0) return false;

      items.forEach((el) => {
        const isTestlar = el.classList.contains('testlar');
        el.style.display = isTestlar ? 'flex' : 'none';
      });

      return true;
    };

    if (!applyPermanentUI()) {
      window.addEventListener('load', applyPermanentUI);
      // also retry a few times in case scripts render later
      let tries = 0;
      const t = setInterval(() => {
        tries += 1;
        if (applyPermanentUI() || tries > 20) clearInterval(t);
      }, 250);
    }
  }
  console.log('User cookie retrieved:', userData);
} catch (error) {
  console.error('Error parsing user cookie:', error);
  userData = null;
}

// Check if user cookie exists and is valid (no expiration check in JSON)
if (!userData) {
  deleteCookie('user');
  window.location.href = '/login';
  // return; // We can't return from top-level, but the redirect will happen
} else {
  (async function initUserPage() {
    // One device only: require sessionId (set at login)
    if (!userData.sessionId) {
      clearAllUserData();
      window.location.href = '/login';
      return;
    }
    for (var i = 0; i < 50; i++) {
      if (window.db) break;
      await new Promise(function (r) { setTimeout(r, 100); });
    }
    if (!window.db) {
      clearAllUserData();
      window.location.href = '/login';
      return;
    }
    try {
      var doc = await db.collection('users').doc(userData.uid).get();
      var data = doc.exists ? doc.data() : null;
      var currentSessionId = data && data.currentSessionId;
      if (currentSessionId !== userData.sessionId) {
        clearAllUserData();
        if (window.auth) await window.auth.signOut();
        window.location.href = '/login';
        return;
      }
    } catch (err) {
      console.error('[USER] Session check error:', err);
      clearAllUserData();
      window.location.href = '/login';
      return;
    }

    // 2. Show user info
    var userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
      userEmailElement.textContent = userData.email || 'Unknown';
    }

    // 3. Set up WebSocket-like real-time connection for force logout
    if (userData.uid) {
    const userId = userData.uid;

    // Wait for Firebase Realtime Database to be ready
    function setupUserPresence() {
      if (!window.realtimeDb || !window.firebase) {
        setTimeout(setupUserPresence, 500);
        return;
      }

      try {
        // Mark user as active in Realtime Database
        const userStatusRef = window.realtimeDb.ref(`activeUsers/${userId}`);
        const userStatusData = {
          email: userData.email,
          uid: userId,
          online: true,
          lastSeen: firebase.database.ServerValue.TIMESTAMP,
          connectedAt: firebase.database.ServerValue.TIMESTAMP
        };

        userStatusRef.set(userStatusData).then(() => {
          console.log('User marked as active:', userId, userStatusData);

          // Keep connection alive by updating lastSeen every 30 seconds
          const keepAliveInterval = setInterval(() => {
            if (window.realtimeDb) {
              userStatusRef.update({
                lastSeen: firebase.database.ServerValue.TIMESTAMP
              }).catch(err => {
                console.error('Error updating lastSeen:', err);
                clearInterval(keepAliveInterval);
              });
            } else {
              clearInterval(keepAliveInterval);
            }
          }, 30000); // Update every 30 seconds

          // Clear interval when page unloads
          window.addEventListener('beforeunload', () => {
            clearInterval(keepAliveInterval);
          });
        }).catch((error) => {
          console.error('Error marking user as active:', error);
        });

        // Set up disconnect handler
        userStatusRef.onDisconnect().remove().then(() => {
          console.log('Disconnect handler set up for user:', userId);
        }).catch(err => {
          console.error('Error setting up disconnect handler:', err);
        });

        console.log('User presence tracking set up successfully');
      } catch (error) {
        console.error('Error setting up user presence:', error);
      }
    }

    setupUserPresence();

    // Listen for force logout signals (e.g. login from another device or admin delete)
    function setupLogoutListener() {
      if (!window.realtimeDb) {
        setTimeout(setupLogoutListener, 500);
        return;
      }

      try {
        const logoutSignalRef = window.realtimeDb.ref(`logoutSignals/${userId}`);
        var isFirstValue = true;
        logoutSignalRef.on('value', function (snapshot) {
          var signal = snapshot.val();
          if (isFirstValue) {
            isFirstValue = false;
            return;
          }
          if (signal && (signal.forceLogout === true || signal.deleted === true)) {
            console.log('Force logout/deleted signal received - clearing all data immediately');

            const userStatusRef = window.realtimeDb.ref(`activeUsers/${userId}`);
            userStatusRef.remove().catch(() => {});

            logoutSignalRef.off('value');
            logoutSignalRef.remove().catch(() => {});

            clearAllUserData();

            if (window.auth) {
              window.auth.signOut().then(function () {
                var msg = signal.deleted ? 'Sizning hisobingiz o\'chirildi.' : (signal.reason === 'new_login' ? 'Siz boshqa qurilmada tizimga kirdingiz.' : 'Sessiya admin tomonidan yakunlandi.');
                alert(msg);
                window.location.href = '/login';
              }).catch(function () {
                window.location.href = '/login';
              });
            } else {
              window.location.href = '/login';
            }
          }
        }, (error) => {
          console.error('Error listening to logout signals:', error);
        });
      } catch (error) {
        console.error('Error setting up logout listener:', error);
      }
    }

    setupLogoutListener();

    // 4. IMMEDIATE check on page load + periodic session check (one device only)
    async function checkSessionStillValid() {
      if (!userData || !userData.uid || !userData.sessionId || !window.db) return true;
      try {
        var doc = await db.collection('users').doc(userData.uid).get();
        var data = doc.exists ? doc.data() : null;
        var currentSessionId = data && data.currentSessionId;
        if (currentSessionId !== userData.sessionId) {
          if (window.realtimeDb) window.realtimeDb.ref('activeUsers/' + userData.uid).remove();
          clearAllUserData();
          if (window.auth) await window.auth.signOut();
          window.location.href = '/login';
          return false;
        }
        return true;
      } catch (e) {
        return true;
      }
    }

    async function checkUserExists() {
      if (!userData || !userData.uid || !window.db) {
        return false;
      }
      if (!(await checkSessionStillValid())) return false;
      try {
        const userDoc = await db.collection('users').doc(userData.uid).get();
        if (!userDoc.exists) {
          if (window.realtimeDb) {
            window.realtimeDb.ref(`activeUsers/${userData.uid}`).remove();
          }
          deleteCookie('user');
          if (window.auth) await window.auth.signOut();
          alert('Sizning hisobingiz o\'chirilgan. Tizimdan chiqarilmoqdasiz.');
          window.location.href = '/login';
          return false;
        }
        return true;
      } catch (error) {
        console.error('[USER] Error checking user existence:', error);
        return true;
      }
    }

    checkUserExists();

    const userExistenceCheck = setInterval(async function () {
      await checkUserExists();
    }, 5000);

    window.addEventListener('online', () => {
      checkUserExists();
    });
  }

  // 7. Logout — set isLoggedIn false in Firebase so next login is allowed
  var logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (userData && userData.uid) {
        if (window.realtimeDb) {
          window.realtimeDb.ref('activeUsers/' + userData.uid).remove();
        }
        if (window.db) {
          window.db.collection('users').doc(userData.uid).update({ isLoggedIn: false }).catch(function () {});
        }
      }

      deleteCookie('user');
      if (window.auth) {
        window.auth.signOut().then(function () {
          window.location.href = '/login';
        }).catch(function () {
          window.location.href = '/login';
        });
      } else {
        window.location.href = '/login';
      }
    });
  }
  })();
}
