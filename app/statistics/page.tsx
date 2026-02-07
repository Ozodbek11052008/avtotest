"use client";
import Script from "next/script";

export default function Statistics() {
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
      color: #9c27b0;
      margin-bottom: 30px;
    }
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #ffffff;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
      border-left: 4px solid #9c27b0;
    }
    .stat-card.online { border-left-color: #4caf50; }
    .stat-card.offline { border-left-color: #999; }
    .stat-card.temporary { border-left-color: #ff9800; }
    .stat-card.permanent { border-left-color: #2196f3; }
    .stat-card.completed { border-left-color: #9c27b0; }
    .stat-card.forsale { border-left-color: #e91e63; }
    .stat-card.expired { border-left-color: #d32f2f; }
    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #9c27b0;
      margin: 10px 0;
    }
    .stat-card.online .stat-value { color: #4caf50; }
    .stat-card.offline .stat-value { color: #999; }
    .stat-card.temporary .stat-value { color: #ff9800; }
    .stat-card.permanent .stat-value { color: #2196f3; }
    .stat-card.completed .stat-value { color: #9c27b0; }
    .stat-card.forsale .stat-value { color: #e91e63; }
    .stat-card.expired .stat-value { color: #d32f2f; }
    .stat-label { font-size: 1.1em; color: #666; margin-top: 10px; }
    .stats-section {
      background: #ffffff;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    .stats-section h2 {
      color: #9c27b0;
      margin-bottom: 20px;
      border-bottom: 2px solid #9c27b0;
      padding-bottom: 10px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .stat-row-label { font-weight: bold; color: #333; }
    .stat-row-value { color: #9c27b0; font-weight: bold; }
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
    .refresh-btn {
      background: #9c27b0;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 20px;
    }
  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />

            <button id="logout">Chiqish</button>
            <h1>Foydalanuvchi Statistikalari</h1>

            <button className="refresh-btn" id="refreshBtn">Yangilash</button>

            <div className="stats-container" id="statsContainer">
                {/* Statistics cards will be dynamically generated here */}
            </div>

            <div className="stats-section">
                <h2>Batafsil Statistika</h2>
                <div id="detailedStats">
                    {/* Detailed statistics will be shown here */}
                </div>
            </div>

            <div className="stats-section">
                <h2>Onlayn Foydalanuvchilar Grafiklari</h2>
                <div style={{ marginBottom: '30px' }}>
                    <button className="refresh-btn" id="chartDay" style={{ marginRight: '10px' }}>Kunlik</button>
                    <button className="refresh-btn" id="chartWeek" style={{ marginRight: '10px' }}>Haftalik</button>
                    <button className="refresh-btn" id="chartMonth">Oylik</button>
                </div>
                <div style={{ position: 'relative', height: '400px', marginBottom: '30px' }}>
                    <canvas id="onlineUsersChart"></canvas>
                </div>
            </div>

            <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" strategy="beforeInteractive" />
            <Script src="/scripts/statistics.js" strategy="lazyOnload" />
            <Script id="stats-inline-fix" strategy="lazyOnload">
                {`
          // Fix for inline onclicks
          document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('refreshBtn')?.addEventListener('click', () => {
              if (window.loadStatistics) window.loadStatistics();
            });
            document.getElementById('chartDay')?.addEventListener('click', () => {
              if (window.loadCharts) window.loadCharts('day');
            });
            document.getElementById('chartWeek')?.addEventListener('click', () => {
              if (window.loadCharts) window.loadCharts('week');
            });
            document.getElementById('chartMonth')?.addEventListener('click', () => {
              if (window.loadCharts) window.loadCharts('month');
            });
          });
        `}
            </Script>
        </>
    );
}
