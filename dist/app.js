"use strict";

/* =========================================================
   NPC NEWS
   MAIN APPLICATION
========================================================= */

let NEWS = {
    site: {},
    events: [],
    articles: []
};

let ALL_EVENTS = [];
let ALL_ARTICLES = [];

let currentView = "ALL";
let currentEventId = null;
let currentArticleId = null;


/* =========================================================
   DOM
========================================================= */

const homepage = document.getElementById("homepage");
const incidentPage = document.getElementById("incidentPage");

const currentDate = document.getElementById("currentDate");

const eventCount = document.getElementById("eventCount");
const articleCount = document.getElementById("articleCount");
const npcCount = document.getElementById("npcCount");

const leadCategory = document.getElementById("leadCategory");
const leadHeadline = document.getElementById("leadHeadline");
const leadSummary = document.getElementById("leadSummary");
const leadMeta = document.getElementById("leadMeta");
const leadBody = document.getElementById("leadBody");

const latestNews = document.getElementById("latestNews");
const newsGrid = document.getElementById("newsGrid");

const npcNews = document.getElementById("npcNews");
const businessNews = document.getElementById("businessNews");
const transportNews = document.getElementById("transportNews");

const worldNews = document.getElementById("worldNews");

const breakingTicker = document.getElementById("breakingTicker");

const newLead = document.getElementById("newLead");
const backButton = document.getElementById("backButton");


/* =========================================================
   DATE
========================================================= */

function updateDate() {

    if (!currentDate) return;

    const now = new Date();

    currentDate.textContent = now.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatNumber(value) {

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return "0";
    }

    return n.toLocaleString("en-IN");
}


function indianNumber(value) {

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return "0";
    }

    return n.toLocaleString("en-IN");
}


function formatCurrency(value) {

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return "₹0";
    }

    return "₹" + n.toLocaleString("en-IN");
}


function shuffle(array) {

    return [...array].sort(() => Math.random() - 0.5);
}


function uniqueByHeadline(articles) {

    const seen = new Set();

    return articles.filter(article => {

        const headline = String(
            article.headline || ""
        )
        .trim()
        .toLowerCase();

        if (!headline) {
            return false;
        }

        if (seen.has(headline)) {
            return false;
        }

        seen.add(headline);

        return true;
    });
}


function normalizeArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}


/* =========================================================
   NORMALIZE EVENT
========================================================= */

function normalizeEvent(event) {

    if (!event || typeof event !== "object") {
        return null;
    }

    const damage = event.damage || {};
    const consequences = event.consequences || {};

    return {

        id:
            event.id ||
            event.event_id ||
            "",

        world:
            event.world ||
            "UNKNOWN WORLD",

        location:
            event.location ||
            "UNKNOWN LOCATION",

        category:
            event.category ||
            "BATTLE",

        title:
            event.title ||
            event.headline ||
            "Unknown Incident",

        overview:
            event.overview ||
            "",

        characters:
            normalizeArray(event.characters),

        winner:
            event.winner ||
            "UNKNOWN",

        duration:
            event.duration ||
            "Unknown",

        battle_summary:
            event.battle_summary ||
            event.battle ||
            "",

        damage: {

            buildings:
                Number(damage.buildings) || 0,

            roads:
                Number(damage.roads) || 0,

            vehicles:
                Number(damage.vehicles) || 0,

            businesses:
                Number(damage.businesses) || 0,

            npc_affected:
                Number(damage.npc_affected) || 0,

            injuries:
                Number(damage.injuries) || 0,

            missing:
                Number(damage.missing) || 0,

            displaced:
                Number(damage.displaced) || 0
        },

        consequences: {

            transport_routes:
                Number(
                    consequences.transport_routes
                ) || 0,

            schools_closed:
                Number(
                    consequences.schools_closed
                ) || 0,

            hospitals_affected:
                Number(
                    consequences.hospitals_affected
                ) || 0,

            utilities:
                consequences.utilities ||
                "No major utility information available.",

            economic_loss:
                Number(
                    consequences.economic_loss
                ) || 0
        },

        npc_quotes:
            normalizeArray(event.npc_quotes),

        timeline:
            normalizeArray(event.timeline),

        aftermath:
            event.aftermath ||
            ""
    };
}


/* =========================================================
   NORMALIZE ARTICLE
========================================================= */

function normalizeArticle(article) {

    if (!article || typeof article !== "object") {
        return null;
    }

    return {

        ...article,

        id:
            article.id ||
            randomID(),

        event_id:
            article.event_id ||
            article.eventId ||
            "",

        category:
            article.category ||
            "GENERAL",

        type:
            article.type ||
            "REPORT",

        priority:
            article.priority ||
            "NORMAL",

        headline:
            article.headline ||
            "Untitled Report",

        summary:
            article.summary ||
            "",

        body:
            article.body ||
            "",

        world:
            article.world ||
            "UNKNOWN WORLD",

        location:
            article.location ||
            "",

        winner:
            article.winner ||
            "",

        published:
            article.published ||
            new Date().toISOString(),

        reporter:
            article.reporter ||
            "NPC News Desk"
    };
}


function randomID() {

    return Math.random()
        .toString(36)
        .substring(2, 10);
}


/* =========================================================
   CREATE EVENTS FROM ARTICLES
   FALLBACK COMPATIBILITY
========================================================= */

function createEventsFromArticles(articles) {

    const map = new Map();

    articles.forEach(article => {

        const id =
            article.event_id ||
            article.eventId;

        if (!id) {
            return;
        }

        if (!map.has(id)) {

            map.set(
                id,
                normalizeEvent({

                    id,

                    world:
                        article.world,

                    location:
                        article.location,

                    category:
                        article.category,

                    title:
                        article.headline,

                    overview:
                        article.overview ||
                        "",

                    characters:
                        article.characters ||
                        [],

                    winner:
                        article.winner,

                    duration:
                        article.duration,

                    battle_summary:
                        article.battle_summary,

                    damage:
                        article.damage,

                    consequences:
                        article.consequences,

                    npc_quotes:
                        article.npc_quotes,

                    timeline:
                        article.timeline,

                    aftermath:
                        article.aftermath
                })
            );
        }
    });

    return [...map.values()];
}


/* =========================================================
   FIND EVENT / ARTICLE
========================================================= */

function getEvent(eventId) {

    return ALL_EVENTS.find(
        event =>
            String(event.id) === String(eventId)
    );
}


function getArticle(articleId) {

    return ALL_ARTICLES.find(
        article =>
            String(article.id) === String(articleId)
    );
}


function getArticlesForEvent(eventId) {

    return ALL_ARTICLES.filter(
        article =>
            String(article.event_id) ===
            String(eventId)
    );
}


/* =========================================================
   ARTICLE → EVENT
========================================================= */

function enrichEventsFromArticles() {

    ALL_EVENTS.forEach(event => {

        const articles =
            getArticlesForEvent(event.id);

        if (!articles.length) {
            return;
        }

        const first =
            articles.find(
                article =>
                    article.type === "BREAKING"
            ) ||
            articles[0];

        if (!event.title) {
            event.title =
                first.headline;
        }

        if (!event.overview) {
            event.overview =
                first.summary ||
                first.body ||
                "";
        }

        if (
            !event.battle_summary &&
            first.battle_summary
        ) {
            event.battle_summary =
                first.battle_summary;
        }

        if (
            (!event.characters ||
                !event.characters.length) &&
            first.characters
        ) {
            event.characters =
                first.characters;
        }

        if (
            event.winner === "UNKNOWN" &&
            first.winner
        ) {
            event.winner =
                first.winner;
        }

        if (
            event.duration === "Unknown" &&
            first.duration
        ) {
            event.duration =
                first.duration;
        }

        if (
            (!event.npc_quotes ||
                !event.npc_quotes.length) &&
            first.npc_quotes
        ) {
            event.npc_quotes =
                first.npc_quotes;
        }

        if (
            (!event.timeline ||
                !event.timeline.length) &&
            first.timeline
        ) {
            event.timeline =
                first.timeline;
        }

        if (
            !event.aftermath &&
            first.aftermath
        ) {
            event.aftermath =
                first.aftermath;
        }
    });
}


/* =========================================================
   LOAD NEWS
========================================================= */

async function loadNews() {

    try {

        const response = await fetch(
            "news.json?cache=" +
            Date.now()
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load news.json"
            );
        }

        const data =
            await response.json();

        NEWS = data || {};

        let rawEvents = [];

        let rawArticles = [];

        if (Array.isArray(data)) {

            rawArticles = data;

        } else {

            rawEvents =
                Array.isArray(data.events)
                    ? data.events
                    : [];

            rawArticles =
                Array.isArray(data.articles)
                    ? data.articles
                    : [];
        }


        ALL_ARTICLES =
            rawArticles
                .map(normalizeArticle)
                .filter(Boolean);


        ALL_EVENTS =
            rawEvents
                .map(normalizeEvent)
                .filter(Boolean);


        /*
         * FALLBACK
         *
         * If news.json does not contain events,
         * rebuild them from articles.
         */

        if (!ALL_EVENTS.length) {

            ALL_EVENTS =
                createEventsFromArticles(
                    ALL_ARTICLES
                );
        }


        enrichEventsFromArticles();


        /*
         * If articles do not exist,
         * create basic articles from events.
         */

        if (!ALL_ARTICLES.length) {

            ALL_ARTICLES =
                createArticlesFromEvents(
                    ALL_EVENTS
                );
        }


        renderStatistics();

        renderTicker();

        setupNavigation();

        handleHash();

    } catch (error) {

        console.error(error);

        if (homepage) {

            homepage.innerHTML = `
                <section class="incident-section">
                    <h2>NEWSROOM ERROR</h2>
                    <p>
                        NPC News could not load the newsroom data.
                    </p>
                    <p>
                        Please check that
                        <strong>news.json</strong>
                        exists inside the dist folder.
                    </p>
                </section>
            `;
        }
    }
}


/* =========================================================
   CREATE ARTICLES FROM EVENTS
========================================================= */

function createArticlesFromEvents(events) {

    const articles = [];

    events.forEach(event => {

        articles.push({

            id:
                randomID(),

            event_id:
                event.id,

            category:
                event.category,

            type:
                "BREAKING",

            priority:
                "HIGH",

            headline:
                event.title,

            summary:
                event.overview,

            body:
                event.overview,

            world:
                event.world,

            location:
                event.location,

            characters:
                event.characters,

            winner:
                event.winner,

            duration:
                event.duration,

            battle_summary:
                event.battle_summary,

            damage:
                event.damage,

            consequences:
                event.consequences,

            npc_quotes:
                event.npc_quotes,

            timeline:
                event.timeline,

            aftermath:
                event.aftermath,

            published:
                new Date().toISOString(),

            reporter:
                "NPC News Desk"
        });
    });

    return articles;
}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics() {

    if (eventCount) {

        eventCount.textContent =
            formatNumber(
                ALL_EVENTS.length
            );
    }


    if (articleCount) {

        articleCount.textContent =
            formatNumber(
                ALL_ARTICLES.length
            );
    }


    if (npcCount) {

        const total =
            ALL_EVENTS.reduce(
                (sum, event) =>
                    sum +
                    Number(
                        event.damage?.npc_affected
                    || 0),
                0
            );

        npcCount.textContent =
            formatNumber(total);
    }
}


/* =========================================================
   TICKER
========================================================= */

function renderTicker() {

    if (!breakingTicker) {
        return;
    }

    const breaking =
        ALL_ARTICLES.filter(
            article =>
                article.type === "BREAKING" ||
                article.priority === "HIGH"
        );

    const selected =
        breaking.length
            ? shuffle(breaking).slice(0, 5)
            : shuffle(ALL_ARTICLES).slice(0, 5);

    breakingTicker.innerHTML =
        selected
            .map(article => {

                return `
                    <span
                        class="ticker-item"
                        data-event-id="${escapeHTML(article.event_id)}"
                        data-article-id="${escapeHTML(article.id)}">

                        ${escapeHTML(article.headline)}

                    </span>
                `;

            })
            .join(" • ");
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".main-nav a[data-category]")
        .forEach(link => {

            /*
             * Prevent duplicate listeners.
             */

            if (
                link.dataset.navigationReady === "true"
            ) {
                return;
            }

            link.dataset.navigationReady =
                "true";


            link.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    const category =
                        this.dataset.category ||
                        "ALL";

                    navigateToCategory(
                        category
                    );
                }
            );
        });
}


/* =========================================================
   CATEGORY NAVIGATION
========================================================= */

function navigateToCategory(category) {

    category =
        String(category || "ALL")
            .trim()
            .toUpperCase();


    currentView = category;

    currentEventId = null;

    currentArticleId = null;


    /*
     * Change URL without reloading.
     */

    const hash =
        category === "ALL"
            ? "#home"
            : "#category/" +
              encodeURIComponent(category);

    if (
        window.location.hash !== hash
    ) {

        history.pushState(
            {
                category
            },
            "",
            hash
        );
    }


    showHomepage();


    /*
     * HOME
     */

    if (category === "ALL") {

        renderHomepage();

        return;
    }


    /*
     * WORLDS
     */

    if (category === "WORLDS") {

        renderWorldsPage();

        return;
    }


    /*
     * Other categories
     */

    renderCategoryPage(
        category
    );
}


/* =========================================================
   SHOW HOMEPAGE
========================================================= */

function showHomepage() {

    if (homepage) {

        homepage.style.display =
            "block";
    }

    if (incidentPage) {

        incidentPage.style.display =
            "none";
    }
}


function showIncidentPage() {

    if (homepage) {

        homepage.style.display =
            "none";
    }

    if (incidentPage) {

        incidentPage.style.display =
            "block";
    }
}


/* =========================================================
   HOMEPAGE
========================================================= */

function renderHomepage() {

    showHomepage();

    renderLead();

    renderLatest();

    renderNewsGrid();

    renderSmallSections();

    renderWorldNews();

    updateActiveNavigation(
        "ALL"
    );
}


/* =========================================================
   LEAD STORY
========================================================= */

function renderLead() {

    if (!leadHeadline) {
        return;
    }

    if (!ALL_ARTICLES.length) {
        return;
    }

    const breaking =
        ALL_ARTICLES.filter(
            article =>
                article.priority === "HIGH" ||
                article.type === "BREAKING"
        );

    const source =
        breaking.length
            ? breaking
            : ALL_ARTICLES;

    const article =
        source[
            Math.floor(
                Math.random() *
                source.length
            )
        ];


    leadCategory.textContent =
        article.category || "BREAKING";

    leadHeadline.textContent =
        article.headline;

    leadSummary.textContent =
        article.summary || "";

    leadMeta.innerHTML =
        `
            ${escapeHTML(article.world || "")}
            •
            ${escapeHTML(article.location || "")}
            •
            ${formatDate(article.published)}
        `;

    leadBody.innerHTML =
        article.body
            ? `<p>${escapeHTML(article.body)}</p>`
            : "";


    /*
     * Clicking the lead story
     * opens the whole incident.
     */

    const lead =
        document.querySelector(
            ".lead-story"
        );

    if (lead) {

        lead.dataset.eventId =
            article.event_id;

        lead.dataset.articleId =
            article.id;

        lead.style.cursor =
            "pointer";

        lead.onclick =
            function(event) {

                if (
                    event.target === newLead
                ) {
                    return;
                }

                openIncident(
                    article.event_id,
                    article.id
                );
            };
    }
}


/* =========================================================
   LATEST NEWS
========================================================= */

function renderLatest(
    articles = ALL_ARTICLES
) {

    if (!latestNews) {
        return;
    }

    const selected =
        uniqueByHeadline(
            [...articles]
                .sort(
                    (a, b) =>
                        new Date(
                            b.published
                        ) -
                        new Date(
                            a.published
                        )
                )
        ).slice(0, 10);


    latestNews.innerHTML =
        selected
            .map(article => {

                return articleCard(
                    article,
                    "compact"
                );

            })
            .join("");
}


/* =========================================================
   NEWS GRID
========================================================= */

function renderNewsGrid(
    articles = ALL_ARTICLES
) {

    if (!newsGrid) {
        return;
    }

    const selected =
        uniqueByHeadline(
            shuffle(articles)
        ).slice(0, 16);


    newsGrid.innerHTML =
        selected
            .map(article =>
                articleCard(
                    article,
                    "normal"
                )
            )
            .join("");
}


/* =========================================================
   SMALL SECTIONS
========================================================= */

function renderSmallSections(
    articles = ALL_ARTICLES
) {

    if (!npcNews ||
        !businessNews ||
        !transportNews) {
        return;
    }


    const npc =
        uniqueByHeadline(
            articles.filter(
                article =>
                    isNPCArticle(article)
            )
        ).slice(0, 5);


    const business =
        uniqueByHeadline(
            articles.filter(
                article =>
                    isBusinessArticle(article)
            )
        ).slice(0, 5);


    const transport =
        uniqueByHeadline(
            articles.filter(
                article =>
                    isTransportArticle(article)
            )
        ).slice(0, 5);


    npcNews.innerHTML =
        npc.map(
            article =>
                articleCard(
                    article,
                    "small"
                )
        ).join("");


    businessNews.innerHTML =
        business.map(
            article =>
                articleCard(
                    article,
                    "small"
                )
        ).join("");


    transportNews.innerHTML =
        transport.map(
            article =>
                articleCard(
                    article,
                    "small"
                )
        ).join("");
}


/* =========================================================
   ARTICLE CATEGORY HELPERS
========================================================= */

function isNPCArticle(article) {

    const text =
        (
            article.category +
            " " +
            article.headline +
            " " +
            article.type
        ).toUpperCase();

    return (
        text.includes("NPC") ||
        text.includes("HOUSING") ||
        text.includes("SOCIAL") ||
        text.includes("FOOD") ||
        text.includes("EMPLOYMENT") ||
        text.includes("COMMUNITY")
    );
}


function isBusinessArticle(article) {

    const text =
        (
            article.category +
            " " +
            article.headline +
            " " +
            article.type
        ).toUpperCase();

    return (
        text.includes("BUSINESS") ||
        text.includes("ECONOM") ||
        text.includes("INSURANCE") ||
        text.includes("EMPLOYMENT")
    );
}


function isTransportArticle(article) {

    const text =
        (
            article.category +
            " " +
            article.headline +
            " " +
            article.type
        ).toUpperCase();

    return (
        text.includes("TRANSPORT") ||
        text.includes("ROAD") ||
        text.includes("VEHICLE") ||
        text.includes("INFRASTRUCTURE")
    );
}


/* =========================================================
   ARTICLE CARD
========================================================= */

function articleCard(
    article,
    size = "normal"
) {

    return `

        <article
            class="news-card ${size}"
            data-event-id="${escapeHTML(article.event_id)}"
            data-article-id="${escapeHTML(article.id)}"
            tabindex="0"
            role="button">

            <div class="article-label">
                ${escapeHTML(
                    article.category ||
                    "NEWS"
                )}
            </div>

            <h3>
                ${escapeHTML(
                    article.headline
                )}
            </h3>

            ${
                size !== "compact"
                    ? `
                        <p>
                            ${escapeHTML(
                                article.summary ||
                                ""
                            )}
                        </p>
                    `
                    : ""
            }

            <div class="article-meta">

                ${escapeHTML(
                    article.world ||
                    ""
                )}

                •

                ${escapeHTML(
                    article.location ||
                    ""
                )}

                •

                ${formatDate(
                    article.published
                )}

            </div>

        </article>
    `;
}


/* =========================================================
   WORLD NEWS
========================================================= */

function renderWorldNews() {

    if (!worldNews) {
        return;
    }

    const worlds =
        [...new Set(
            ALL_EVENTS.map(
                event => event.world
            )
        )];


    worldNews.innerHTML =
        worlds.map(world => {

            const event =
                ALL_EVENTS.find(
                    item =>
                        item.world === world
                );

            if (!event) {
                return "";
            }

            const articles =
                getArticlesForEvent(
                    event.id
                );

            const article =
                articles[0];


            return `

                <article
                    class="world-card"
                    data-event-id="${escapeHTML(event.id)}"
                    data-article-id="${
                        escapeHTML(
                            article?.id || ""
                        )
                    }"
                    tabindex="0"
                    role="button">

                    <div class="article-label">
                        WORLD
                    </div>

                    <h3>
                        ${escapeHTML(world)}
                    </h3>

                    <strong>
                        ${escapeHTML(
                            event.location
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            event.title
                        )}
                    </p>

                </article>

            `;

        }).join("");
}


/* =========================================================
   CATEGORY PAGE
========================================================= */

function renderCategoryPage(
    category
) {

    showHomepage();

    updateActiveNavigation(
        category
    );


    let filtered = [];


    switch (category) {

        case "BREAKING":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        article.type === "BREAKING" ||
                        article.priority === "HIGH"
                );

            break;


        case "BATTLE":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        containsAny(
                            article,
                            [
                                "BATTLE",
                                "FIGHT",
                                "DUEL",
                                "COMBAT"
                            ]
                        )
                );

            break;


        case "NPC LIFE":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        isNPCArticle(article)
                );

            break;


        case "DAMAGE":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        containsAny(
                            article,
                            [
                                "DAMAGE",
                                "DESTROY",
                                "DESTRUCTION",
                                "REPAIR",
                                "DEBRIS",
                                "BUILDING",
                                "INJUR"
                            ]
                        )
                );

            break;


        case "BUSINESS":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        isBusinessArticle(article)
                );

            break;


        case "TRANSPORT":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        isTransportArticle(article)
                );

            break;


        case "HOUSING":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        containsAny(
                            article,
                            [
                                "HOUSING",
                                "APARTMENT",
                                "HOME",
                                "RESIDENT",
                                "DISPLACED"
                            ]
                        )
                );

            break;


        case "HEALTH":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        containsAny(
                            article,
                            [
                                "HEALTH",
                                "HOSPITAL",
                                "INJUR",
                                "MEDICAL",
                                "EMERGENCY",
                                "AMBULANCE"
                            ]
                        )
                );

            break;


        default:

            filtered =
                ALL_ARTICLES;
    }


    /*
     * If the exact keyword produced nothing,
     * show articles from matching events.
     */

    if (!filtered.length) {

        filtered =
            ALL_ARTICLES.filter(
                article =>
                    String(
                        article.category || ""
                    ).toUpperCase() ===
                    category
            );
    }


    /*
     * Build a clean category page
     * inside the existing homepage.
     */

    renderFilteredHomepage(
        category,
        filtered
    );
}


/* =========================================================
   FILTERED HOMEPAGE
========================================================= */

function renderFilteredHomepage(
    category,
    articles
) {

    showHomepage();


    const uniqueArticles =
        uniqueByHeadline(
            articles
        );


    /*
     * Lead
     */

    const lead =
        uniqueArticles[0];


    if (lead) {

        leadCategory.textContent =
            category;

        leadHeadline.textContent =
            lead.headline;

        leadSummary.textContent =
            lead.summary || "";

        leadMeta.innerHTML = `
            ${escapeHTML(
                lead.world || ""
            )}
            •
            ${escapeHTML(
                lead.location || ""
            )}
            •
            ${formatDate(
                lead.published
            )}
        `;

        leadBody.innerHTML =
            lead.body
                ? `<p>${escapeHTML(
                    lead.body
                )}</p>`
                : "";


        const leadStory =
            document.querySelector(
                ".lead-story"
            );

        if (leadStory) {

            leadStory.dataset.eventId =
                lead.event_id;

            leadStory.dataset.articleId =
                lead.id;

            leadStory.style.cursor =
                "pointer";

            leadStory.onclick =
                function(event) {

                    if (
                        event.target ===
                        newLead
                    ) {
                        return;
                    }

                    openIncident(
                        lead.event_id,
                        lead.id
                    );
                };
        }
    }


    /*
     * Latest
     */

    renderLatest(
        uniqueArticles
    );


    /*
     * Grid
     */

    renderNewsGrid(
        uniqueArticles
    );


    /*
     * Section columns
     */

    renderSmallSections(
        uniqueArticles
    );


    /*
     * World section
     */

    renderWorldNews();


    /*
     * Update section title.
     */

    const heading =
        document.querySelector(
            ".news-grid-section .section-heading h2"
        );

    if (heading) {

        heading.textContent =
            category === "BREAKING"
                ? "BREAKING NEWS"
                : category === "BATTLE"
                    ? "BATTLE COVERAGE"
                    : category === "NPC LIFE"
                        ? "NPC LIFE"
                        : category === "DAMAGE"
                            ? "DAMAGE REPORTS"
                            : category === "BUSINESS"
                                ? "BUSINESS & ECONOMY"
                                : category === "TRANSPORT"
                                    ? "TRANSPORT & INFRASTRUCTURE"
                                    : category === "HOUSING"
                                        ? "HOUSING & RESIDENTS"
                                        : category === "HEALTH"
                                            ? "HEALTH & EMERGENCY SERVICES"
                                            : "LATEST REPORTS";
    }


    const subtitle =
        document.querySelector(
            ".news-grid-section .section-heading span"
        );

    if (subtitle) {

        subtitle.textContent =
            formatNumber(
                uniqueArticles.length
            ) +
            " REPORTS";
    }
}


/* =========================================================
   WORLDS PAGE
========================================================= */

function renderWorldsPage() {

    showHomepage();

    updateActiveNavigation(
        "WORLDS"
    );


    const worlds =
        [...new Set(
            ALL_EVENTS.map(
                event => event.world
            )
        )];


    /*
     * Hide normal homepage sections.
     */

    const leadSection =
        document.querySelector(
            ".lead-section"
        );

    const gridSection =
        document.querySelector(
            ".news-grid-section"
        );

    const threeColumn =
        document.querySelector(
            ".three-column"
        );

    const worldsSection =
        document.querySelector(
            ".worlds-section"
        );


    if (leadSection) {
        leadSection.style.display =
            "none";
    }

    if (gridSection) {
        gridSection.style.display =
            "none";
    }

    if (threeColumn) {
        threeColumn.style.display =
            "none";
    }

    if (worldsSection) {
        worldsSection.style.display =
            "block";
    }


    const heading =
        document.querySelector(
            ".worlds-section .section-heading h2"
        );

    if (heading) {

        heading.textContent =
            "ALL FICTIONAL WORLDS";
    }


    worldNews.innerHTML =
        worlds.map(world => {

            const event =
                ALL_EVENTS.find(
                    item =>
                        item.world === world
                );

            const articles =
                getArticlesForEvent(
                    event.id
                );

            return `

                <article
                    class="world-card"
                    data-event-id="${escapeHTML(event.id)}"
                    data-article-id="${
                        escapeHTML(
                            articles[0]?.id || ""
                        )
                    }"
                    tabindex="0"
                    role="button">

                    <div class="article-label">
                        WORLD
                    </div>

                    <h2>
                        ${escapeHTML(
                            world
                        )}
                    </h2>

                    <strong>
                        ${escapeHTML(
                            event.location
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            event.title
                        )}
                    </p>

                    <div class="article-meta">

                        ${
                            articles.length
                        }
                        reports

                        •

                        ${
                            formatNumber(
                                event.damage
                                    .npc_affected
                            )
                        }
                        NPCs affected

                    </div>

                </article>

            `;

        }).join("");
}


/* =========================================================
   RESTORE NORMAL HOMEPAGE SECTIONS
========================================================= */

function restoreHomepageSections() {

    const leadSection =
        document.querySelector(
            ".lead-section"
        );

    const gridSection =
        document.querySelector(
            ".news-grid-section"
        );

    const threeColumn =
        document.querySelector(
            ".three-column"
        );

    const worldsSection =
        document.querySelector(
            ".worlds-section"
        );


    if (leadSection) {
        leadSection.style.display =
            "";
    }

    if (gridSection) {
        gridSection.style.display =
            "";
    }

    if (threeColumn) {
        threeColumn.style.display =
            "";
    }

    if (worldsSection) {
        worldsSection.style.display =
            "";
    }
}


/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

function updateActiveNavigation(
    category
) {

    document
        .querySelectorAll(
            ".main-nav a[data-category]"
        )
        .forEach(link => {

            const linkCategory =
                String(
                    link.dataset.category ||
                    ""
                ).toUpperCase();


            link.classList.toggle(
                "active",
                linkCategory ===
                category
            );
        });
}


/* =========================================================
   INCIDENT
========================================================= */

function openIncident(
    eventId,
    articleId = null
) {

    const event =
        getEvent(eventId);

    if (!event) {

        console.error(
            "Event not found:",
            eventId
        );

        return;
    }


    const eventArticles =
        getArticlesForEvent(
            eventId
        );


    let article =
        articleId
            ? getArticle(articleId)
            : null;


    /*
     * Make sure selected article
     * actually belongs to this event.
     */

    if (
        !article ||
        String(article.event_id) !==
        String(eventId)
    ) {

        article =
            eventArticles.find(
                item =>
                    item.type ===
                    "BREAKING"
            ) ||
            eventArticles[0];
    }


    currentEventId =
        event.id;

    currentArticleId =
        article?.id || null;


    /*
     * IMPORTANT:
     * Store article ID in hash.
     *
     * Example:
     *
     * #incident/river-market/article123
     */

    const hash =
        "#incident/" +
        encodeURIComponent(
            event.id
        ) +
        (
            article?.id
                ? "/" +
                  encodeURIComponent(
                      article.id
                  )
                : ""
        );


    if (
        window.location.hash !== hash
    ) {

        history.pushState(
            {
                eventId: event.id,
                articleId:
                    article?.id || null
            },
            "",
            hash
        );
    }


    showIncidentPage();


    renderIncident(
        event,
        article
    );
}


/* =========================================================
   RENDER INCIDENT
========================================================= */

function renderIncident(
    event,
    article
) {

    const category =
        article?.category ||
        event.category ||
        "INCIDENT";


    const headline =
        article?.headline ||
        event.title ||
        "Incident";


    const summary =
        article?.summary ||
        event.overview ||
        "";


    const world =
        event.world ||
        article?.world ||
        "UNKNOWN WORLD";


    const location =
        event.location ||
        article?.location ||
        "";


    document.getElementById(
        "incidentCategory"
    ).textContent =
        category;


    document.getElementById(
        "incidentWorld"
    ).textContent =
        world +
        (
            location
                ? " • " + location
                : ""
        );


    document.getElementById(
        "incidentHeadline"
    ).textContent =
        headline;


    document.getElementById(
        "incidentSummary"
    ).textContent =
        summary;


    document.getElementById(
        "incidentMeta"
    ).innerHTML = `

        ${
            escapeHTML(
                event.world
            )
        }

        •

        ${
            escapeHTML(
                event.location
            )
        }

        •

        Duration:
        ${
            escapeHTML(
                event.duration
            )
        }

        •

        ${
            formatDate(
                article?.published
            )
        }

    `;


    /*
     * Overview
     */

    document.getElementById(
        "incidentOverview"
    ).innerHTML = `

        <p>

            ${
                escapeHTML(
                    event.overview ||
                    article?.body ||
                    summary
                )
            }

        </p>

    `;


    /*
     * Characters
     */

    renderCharacters(
        event
    );


    /*
     * Timeline
     */

    renderTimeline(
        event
    );


    /*
     * Battle
     */

    document.getElementById(
        "incidentBattle"
    ).innerHTML = `

        <p>

            ${
                escapeHTML(
                    event.battle_summary ||
                    article?.body ||
                    "Battle details are still being reported."
                )
            }

        </p>

    `;


    /*
     * Damage
     */

    renderDamage(
        event
    );


    /*
     * NPC Impact
     */

    renderNPCImpact(
        event
    );


    /*
     * Quotes
     */

    renderQuotes(
        event
    );


    /*
     * Aftermath
     */

    document.getElementById(
        "incidentAftermath"
    ).innerHTML = `

        <p>

            ${
                escapeHTML(
                    event.aftermath ||
                    "Authorities are continuing to assess the aftermath."
                )
            }

        </p>

    `;


    /*
     * Related coverage
     */

    renderRelatedArticles(
        event
    );


    /*
     * Facts
     */

    renderFacts(
        event
    );


    /*
     * Winner
     */

    const winner =
        document.getElementById(
            "incidentWinner"
        );

    if (winner) {

        winner.innerHTML = `

            <strong>
                ${
                    escapeHTML(
                        event.winner
                    )
                }
            </strong>

            <p>
                Officially recorded winner.
            </p>

        `;
    }


    /*
     * Scroll to top.
     */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   CHARACTERS
========================================================= */

function renderCharacters(
    event
) {

    const container =
        document.getElementById(
            "incidentCharacters"
        );

    if (!container) {
        return;
    }


    const characters =
        event.characters || [];


    if (!characters.length) {

        container.innerHTML =
            `<p>No character information available.</p>`;

        return;
    }


    container.innerHTML =
        characters.map(
            character => {

                if (
                    typeof character ===
                    "string"
                ) {

                    return `
                        <div class="character-card">
                            <strong>
                                ${escapeHTML(
                                    character
                                )}
                            </strong>
                        </div>
                    `;
                }


                return `

                    <div class="character-card">

                        <strong>
                            ${escapeHTML(
                                character.name ||
                                "Unknown"
                            )}
                        </strong>

                        ${
                            character.role
                                ? `
                                    <span>
                                        ${escapeHTML(
                                            character.role
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                `;
            }
        ).join("");
}


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline(
    event
) {

    const container =
        document.getElementById(
            "incidentTimeline"
        );

    if (!container) {
        return;
    }


    const timeline =
        event.timeline || [];


    if (!timeline.length) {

        container.innerHTML =
            `<p>No detailed timeline available.</p>`;

        return;
    }


    container.innerHTML =
        timeline.map(
            item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    return `

                        <div class="timeline-item">

                            <div>
                                ${escapeHTML(
                                    item
                                )}
                            </div>

                        </div>

                    `;
                }


                return `

                    <div class="timeline-item">

                        ${
                            item.time
                                ? `
                                    <strong>
                                        ${escapeHTML(
                                            item.time
                                        )}
                                    </strong>
                                `
                                : ""
                        }

                        <div>
                            ${escapeHTML(
                                item.description ||
                                item.text ||
                                ""
                            )}
                        </div>

                    </div>

                `;
            }
        ).join("");
}


/* =========================================================
   DAMAGE
========================================================= */

function renderDamage(
    event
) {

    const container =
        document.getElementById(
            "damageGrid"
        );

    if (!container) {
        return;
    }


    const damage =
        event.damage || {};


    const cards = [

        [
            "Buildings",
            damage.buildings
        ],

        [
            "Roads",
            damage.roads
        ],

        [
            "Vehicles",
            damage.vehicles
        ],

        [
            "Businesses",
            damage.businesses
        ],

        [
            "NPCs Affected",
            damage.npc_affected
        ],

        [
            "Injuries",
            damage.injuries
        ],

        [
            "Missing",
            damage.missing
        ],

        [
            "Displaced",
            damage.displaced
        ]

    ];


    container.innerHTML =
        cards.map(
            ([label, value]) => `

                <div class="damage-card">

                    <strong>
                        ${formatNumber(value)}
                    </strong>

                    <span>
                        ${escapeHTML(label)}
                    </span>

                </div>

            `
        ).join("");
}


/* =========================================================
   NPC IMPACT
========================================================= */

function renderNPCImpact(
    event
) {

    const container =
        document.getElementById(
            "npcImpact"
        );

    if (!container) {
        return;
    }


    const c =
        event.consequences || {};


    const cards = [

        [
            "Transport Routes",
            c.transport_routes
        ],

        [
            "Schools Closed",
            c.schools_closed
        ],

        [
            "Hospitals Affected",
            c.hospitals_affected
        ],

        [
            "Economic Loss",
            formatCurrency(
                c.economic_loss
            )
        ]

    ];


    container.innerHTML =
        cards.map(
            ([label, value]) => `

                <div class="impact-card">

                    <strong>
                        ${
                            typeof value ===
                            "number"
                                ? formatNumber(value)
                                : escapeHTML(value)
                        }
                    </strong>

                    <span>
                        ${escapeHTML(label)}
                    </span>

                </div>

            `
        ).join("");


    if (c.utilities) {

        container.innerHTML += `

            <div class="impact-card wide">

                <strong>
                    Utilities
                </strong>

                <span>
                    ${escapeHTML(
                        c.utilities
                    )}
                </span>

            </div>

        `;
    }
}


/* =========================================================
   NPC QUOTES
========================================================= */

function renderQuotes(
    event
) {

    const container =
        document.getElementById(
            "npcQuotes"
        );

    if (!container) {
        return;
    }


    const quotes =
        event.npc_quotes || [];


    if (!quotes.length) {

        container.innerHTML =
            `<p>No resident interviews available.</p>`;

        return;
    }


    container.innerHTML =
        quotes.map(
            quote => {

                if (
                    typeof quote ===
                    "string"
                ) {

                    return `

                        <blockquote>
                            “${escapeHTML(
                                quote
                            )}”
                        </blockquote>

                    `;
                }


                return `

                    <blockquote>

                        <p>
                            “${escapeHTML(
                                quote.text ||
                                quote.quote ||
                                ""
                            )}”
                        </p>

                        ${
                            quote.name
                                ? `
                                    <cite>
                                        — ${
                                            escapeHTML(
                                                quote.name
                                            )
                                        }
                                    </cite>
                                `
                                : ""
                        }

                    </blockquote>

                `;
            }
        ).join("");
}


/* =========================================================
   RELATED ARTICLES
========================================================= */

function renderRelatedArticles(
    event
) {

    const container =
        document.getElementById(
            "relatedArticles"
        );

    if (!container) {
        return;
    }


    const articles =
        uniqueByHeadline(
            getArticlesForEvent(
                event.id
            )
        ).slice(0, 12);


    container.innerHTML =
        articles.map(
            article =>
                articleCard(
                    article,
                    "small"
                )
        ).join("");
}


/* =========================================================
   INCIDENT FACTS
========================================================= */

function renderFacts(
    event
) {

    const container =
        document.getElementById(
            "incidentFacts"
        );

    if (!container) {
        return;
    }


    const damage =
        event.damage || {};


    const consequences =
        event.consequences || {};


    container.innerHTML = `

        <div class="fact-row">

            <span>World</span>

            <strong>
                ${escapeHTML(
                    event.world
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Location</span>

            <strong>
                ${escapeHTML(
                    event.location
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Duration</span>

            <strong>
                ${escapeHTML(
                    event.duration
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Buildings</span>

            <strong>
                ${formatNumber(
                    damage.buildings
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Roads</span>

            <strong>
                ${formatNumber(
                    damage.roads
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Vehicles</span>

            <strong>
                ${formatNumber(
                    damage.vehicles
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>NPCs Affected</span>

            <strong>
                ${formatNumber(
                    damage.npc_affected
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Injuries</span>

            <strong>
                ${formatNumber(
                    damage.injuries
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Missing</span>

            <strong>
                ${formatNumber(
                    damage.missing
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Displaced</span>

            <strong>
                ${formatNumber(
                    damage.displaced
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>Economic Loss</span>

            <strong>
                ${formatCurrency(
                    consequences.economic_loss
                )}
            </strong>

        </div>

    `;
}


/* =========================================================
   CLICK HANDLING
========================================================= */

function setupGlobalClicks() {

    document.addEventListener(
        "click",
        function(event) {

            /*
             * Find nearest article/card
             * carrying event information.
             */

            const target =
                event.target.closest(
                    "[data-event-id]"
                );


            if (!target) {
                return;
            }


            /*
             * Do not intercept navigation links.
             */

            if (
                target.tagName === "A" ||
                target.closest("a")
            ) {
                return;
            }


            /*
             * Do not intercept buttons.
             */

            if (
                target.tagName === "BUTTON" ||
                target.closest("button")
            ) {
                return;
            }


            const eventId =
                target.dataset.eventId;

            const articleId =
                target.dataset.articleId ||
                null;


            if (!eventId) {
                return;
            }


            openIncident(
                eventId,
                articleId
            );
        }
    );


    /*
     * Keyboard support.
     */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }


            const target =
                document.activeElement;


            if (
                !target ||
                !target.dataset ||
                !target.dataset.eventId
            ) {
                return;
            }


            event.preventDefault();


            openIncident(
                target.dataset.eventId,
                target.dataset.articleId ||
                null
            );
        }
    );
}


/* =========================================================
   BACK BUTTON
========================================================= */

function setupBackButton() {

    if (!backButton) {
        return;
    }


    backButton.addEventListener(
        "click",
        function() {

            /*
             * Browser history is preferable.
             */

            if (
                document.referrer &&
                window.history.length > 1
            ) {

                history.back();

                return;
            }


            navigateToCategory(
                currentView || "ALL"
            );
        }
    );
}


/* =========================================================
   NEW LEAD BUTTON
========================================================= */

function setupNewLead() {

    if (!newLead) {
        return;
    }


    newLead.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            renderLead();
        }
    );
}


/* =========================================================
   HASH ROUTING
========================================================= */

function handleHash() {

    const hash =
        window.location.hash || "";


    /*
     * HOME
     */

    if (
        hash === "" ||
        hash === "#home" ||
        hash === "#"
    ) {

        currentView = "ALL";

        restoreHomepageSections();

        renderHomepage();

        return;
    }


    /*
     * CATEGORY
     */

    if (
        hash.startsWith(
            "#category/"
        )
    ) {

        const category =
            decodeURIComponent(
                hash
                    .replace(
                        "#category/",
                        ""
                    )
            );


        currentView =
            category.toUpperCase();


        restoreHomepageSections();

        renderCategoryPage(
            currentView
        );

        return;
    }


    /*
     * INCIDENT
     *
     * #incident/eventId/articleId
     */

    if (
        hash.startsWith(
            "#incident/"
        )
    ) {

        const parts =
            hash
                .replace(
                    "#incident/",
                    ""
                )
                .split("/");


        const eventId =
            decodeURIComponent(
                parts[0] || ""
            );


        const articleId =
            parts[1]
                ? decodeURIComponent(
                    parts[1]
                )
                : null;


        const event =
            getEvent(eventId);


        if (!event) {

            navigateToCategory(
                "ALL"
            );

            return;
        }


        currentEventId =
            eventId;

        currentArticleId =
            articleId;


        const article =
            articleId
                ? getArticle(
                    articleId
                )
                : getArticlesForEvent(
                    eventId
                )[0];


        showIncidentPage();


        renderIncident(
            event,
            article
        );

        return;
    }


    /*
     * Unknown hash.
     */

    navigateToCategory(
        "ALL"
    );
}


/* =========================================================
   BROWSER BACK / FORWARD
========================================================= */

window.addEventListener(
    "popstate",
    function() {

        handleHash();
    }
);


window.addEventListener(
    "hashchange",
    function() {

        handleHash();
    }
);


/* =========================================================
   CATEGORY SEARCH
========================================================= */

function containsAny(
    article,
    keywords
) {

    const text =
        (
            String(
                article.category || ""
            ) +
            " " +
            String(
                article.type || ""
            ) +
            " " +
            String(
                article.headline || ""
            ) +
            " " +
            String(
                article.summary || ""
            ) +
            " " +
            String(
                article.body || ""
            )
        ).toUpperCase();


    return keywords.some(
        keyword =>
            text.includes(
                String(
                    keyword
                ).toUpperCase()
            )
    );
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateDate();

        setupGlobalClicks();

        setupBackButton();

        setupNewLead();

        loadNews();
    }
);
