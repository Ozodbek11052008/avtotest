// scripts/statistics.js
document.addEventListener('DOMContentLoaded', () => {
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
    window.location.href = 'login.html';
    return;
  }

  // 2. Logout function
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        if (auth.currentUser) {
          await auth.signOut();
        }
        deleteCookie('isSuperAdmin');
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
        deleteCookie('isSuperAdmin');
        window.location.href = 'login.html';
      }
    });
  }

  // 3. Track active users in real-time and store historical data
  let activeUsersMap = {};
  let onlineUsersChart = null;
  let currentChartType = 'day';
  
  const activeUsersRef = window.realtimeDb.ref('activeUsers');
  activeUsersRef.on('value', (snapshot) => {
    activeUsersMap = snapshot.val() || {};
    
    // Record current online count with timestamp
    const onlineCount = Object.keys(activeUsersMap).filter(uid => activeUsersMap[uid].online === true).length;
    recordOnlineUsersCount(onlineCount);
    
    loadStatistics(); // Refresh statistics when active users change
    loadCharts(currentChartType); // Refresh charts
  }, (error) => {
    console.error('Error listening to active users:', error);
    if (error.code === 'PERMISSION_DENIED') {
      alert('Firebase Realtime Database ruxsatlari sozlanmagan. Iltimos, Firebase Console\'da Realtime Database Rules ni yangilang.');
    }
  });
  
  // 4. Record online users count to historical data
  function recordOnlineUsersCount(count) {
    const now = new Date();
    const timestamp = now.getTime();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Store in Realtime Database
    const statsRef = window.realtimeDb.ref(`statistics/onlineUsers/${dateKey}`);
    statsRef.push({
      count: count,
      timestamp: timestamp,
      time: now.toISOString()
    });
    
    // Keep only last 90 days of data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    statsRef.orderByChild('timestamp').startAt(0).endAt(cutoffDate.getTime()).once('value', (snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          child.ref.remove();
        });
      }
    });
  }

  // 5. Load and display charts
  window.loadCharts = async function(type = 'day') {
    currentChartType = type;
    try {
      const statsRef = window.realtimeDb.ref('statistics/onlineUsers');
      const snapshot = await statsRef.once('value');
      const allData = snapshot.val() || {};
      
      let chartData = [];
      let labels = [];
      
      const now = new Date();
      
      if (type === 'day') {
        // Get last 24 hours (hourly data)
        for (let i = 23; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(date.getHours() - i);
          const dateKey = date.toISOString().split('T')[0];
          const hour = date.getHours();
          
          const dayData = allData[dateKey] || {};
          let hourCount = 0;
          let count = 0;
          
          Object.values(dayData).forEach(entry => {
            const entryDate = new Date(entry.time);
            if (entryDate.getHours() === hour) {
              hourCount++;
              count += entry.count;
            }
          });
          
          const avgCount = hourCount > 0 ? Math.round(count / hourCount) : 0;
          labels.push(`${hour}:00`);
          chartData.push(avgCount);
        }
      } else if (type === 'week') {
        // Get last 7 days (daily data)
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          
          const dayData = allData[dateKey] || {};
          let totalCount = 0;
          let count = 0;
          
          Object.values(dayData).forEach(entry => {
            totalCount += entry.count;
            count++;
          });
          
          const avgCount = count > 0 ? Math.round(totalCount / count) : 0;
          const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' });
          labels.push(dayName);
          chartData.push(avgCount);
        }
      } else if (type === 'month') {
        // Get last 30 days (daily data)
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          
          const dayData = allData[dateKey] || {};
          let totalCount = 0;
          let count = 0;
          
          Object.values(dayData).forEach(entry => {
            totalCount += entry.count;
            count++;
          });
          
          const avgCount = count > 0 ? Math.round(totalCount / count) : 0;
          const dayName = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
          labels.push(dayName);
          chartData.push(avgCount);
        }
      }
      
      // Create or update chart
      const ctx = document.getElementById('onlineUsersChart').getContext('2d');
      
      if (onlineUsersChart) {
        onlineUsersChart.destroy();
      }
      
      const chartTypeLabel = type === 'day' ? 'Kunlik (Soatlik)' : type === 'week' ? 'Haftalik (Kunlik)' : 'Oylik (Kunlik)';
      
      onlineUsersChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `Onlayn Foydalanuvchilar - ${chartTypeLabel}`,
            data: chartData,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 14,
                  weight: 'bold'
                },
                color: '#333'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#4caf50',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `Onlayn: ${context.parsed.y} foydalanuvchi`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#666',
                font: {
                  size: 12
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              title: {
                display: true,
                text: 'Foydalanuvchilar soni',
                color: '#666',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              }
            },
            x: {
              ticks: {
                color: '#666',
                font: {
                  size: 11
                },
                maxRotation: type === 'month' ? 45 : 0
              },
              grid: {
                display: false
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      });
    } catch (error) {
      console.error('Grafiklarni yuklashda xatolik:', error);
    }
  };
  
  // 6. Load and display statistics
  window.loadStatistics = async function() {
    try {
      // Fetch all users from Firestore
      const snapshot = await db.collection('users').get();
      
      // Initialize counters
      let stats = {
        total: 0,
        online: 0,
        offline: 0,
        temporary: 0,
        permanent: 0,
        completed: 0,
        forsale: 0,
        expired: 0,
        active: 0
      };

      const now = new Date();
      
      snapshot.forEach(doc => {
        const user = doc.data();
        const userId = doc.id;
        stats.total++;

        // Check if user is online
        const isOnline = activeUsersMap[userId] && activeUsersMap[userId].online === true;
        if (isOnline) {
          stats.online++;
        } else {
          stats.offline++;
        }

        // Check expiration
        const expiresAt = user.expiresAt?.seconds ? new Date(user.expiresAt.seconds * 1000) : null;
        const isExpired = expiresAt && expiresAt < now;

        // Count by status
        switch (user.status) {
          case 'temporary':
            stats.temporary++;
            if (isExpired) stats.expired++;
            break;
          case 'permanent':
            stats.permanent++;
            if (isExpired) stats.expired++;
            break;
          case 'completed':
            stats.completed++;
            if (isExpired) stats.expired++;
            break;
          case 'forsale':
            stats.forsale++;
            if (isExpired) stats.expired++;
            break;
        }

        // Count active (not expired)
        if (!isExpired) {
          stats.active++;
        }
      });

      // Display statistics
      displayStatistics(stats);
    } catch (error) {
      console.error('Statistikalarni yuklashda xatolik:', error);
      document.getElementById('statsContainer').innerHTML = 
        '<p style="color: #ff4444; padding: 20px;">Statistikalarni yuklashda xatolik yuz berdi.</p>';
    }
  };

  // 7. Display statistics
  function displayStatistics(stats) {
    const container = document.getElementById('statsContainer');
    container.innerHTML = '';

    // Create stat cards
    const statCards = [
      { label: 'Jami Foydalanuvchilar', value: stats.total, class: '', icon: '👥' },
      { label: 'Onlayn Foydalanuvchilar', value: stats.online, class: 'online', icon: '🟢' },
      { label: 'Oflayn Foydalanuvchilar', value: stats.offline, class: 'offline', icon: '⚪' },
      { label: 'Faol Foydalanuvchilar', value: stats.active, class: 'permanent', icon: '✅' },
      { label: 'Muddati Tugagan', value: stats.expired, class: 'expired', icon: '❌' },
      { label: 'Vaqtinchalik', value: stats.temporary, class: 'temporary', icon: '⏱️' },
      { label: 'Doimiy', value: stats.permanent, class: 'permanent', icon: '⭐' },
      { label: 'Tolangan', value: stats.completed, class: 'completed', icon: '💰' },
      { label: 'Sotuvda', value: stats.forsale, class: 'forsale', icon: '🛒' }
    ];

    statCards.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = `stat-card ${card.class}`;
      cardDiv.innerHTML = `
        <div style="font-size: 2em; margin-bottom: 10px;">${card.icon}</div>
        <div class="stat-value">${card.value}</div>
        <div class="stat-label">${card.label}</div>
      `;
      container.appendChild(cardDiv);
    });

    // Display detailed statistics
    const detailedStats = document.getElementById('detailedStats');
    detailedStats.innerHTML = `
      <div class="stat-row">
        <span class="stat-row-label">Jami foydalanuvchilar soni:</span>
        <span class="stat-row-value">${stats.total}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Onlayn foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #4caf50;">${stats.online} (${stats.total > 0 ? ((stats.online / stats.total) * 100).toFixed(1) : 0}%)</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Oflayn foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #999;">${stats.offline} (${stats.total > 0 ? ((stats.offline / stats.total) * 100).toFixed(1) : 0}%)</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Faol foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #2196f3;">${stats.active} (${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%)</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Muddati tugagan:</span>
        <span class="stat-row-value" style="color: #d32f2f;">${stats.expired} (${stats.total > 0 ? ((stats.expired / stats.total) * 100).toFixed(1) : 0}%)</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Vaqtinchalik foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #ff9800;">${stats.temporary}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Doimiy foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #2196f3;">${stats.permanent}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Tolangan foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #9c27b0;">${stats.completed}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Sotuvdagi foydalanuvchilar:</span>
        <span class="stat-row-value" style="color: #e91e63;">${stats.forsale}</span>
      </div>
    `;
  }

  // Initial load
  loadStatistics();
  loadCharts('day'); // Load daily chart by default
  
  // Set up real-time chart updates
  setInterval(() => {
    if (currentChartType) {
      loadCharts(currentChartType);
    }
  }, 60000); // Update charts every minute
});

