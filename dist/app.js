let allArticles = [];
let currentLead = null;
let activeCategory = "ALL";


const $ = (selector) => {
    return document.querySelector(selector);
};


function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   LOAD NEWS
========================================= */

async function loadNews() {

    try {

        const response = await fetch("news.json?cache=" + Date.now());

        if (!response.ok) {
            throw new Error("Could not load news.json");
        }

        const data = await response.json();

        allArticles = data.articles || [];

        updateStatistics(data);

        renderHomepage();

    } catch (error) {

        console.error(error);

        document.body.innerHTML = `
            <div style="
                font-family:Arial;
                padding:60px;
                max-width:800px;
                margin:auto;
            ">
                <h1>NEWSROOM FAILURE</h1>

                <p>
                    NPC News cannot reach the fictional news database.
                </p>

                <p>
                    The NPCs have apparently broken the news server.
                </p>

                <hr>

                <small>
                    ${escapeHTML(error.message)}
                </small>
            </div>
        `;
    }
}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics(data) {

    $("#articleCount").textContent =
        formatNumber(data.articles.length);

    $("#eventCount").textContent =
        formatNumber(data.site.event_count);

    let npcCount = 0;

    data.articles.forEach(article => {

        if (article.damage) {
            npcCount += Number(article.damage.npc_affected || 0);
        }

    });

    /*
        Articles don't individually contain damage statistics,
        so use a more useful estimate based on event count.
    */

    npcCount = data.articles.length * 1000;

    $("#npcCount").textContent =
        formatNumber(npcCount);
}


/* =========================================
   RANDOM STORY
========================================= */

function randomArticle(list) {

    if (!list.length) {
        return null;
    }

    return list[
        Math.floor(Math.random() * list.length)
    ];
}


function getRandomLead() {

    const breaking = allArticles.filter(
        article =>
            article.priority === "URGENT" ||
            article.category === "BREAKING"
    );

    return randomArticle(
        breaking.length ? breaking : allArticles
    );
}


/* =========================================
   LEAD STORY
========================================= */

function renderLead() {

    let lead = getRandomLead();

    if (!lead) {
        return;
    }

    currentLead = lead;

    $("#leadCategory").textContent =
        `${lead.category} • ${lead.type}`;

    $("#leadHeadline").textContent =
        lead.headline;

    $("#leadSummary").textContent =
        lead.summary;

    $("#leadMeta").textContent =
        `${lead.world} • ${lead.location} • ${lead.reporter} • ${lead.published}`;

    $("#leadBody").textContent =
        lead.body;
}


/* =========================================
   LATEST NEWS
========================================= */

function renderLatest() {

    const container = $("#latestNews");

    const shuffled = [...allArticles]
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

    container.innerHTML = shuffled.map(article => `

        <article class="latest-item">

            <div class="time">
                ${escapeHTML(article.category)}
            </div>

            <h3>
                ${escapeHTML(article.headline)}
            </h3>

            <small>
                ${escapeHTML(article.world)}
                •
                ${escapeHTML(article.location)}
            </small>

        </article>

    `).join("");
}


/* =========================================
   MAIN NEWS GRID
========================================= */

function renderNewsGrid() {

    const container = $("#newsGrid");

    let articles = [...allArticles];

    if (activeCategory !== "ALL") {

        if (activeCategory === "WORLDS") {
            articles = articles;
        } else {
            articles = articles.filter(
                article =>
                    article.category === activeCategory
            );
        }
    }

    articles = articles
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);

    container.innerHTML = articles.map(article => `

        <article class="news-card">

            <div class="category">
                ${escapeHTML(article.category)}
            </div>

            <h3>
                ${escapeHTML(article.headline)}
            </h3>

            <p>
                ${escapeHTML(article.summary)}
            </p>

            <div class="meta">
                ${escapeHTML(article.world)}
                •
                ${escapeHTML(article.location)}
            </div>

        </article>

    `).join("");
}


/* =========================================
   THREE COLUMN SECTIONS
========================================= */

function renderSmallSection(
    selector,
    categories
) {

    const container = $(selector);

    let articles = allArticles
        .filter(article =>
            categories.includes(article.category)
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

    container.innerHTML = articles.map(article => `

        <article class="small-story">

            <small>
                ${escapeHTML(article.type)}
            </small>

            <h3>
                ${escapeHTML(article.headline)}
            </h3>

            <p>
                ${escapeHTML(article.summary)}
            </p>

        </article>

    `).join("");
}


/* =========================================
   WORLD NEWS
========================================= */

function renderWorldNews() {

    const container = $("#worldNews");

    const worlds = {};

    allArticles.forEach(article => {

        if (!worlds[article.world]) {
            worlds[article.world] = [];
        }

        worlds[article.world].push(article);
    });

    container.innerHTML = Object.keys(worlds)
        .map(world => {

            const story = randomArticle(worlds[world]);

            return `

                <article class="world-card">

                    <small>
                        WORLD DESK
                    </small>

                    <h3>
                        ${escapeHTML(world)}
                    </h3>

                    <p>
                        ${escapeHTML(story.headline)}
                    </p>

                    <small>
                        ${worlds[world].length}
                        reports available
                    </small>

                </article>

            `;

        })
        .join("");
}


/* =========================================
   BREAKING TICKER
========================================= */

function renderTicker() {

    const stories = allArticles
        .filter(article =>
            article.priority === "URGENT" ||
            article.category === "BREAKING"
        )
        .sort(() => Math.random() - 0.5);

    if (!stories.length) {
        return;
    }

    const story = stories[0];

    $("#breakingTicker").textContent =
        `${story.headline} — ${story.location}`;
}


/* =========================================
   HOMEPAGE
========================================= */

function renderHomepage() {

    renderLead();

    renderLatest();

    renderNewsGrid();

    renderSmallSection(
        "#npcNews",
        ["NPC LIFE", "LOCAL"]
    );

    renderSmallSection(
        "#businessNews",
        ["BUSINESS", "ECONOMY", "EMPLOYMENT"]
    );

    renderSmallSection(
        "#transportNews",
        ["TRANSPORT", "UTILITIES", "DAMAGE"]
    );

    renderWorldNews();

    renderTicker();
}


/* =========================================
   NEW RANDOM LEAD
========================================= */

$("#newLead").addEventListener(
    "click",
    () => {

        renderLead();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================
   NAVIGATION
========================================= */

document
    .querySelectorAll(".main-nav a")
    .forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

            activeCategory =
                link.dataset.category || "ALL";

            if (activeCategory === "WORLDS") {
                activeCategory = "WORLDS";
            }

            renderNewsGrid();

            document
                .querySelector(".news-grid-section")
                .scrollIntoView({
                    behavior: "smooth"
                });

        });

    });


/* =========================================
   DATE
========================================= */

function updateDate() {

    const date = new Date();

    $("#currentDate").textContent =
        date.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================
   START
========================================= */

updateDate();

loadNews();
