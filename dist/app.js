let allArticles = [];
let allEvents = [];

const homepage = document.getElementById("homepage");
const incidentPage = document.getElementById("incidentPage");
const newsGrid = document.getElementById("newsGrid");
const incidentContent = document.getElementById("incidentContent");
const backToNews = document.getElementById("backToNews");


// ============================================================
// LOAD NEWS
// ============================================================

async function loadNews() {
    try {
        const response = await fetch("news.json?v=" + Date.now());

        if (!response.ok) {
            throw new Error("Unable to load news.json");
        }

        const data = await response.json();

        // New format
        if (Array.isArray(data)) {
            allArticles = data;
            allEvents = [];
        } else {
            allArticles = data.articles || [];
            allEvents = data.events || [];
        }

        renderNews();

        handleHash();

    } catch (error) {
        console.error(error);

        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="error-box">
                    <h2>NEWSROOM ERROR</h2>
                    <p>Unable to load the latest news.</p>
                    <p>Please check that <strong>news.json</strong> exists.</p>
                </div>
            `;
        }
    }
}


// ============================================================
// RENDER NEWS
// ============================================================

function renderNews() {

    if (!newsGrid) return;

    if (!allArticles.length) {
        newsGrid.innerHTML = `
            <div class="empty-news">
                <h2>No stories available.</h2>
            </div>
        `;

        return;
    }

    newsGrid.innerHTML = allArticles
        .slice(0, 50)
        .map(article => createArticleCard(article))
        .join("");

    attachArticleEvents();
}


// ============================================================
// ARTICLE CARD
// ============================================================

function createArticleCard(article) {

    const category =
        article.category ||
        article.type ||
        "NEWS";

    const headline =
        article.headline ||
        article.title ||
        "Untitled Story";

    const summary =
        article.summary ||
        article.description ||
        article.body ||
        "";

    const location =
        article.location ||
        article.world ||
        "FICTIONAL WORLD";

    const time =
        article.published ||
        article.time ||
        "";

    const eventId =
        article.event_id ||
        article.eventId ||
        article.id;

    return `
        <article
            class="news-card"
            data-event-id="${escapeHTML(eventId)}"
        >

            <div class="article-category">
                ${escapeHTML(category)}
            </div>

            <h2 class="article-headline">
                ${escapeHTML(headline)}
            </h2>

            <div class="article-meta">
                ${escapeHTML(location)}
                ${time ? " • " + escapeHTML(time) : ""}
            </div>

            <p class="article-summary">
                ${escapeHTML(summary)}
            </p>

            <button
                class="read-more"
                type="button"
                data-event-id="${escapeHTML(eventId)}"
            >
                READ FULL INCIDENT →
            </button>

        </article>
    `;
}


// ============================================================
// ATTACH CLICK EVENTS
// ============================================================

function attachArticleEvents() {

    const cards = document.querySelectorAll(".news-card");

    cards.forEach(card => {

        card.addEventListener("click", function(event) {

            // Prevent double triggering when button itself is clicked
            if (event.target.closest(".read-more")) {
                return;
            }

            const eventId = card.dataset.eventId;

            if (eventId) {
                openIncident(eventId);
            }

        });
    });


    const buttons = document.querySelectorAll(".read-more");

    buttons.forEach(button => {

        button.addEventListener("click", function(event) {

            event.preventDefault();
            event.stopPropagation();

            const eventId = button.dataset.eventId;

            if (eventId) {
                openIncident(eventId);
            }

        });

    });
}


// ============================================================
// OPEN INCIDENT
// ============================================================

function openIncident(eventId) {

    console.log("Opening incident:", eventId);

    let eventData = allEvents.find(
        event => event.id === eventId
    );

    /*
        If events are not separately stored,
        find information from the articles.
    */

    if (!eventData) {

        const relatedArticles = allArticles.filter(
            article =>
                (article.event_id || article.eventId || article.id) === eventId
        );

        if (relatedArticles.length) {

            const first = relatedArticles[0];

            eventData = {
                id: eventId,
                world: first.world || "UNKNOWN WORLD",
                location: first.location || "UNKNOWN LOCATION",
                characters: first.characters || [],
                winner: first.winner || "UNKNOWN",
                duration: first.duration || "Unknown",
                damage: first.damage || {},
                consequences: first.consequences || {},
                npc_quotes: first.npc_quotes || [],
                timeline: first.timeline || [],
                official_response: first.official_response || [],
                aftermath: first.aftermath || {}
            };
        }
    }


    if (!eventData) {

        alert(
            "This article does not have an incident attached to it."
        );

        return;
    }


    /*
        Put the incident ID into the URL.
        This allows refreshing/back button/direct links.
    */

    window.location.hash =
        "incident/" + encodeURIComponent(eventId);


    showIncident(eventData);
}


// ============================================================
// SHOW INCIDENT
// ============================================================

function showIncident(eventData) {

    homepage.classList.add("hidden");
    incidentPage.classList.remove("hidden");

    document.body.classList.add("viewing-incident");

    incidentContent.innerHTML = buildIncident(eventData);

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


// ============================================================
// BUILD COMPLETE INCIDENT
// ============================================================

function buildIncident(event) {

    const characters = event.characters || [];

    const damage = event.damage || {};

    const consequences = event.consequences || {};

    const quotes = event.npc_quotes || [];

    const timeline = event.timeline || [];

    const officialResponse =
        event.official_response || [];

    const aftermath =
        event.aftermath || {};


    return `

        <div class="incident-kicker">
            ${escapeHTML(event.world || "FICTIONAL WORLD")}
        </div>


        <h1 class="incident-title">
            ${escapeHTML(event.location || "Unknown Location")}
        </h1>


        <div class="incident-subtitle">
            COMPLETE INCIDENT REPORT
        </div>


        <div class="incident-rule"></div>


        <!-- INCIDENT SUMMARY -->

        <section class="incident-section">

            <div class="section-label">
                INCIDENT SUMMARY
            </div>

            <div class="incident-summary-box">

                <div>
                    <span>LOCATION</span>
                    <strong>
                        ${escapeHTML(event.location || "Unknown")}
                    </strong>
                </div>

                <div>
                    <span>WORLD</span>
                    <strong>
                        ${escapeHTML(event.world || "Unknown")}
                    </strong>
                </div>

                <div>
                    <span>DURATION</span>
                    <strong>
                        ${escapeHTML(event.duration || "Unknown")}
                    </strong>
                </div>

                <div>
                    <span>WINNER</span>
                    <strong>
                        ${escapeHTML(event.winner || "Unknown")}
                    </strong>
                </div>

            </div>

        </section>


        <!-- PEOPLE INVOLVED -->

        <section class="incident-section">

            <div class="section-label">
                THE PEOPLE INVOLVED
            </div>

            <div class="fighters">

                ${
                    characters.map((character, index) => `
                        <div class="fighter">

                            <span class="fighter-number">
                                ${index + 1}
                            </span>

                            <strong>
                                ${escapeHTML(character)}
                            </strong>

                        </div>
                    `).join("")
                }

            </div>

        </section>


        <!-- TIMELINE -->

        <section class="incident-section">

            <div class="section-label">
                INCIDENT TIMELINE
            </div>

            ${
                timeline.length
                ?
                `
                    <div class="timeline">

                        ${
                            timeline.map(item => `

                                <div class="timeline-item">

                                    <div class="timeline-time">
                                        ${escapeHTML(item.time || "")}
                                    </div>

                                    <div class="timeline-content">

                                        <h3>
                                            ${escapeHTML(item.title || "")}
                                        </h3>

                                        <p>
                                            ${escapeHTML(item.description || "")}
                                        </p>

                                    </div>

                                </div>

                            `).join("")
                        }

                    </div>
                `
                :
                `
                    <p class="muted">
                        A detailed incident timeline is being compiled.
                    </p>
                `
            }

        </section>


        <!-- BATTLE -->

        <section class="incident-section">

            <div class="section-label">
                THE BATTLE
            </div>

            <p class="large-copy">

                ${
                    characters.length >= 2
                    ?
                    `
                    ${escapeHTML(characters[0])}
                    confronted
                    ${escapeHTML(characters[1])}
                    in ${escapeHTML(event.location || "the affected area")}.
                    The confrontation lasted
                    ${escapeHTML(event.duration || "an unknown period")}.
                    `
                    :
                    `
                    A major confrontation was reported in
                    ${escapeHTML(event.location || "the affected area")}.
                    `
                }

            </p>

            <p class="large-copy">

                The confrontation eventually ended with
                <strong>
                    ${escapeHTML(event.winner || "no confirmed winner")}
                </strong>
                reported as the victor.

            </p>

        </section>


        <!-- DAMAGE -->

        <section class="incident-section">

            <div class="section-label">
                DAMAGE REPORT
            </div>

            <div class="damage-grid">

                ${statBox("BUILDINGS", damage.buildings)}
                ${statBox("ROADS", damage.roads)}
                ${statBox("VEHICLES", damage.vehicles)}
                ${statBox("BUSINESSES", damage.businesses)}
                ${statBox("NPCs AFFECTED", damage.npc_affected)}
                ${statBox("INJURIES", damage.injuries)}
                ${statBox("MISSING", damage.missing)}
                ${statBox("DISPLACED", damage.displaced)}

            </div>

        </section>


        <!-- NPC LIFE -->

        <section class="incident-section">

            <div class="section-label">
                HOW NPC LIFE WAS AFFECTED
            </div>

            <div class="consequence-list">

                ${
                    consequences.transport_routes !== undefined
                    ?
                    `
                    <div>
                        <strong>
                            ${escapeHTML(consequences.transport_routes)}
                        </strong>
                        transport routes affected
                    </div>
                    `
                    : ""
                }


                ${
                    consequences.schools_closed !== undefined
                    ?
                    `
                    <div>
                        <strong>
                            ${escapeHTML(consequences.schools_closed)}
                        </strong>
                        schools closed
                    </div>
                    `
                    : ""
                }


                ${
                    consequences.hospitals_affected !== undefined
                    ?
                    `
                    <div>
                        <strong>
                            ${escapeHTML(consequences.hospitals_affected)}
                        </strong>
                        hospitals affected
                    </div>
                    `
                    : ""
                }


                ${
                    consequences.utilities
                    ?
                    `
                    <div>
                        <strong>UTILITIES</strong>
                        ${escapeHTML(consequences.utilities)}
                    </div>
                    `
                    : ""
                }


                ${
                    consequences.economic_loss !== undefined
                    ?
                    `
                    <div>
                        <strong>
                            ${formatMoney(consequences.economic_loss)}
                        </strong>
                        estimated economic impact
                    </div>
                    `
                    : ""
                }

            </div>

        </section>


        <!-- NPC VOICES -->

        <section class="incident-section">

            <div class="section-label">
                VOICES FROM THE GROUND
            </div>

            <div class="quote-list">

                ${
                    quotes.length
                    ?
                    quotes.map(quote => `
                        <blockquote>
                            “${escapeHTML(quote)}”
                        </blockquote>
                    `).join("")
                    :
                    `
                    <p class="muted">
                        No resident statements have been published.
                    </p>
                    `
                }

            </div>

        </section>


        <!-- OFFICIAL RESPONSE -->

        <section class="incident-section">

            <div class="section-label">
                OFFICIAL RESPONSE
            </div>

            ${
                officialResponse.length
                ?
                `
                <ul class="official-list">

                    ${
                        officialResponse.map(item => `
                            <li>
                                ${escapeHTML(item)}
                            </li>
                        `).join("")
                    }

                </ul>
                `
                :
                `
                <p class="muted">
                    Officials have not yet released a complete response.
                </p>
                `
            }

        </section>


        <!-- AFTERMATH -->

        <section class="incident-section">

            <div class="section-label">
                WHAT HAPPENS NEXT
            </div>

            <div class="aftermath">

                ${
                    aftermath.immediate
                    ?
                    `
                    <div>
                        <h3>IMMEDIATE</h3>
                        <p>
                            ${escapeHTML(aftermath.immediate)}
                        </p>
                    </div>
                    `
                    : ""
                }


                ${
                    aftermath.short_term
                    ?
                    `
                    <div>
                        <h3>SHORT TERM</h3>
                        <p>
                            ${escapeHTML(aftermath.short_term)}
                        </p>
                    </div>
                    `
                    : ""
                }


                ${
                    aftermath.long_term
                    ?
                    `
                    <div>
                        <h3>LONG TERM</h3>
                        <p>
                            ${escapeHTML(aftermath.long_term)}
                        </p>
                    </div>
                    `
                    : ""
                }

            </div>

        </section>


        <div class="incident-end">

            <strong>
                NPC NEWS
            </strong>

            <span>
                The heroes get the headlines.
                The NPCs get the consequences.
            </span>

        </div>

    `;
}


// ============================================================
// STAT BOX
// ============================================================

function statBox(label, value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return `

        <div class="damage-box">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${formatNumber(value)}
            </strong>

        </div>

    `;
}


// ============================================================
// BACK BUTTON
// ============================================================

if (backToNews) {

    backToNews.addEventListener("click", function() {

        window.location.hash = "";

        incidentPage.classList.add("hidden");
        homepage.classList.remove("hidden");

        document.body.classList.remove(
            "viewing-incident"
        );

        window.scrollTo({
            top: 0,
            behavior: "instant"
        });

    });

}


// ============================================================
// HASH / DIRECT LINK
// ============================================================

function handleHash() {

    const hash = window.location.hash;

    if (!hash.startsWith("#incident/")) {

        incidentPage.classList.add("hidden");
        homepage.classList.remove("hidden");

        return;
    }


    const eventId =
        decodeURIComponent(
            hash.replace("#incident/", "")
        );


    let eventData =
        allEvents.find(
            event => event.id === eventId
        );


    if (!eventData) {

        const article =
            allArticles.find(
                article =>
                    (
                        article.event_id ||
                        article.eventId ||
                        article.id
                    ) === eventId
            );

        if (article) {

            eventData = {

                id: eventId,

                world: article.world,

                location: article.location,

                characters: article.characters,

                winner: article.winner,

                duration: article.duration,

                damage: article.damage,

                consequences: article.consequences,

                npc_quotes: article.npc_quotes,

                timeline: article.timeline,

                official_response:
                    article.official_response,

                aftermath:
                    article.aftermath
            };

        }

    }


    if (eventData) {
        showIncident(eventData);
    }

}


// Browser back/forward

window.addEventListener(
    "hashchange",
    handleHash
);


// ============================================================
// UTILITIES
// ============================================================

function escapeHTML(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatNumber(value) {

    const number = Number(value);

    if (Number.isNaN(number)) {
        return escapeHTML(value);
    }

    return number.toLocaleString("en-IN");
}


function formatMoney(value) {

    const number = Number(value);

    if (Number.isNaN(number)) {
        return escapeHTML(value);
    }

    return "₹" + number.toLocaleString("en-IN");
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    loadNews
);
