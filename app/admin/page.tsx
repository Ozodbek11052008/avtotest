"use client";
import Script from "next/script";

export default function Admin() {
    const css = `
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f0f2f5;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #1a73e8;
      margin-bottom: 20px;
    }
    #userForm {
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    #userList {
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    #userList div {
      border-bottom: 1px solid #eee;
      padding: 15px;
      display: block;
      transition: background-color 0.3s;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    .user-details { margin-bottom: 10px; }
    .user-actions { margin-top: 10px; text-align: right; }
    #userList div:hover { background-color: #f9f9f9; }
    #activeUsersList div { border-left: 4px solid #4caf50; }
    h2 { margin-top: 20px; margin-bottom: 15px; color: #1a73e8; font-size: 1.5em; }
    button {
      background: #1a73e8;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    button:hover { background-color: #1557b0; }
    #logout {
      background: #d32f2f;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }
    #logout:hover { background-color: #b71c1c; transform: scale(1.05); }
    .user-actions button { margin-left: 10px; background: #d32f2f; }
    .user-actions button:hover { background-color: #b71c1c; }
    select { padding: 8px; margin-left: 10px; border-radius: 5px; border: 1px solid #ddd; }
  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />

            <div className="userList"></div>
            <button id="logout">Chiqish</button>
            <h1>Sam Auto Test Admin Paneli</h1>
            <div id="userForm">
                <h2>Yangi Foydalanuvchi qo'shish</h2>
                <button id="createUser">Foydalanuvchi qo'shish</button>
                <select id="statusSelect">
                    <option value="temporary">Vaqtinchalik</option>
                    <option value="permanent">Doimiy</option>
                    <option value="completed">Tolangan</option>
                </select>
            </div>
            <div id="userList"></div>

            <Script src="/scripts/admin.js" strategy="lazyOnload" />
        </>
    );
}
