"use client";
import Script from "next/script";

export default function Login() {
    const css = `
    .login-page {
      min-height: 100vh;
      width: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
      padding: 48px 40px;
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
    .login-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .login-logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
    }
    .login-brand {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a2e;
      letter-spacing: -0.02em;
    }
    .login-title {
      font-size: 22px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 24px;
      text-align: center;
    }
    .login-form input {
      width: 100%;
      padding: 14px 16px;
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      font-size: 15px;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .login-form input:focus {
      outline: none;
      border-color: #5c27fe;
      box-shadow: 0 0 0 3px rgba(92, 39, 254, 0.12);
    }
    .login-form input::placeholder {
      color: #9e9e9e;
    }
    .login-form button {
      width: 100%;
      padding: 14px;
      margin-top: 8px;
      background: linear-gradient(135deg, #5c27fe 0%, #7c4dff 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s;
    }
    .login-form button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(92, 39, 254, 0.35);
    }
    .login-form button:active {
      transform: translateY(0);
    }
    .login-error {
      color: #d32f2f;
      font-size: 14px;
      margin-top: 12px;
      text-align: center;
    }
  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />

            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <img className="login-logo" src="/logo2.png" alt="Prava Izlab" />
                        <span className="login-brand">Prava Izlab</span>
                    </div>

                    <h1 className="login-title">Login</h1>

                    <form id="loginForm" className="login-form">
                        <input type="email" id="email" placeholder="Email" required />
                        <input type="password" id="password" placeholder="Password" required />
                        <button type="submit">Login</button>
                    </form>

                    <p id="error" className="login-error"></p>
                </div>
            </div>

            <Script src="/scripts/auth.js" strategy="lazyOnload" />
        </>
    );
}
