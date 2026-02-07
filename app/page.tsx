"use client";
import Script from "next/script";

export default function Home() {
    return (
        <>
            <div className="userList"></div>
            <div className="imtihon-button">
                Imtihon bolimiga otish
            </div>
            <div id="percentageDisplay" className="hidden">Correct Answers: 100%</div>
            <div className="language-switcher">
                <button id="lang-uz">Uzbek</button>
                <button id="lang-ru">Russian</button>
                <button id="lang-cry">Cyrillic</button>
            </div>
            <div className="main-items">

                <div className="item darslar">Darslar</div>
                <div className="item oraliq" id="oraliq">Oraliq Test</div>
                <div className="item testlar">Testlar</div>
                <div className="item variant">Variantlar</div>
            </div>

            <div className="chapters" id="chapters">

            </div>
            <div className="topics" id="topics"></div>
            <div id="content">
                <h1 id="chapter-headline"></h1>
                <h1 id="topic-headline"></h1>
                <div className="question" id="question"></div>
                <div className="question" id="questionOraliq"></div>
                <div id="answers"></div>
                <div className="navigation">
                    <button id="prev" disabled>Previous</button>
                    <button id="next">Next</button>
                </div>
                <div className="result" id="result"></div>
                <div id="test-navigation">
                    {/* Test number boxes will be dynamically generated here */}
                </div>
            </div>
            <div className="imtihon-container">
                <div className="imtihon-item">1</div>
                <div className="imtihon-item">2</div>
                <div className="imtihon-item">3</div>
                <div className="imtihon-item">4</div>

            </div>
            <div id="Oraliqchapters"></div>
            <button className="home-button" id="home" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-button" id="back" style={{ display: 'none' }}>Orqaga</button>
            <button className="main-home" id="main-home" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-oraliq-chapter" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-oraliq-question" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-test-question" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-variant-group" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-variant-question" style={{ display: 'none' }}>Orqaga</button>
            <button className="back-imtihon-question" style={{ display: 'none' }}>Orqaga</button>

            <Script src="/scripts/image-debug.js" strategy="beforeInteractive" />
            <Script src="/scripts/image-error-handler.js" strategy="beforeInteractive" />
            <Script src="/scripts/index-obfuscated.js" strategy="lazyOnload" />
            <Script src="/scripts/user.js" strategy="lazyOnload" />
            <Script id="home-logic" strategy="lazyOnload">
                {`
          let darslar = document.querySelector('.darslar');
          let oraliq = document.querySelector('.oraliq');
          let testlar = document.querySelector('.testlar');
          let variant = document.querySelector('.variant');
          if (darslar) {
            darslar.addEventListener('click', function () {
                document.querySelector('.main-items').style.display = 'none';
                document.querySelector('.chapters').style.display = 'flex';
                document.querySelector('.back-button').style.display = 'none';
                document.querySelectorAll('.chapter-button').forEach(button => {
                    button.style.display = 'block';
                });
            });
          }
          window.addEventListener('load', function () {
              if (document.querySelector('.chapters')) document.querySelector('.chapters').style.display = 'none';
              if (document.querySelector('.topics')) document.querySelector('.topics').style.display = 'none';
              if (document.querySelector('.imtihon-container')) document.querySelector('.imtihon-container').style.display = 'none';
              if (oraliq) oraliq.style.display = 'flex';
          });
          if (variant) {
            variant.addEventListener('click', function () {
              document.querySelector("#content").style.marginTop = '30px';
            });
          }
          document.querySelectorAll(".chapter-button").forEach(button => {
              button.addEventListener("click", function () {
                  document.querySelector('.chapters').style.display = 'none';
                  document.querySelector('.topics').style.display = 'flex';
              });
          });
        `}
            </Script>
        </>
    );
}
