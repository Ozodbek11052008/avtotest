// scripts/auth.js
// Cookie utility functions
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

function setCookie(name, value, userStatus) {
    try {
        if (!name || !value) {
            console.error("Error: Cookie name or value is missing");
            return;
        }

        let expires;
        if (userStatus && userStatus.toLowerCase() === "temporary") {
            expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        } else {
            expires = new Date(Date.now() + 24 * 60 * 60 * 30000); // 1 day
        }

        const cookieString = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = cookieString;

        const cookieCheck = getCookie(name);
        if (!cookieCheck) {
            console.warn(`Failed to verify ${name} cookie after setting.`);
        }
    } catch (error) {
        console.error(`Error in setCookie: ${error.message}`);
    }
}

function deleteCookie(name) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// Admin check (move to server-side in production)
async function isAdmin(email, password) {
    const ADMIN_CREDENTIALS = [
        { email: "newadmin@admin.com", password: "Admin@x" }
    ];
    return ADMIN_CREDENTIALS.some(admin =>
        admin.email.toLowerCase() === email.toLowerCase() && admin.password === password
    );
}

// Superadmin check
async function isSuperAdmin(email, password) {
    const SUPERADMIN_CREDENTIALS = [
        { email: "superadmin@admin.com", password: "SuperAdmin@2024" }
    ];
    return SUPERADMIN_CREDENTIALS.some(superadmin => superadmin.email === email && superadmin.password === password);
}

async function checkUserStatus(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const expiresAt = userData.expiresAt?.seconds ? new Date(userData.expiresAt.seconds * 1000) : null;
            const isExpired = expiresAt && expiresAt < new Date();
            switch (userData.status) {
                case 'temporary':
                    return isExpired ? 'expired' : 'temporary';
                case 'permanent':
                    return isExpired ? 'expired' : 'permanent';
                case 'completed':
                    return isExpired ? 'expired' : 'completed';
                case 'forsale':
                    return isExpired ? 'expired' : 'forsale';
                default:
                    return 'unknown';
            }
        }
        return 'notFound';
    } catch (error) {
        console.error(`Error checking user status: ${error.message}`);
        return 'error';
    }
}

const loginForm = document.getElementById('loginForm');
const errorElement = document.getElementById('error');

if (loginForm && errorElement) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorElement.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            errorElement.textContent = 'Iltimos, email va parolni kiriting!';
            return;
        }

        try {
            // Check for superadmin login first
            const isSuperAdminResult = await isSuperAdmin(email, password);
            if (isSuperAdminResult) {
                setCookie('isSuperAdmin', 'true', 'permanent');
                window.location.href = '/superadmin';
                return;
            }

            // Check for admin login
            const isAdminResult = await isAdmin(email, password);
            if (isAdminResult) {
                setCookie('isAdmin', 'true', 'permanent');
                window.location.href = '/admin';
                return;
            }

            // Firebase login
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const userId = userCredential.user.uid;

            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                await auth.signOut();
                throw new Error('Foydalanuvchi topilmadi yoki o\'chirilgan.');
            }

            await db.collection('users').doc(userId).update({
                isLoggedIn: true,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (window.realtimeDb) {
                try {
                    const userStatusRef = window.realtimeDb.ref(`activeUsers/${userId}`);
                    const userStatusData = {
                        email: email,
                        uid: userId,
                        online: true,
                        lastSeen: firebase.database.ServerValue.TIMESTAMP,
                        connectedAt: firebase.database.ServerValue.TIMESTAMP
                    };

                    await userStatusRef.set(userStatusData);
                    userStatusRef.onDisconnect().remove();
                } catch (error) {
                    console.error('Error setting up real-time presence:', error);
                }
            }

            const status = await checkUserStatus(userCredential.user.uid);

            if (status === 'expired') {
                await auth.signOut();
                deleteCookie('user');
                throw new Error('Your account has expired');
            }

            const userData = {
                email: userCredential.user.email,
                uid: userCredential.user.uid,
                status: status
            };
            const userJson = JSON.stringify(userData);
            setCookie('user', userJson, status);

            window.location.href = '/';
        } catch (error) {
            errorElement.textContent = 'Login failed: ' +
                (error.code === 'auth/wrong-password' ? 'Invalid password' :
                    error.code === 'auth/user-not-found' ? 'User not found' :
                        error.message);
        }
    });
}
