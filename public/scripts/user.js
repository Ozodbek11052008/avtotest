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
  // 2. Show user info
  const userEmailElement = document.getElementById('userEmail');
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

    // Listen for force logout signals
    function setupLogoutListener() {
      if (!window.realtimeDb) {
        setTimeout(setupLogoutListener, 500);
        return;
      }

      try {
        const logoutSignalRef = window.realtimeDb.ref(`logoutSignals/${userId}`);
        logoutSignalRef.on('value', (snapshot) => {
          const signal = snapshot.val();
          if (signal && (signal.forceLogout === true || signal.deleted === true)) {
            console.log('Force logout/deleted signal received - clearing all data immediately');

            const userStatusRef = window.realtimeDb.ref(`activeUsers/${userId}`);
            userStatusRef.remove().catch(() => {});

            logoutSignalRef.off('value');
            logoutSignalRef.remove().catch(() => {});

            clearAllUserData();

            if (window.auth) {
              window.auth.signOut().then(() => {
                alert(signal.deleted ? 'Sizning hisobingiz o\'chirildi.' : 'Sessiya admin tomonidan yakunlandi.');
                window.location.href = '/login';
              }).catch(() => {
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

    // 4. IMMEDIATE check on page load
    async function checkUserExists() {
      if (!userData || !userData.uid || !window.db) {
        return false;
      }

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

    const userExistenceCheck = setInterval(async () => {
      await checkUserExists();
    }, 5000);

    window.addEventListener('online', () => {
      checkUserExists();
    });
  }

  // 7. Logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (userData && userData.uid && window.realtimeDb) {
        window.realtimeDb.ref(`activeUsers/${userData.uid}`).remove();
      }

      deleteCookie('user');
      if (window.auth) {
        window.auth.signOut().then(() => {
          window.location.href = '/login';
        }).catch(error => {
          window.location.href = '/login';
        });
      } else {
        window.location.href = '/login';
      }
    });
  }
}
