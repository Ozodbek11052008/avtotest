"use client";
import Script from "next/script";

export default function SuperAdmin() {
    const css = `
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f0f2f5;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #d32f2f;
      margin-bottom: 30px;
    }
    .admin-controls {
      background: #ffffff;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
      border-top: 4px solid #d32f2f;
    }
    .control-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
    }
    .control-group input {
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 15px;
      min-width: 200px;
    }
    .btn-super {
      padding: 15px 25px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 16px;
      transition: all 0.3s;
      color: white;
    }
    .btn-danger { background: #d32f2f; }
    .btn-danger:hover { background: #b71c1c; transform: translateY(-2px); }
    .btn-warning { background: #ff9800; }
    .btn-warning:hover { background: #f57c00; transform: translateY(-2px); }
    .user-list-container {
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-online { background: #e8f5e9; color: #2e7d32; }
    .status-offline { background: #fafafa; color: #757575; }
    #logout {
      background: #d32f2f;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />

            <button id="logout">Chiqish</button>
            <h1>Super Admin Boshqaruv Paneli</h1>

            <div className="admin-controls">
                <h2>Tizim Boshqaruvi</h2>
                <div className="control-group">
                    <input type="email" id="userEmail" placeholder="Email" />
                    <input type="password" id="userPassword" placeholder="Parol" />
                    <button id="createForSaleUser" className="btn-super" style={{ background: '#1976d2' }}>Yangi foydalanuvchi qo&apos;shish</button>
                </div>
            </div>

            <div className="user-list-container">
                <h2>Barcha Foydalanuvchilar va Ularning Statusi</h2>
                <div id="superUserList">
                    {/* User list will be populated here */}
                </div>
            </div>

            <Script src="/scripts/superadmin.js" strategy="lazyOnload" />
        </>
    );
}
