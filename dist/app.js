let allArticles = [];
let allEvents = [];

let activeCategory = "ALL";

const $ = (selector) => document.querySelector(selector);


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
   LOAD DATA
========================================= */

async function loadNews() {

    try {

        const response =
            await fetch("news.json?cache=" + Date.now());

        if (!response.ok) {
            throw new Error("news.json could not be loaded");
        }

        const data =
            await response.json();

        allArticles =
            data.articles || [];

        /*
            events.json is not published separately,
            so we reconstruct the incident information
            from article data where possible.
        */

        updateStatistics(data);

        renderHomepage();

        checkForIncident();

    }

    catch (error) {

        console.error(error);

        document.body.innerHTML = `
            <div style="
                max-width:800px;
                margin:80px auto;
                padding:30px;
                font-family:Arial;
            ">

                <h1>NEWSROOM FAILURE</h1>

                <p>
                    NPC News cannot load the fictional news database.
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

    /*
        Estimate total affected NPCs.
    */

    $("#npcCount").textContent =
        formatNumber(
            data.site.event_count * 10000
        );

}


/* =========================================
   SHOW / HIDE PAGES
========================================= */

function showHomepage() {

    $("#homepage").style.display = "block";

    $("#incidentPage").style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function showIncident() {

    $("#homepage").style.display = "none";

    $("#incidentPage").style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   GET EVENT ARTICLES
========================================= */

function getEventArticles(eventId) {

    return allArticles.filter(
        article =>
            article.event_id === eventId
    );

}


/* =========================================
   FIND INCIDENT
========================================= */

function openIncident(eventId, selectedArticleId = null) {

    const articles =
        getEventArticles(eventId);

    if (!articles.length) {
        return;
    }

    const selected =
        articles.find(
            article =>
                article.id === selectedArticleId
        ) || articles[0];

    renderIncident(
        articles,
        selected
    );

    showIncident();

    /*
        Add the event ID to browser URL.

        Example:

        npc-news.onrender.com/#incident/central-city-solar-knight
    */

    history.pushState(
        {
            incident: eventId
        },
        "",
        "#incident/" + encodeURIComponent(eventId)
    );

}


/* =========================================
   RENDER FULL INCIDENT
========================================= */

function renderIncident(
    articles,
    selected
) {

    const first =
        articles[0];


    /*
        HEADER
    */

    $("#incidentCategory").textContent =
        `${selected.category} • ${selected.type}`;


    $("#incidentWorld").textContent =
        `${first.world} • ${first.location}`;


    $("#incidentHeadline").textContent =
        selected.headline;


    $("#incidentSummary").textContent =
        selected.summary;


    $("#incidentMeta").textContent =
        `${selected.reporter} • ${selected.published}`;


    /*
        OVERVIEW
    */

    $("#incidentOverview").innerHTML = `

        <p>
            ${escapeHTML(selected.body)}
        </p>

        <p>
            The incident occurred in
            <strong>
                ${escapeHTML(first.location)}
            </strong>,
            within the
            <strong>
                ${escapeHTML(first.world)}
            </strong>.
        </p>

        <p>
            NPC News has combined reports from the battle,
            emergency services, transport authorities,
            businesses, residents and local officials to
            reconstruct the complete incident.
        </p>

    `;


    /*
        CHARACTERS
    */

    $("#incidentCharacters").innerHTML = `

        <div class="character-card">

            <small>
                PARTICIPANT
            </small>

            <h3>
                ${escapeHTML(first.characters[0])}
            </h3>

            <p>
                ${first.winner === first.characters[0]
                    ? "Declared winner"
                    : "Participant"}
            </p>

        </div>


        <div class="character-card">

            <small>
                PARTICIPANT
            </small>

            <h3>
                ${escapeHTML(first.characters[1])}
            </h3>

            <p>
                ${first.winner === first.characters[1]
                    ? "Declared winner"
                    : "Participant"}
            </p>

        </div>

    `;


    /*
        TIMELINE
    */

    renderTimeline(
        first,
        articles
    );


    /*
        BATTLE
    */

    const battleArticle =
        articles.find(
            article =>
                article.category === "BATTLE"
        );


    $("#incidentBattle").innerHTML = `

        <p>
            ${escapeHTML(
                battleArticle
                    ? battleArticle.body
                    : selected.body
            )}
        </p>

        <p>
            The confrontation lasted approximately
            <strong>
                ${escapeHTML(first.duration)}
            </strong>.
        </p>

        <p>
            The declared winner was
            <strong>
                ${escapeHTML(first.winner)}
            </strong>.
        </p>

    `;


    /*
        DAMAGE
    */

    renderDamage(first);


    /*
        NPC IMPACT
    */

    renderNPCImpact(
        first,
        articles
    );


    /*
        QUOTES
    */

    renderQuotes(first);


    /*
        AFTERMATH
    */

    renderAftermath(
        first,
        articles
    );


    /*
        FACTS
    */

    renderFacts(first);


    /*
        WINNER
    */

    $("#incidentWinner").innerHTML = `

        <div class="winner-name">
            🏆
            ${escapeHTML(first.winner)}
        </div>

        <div class="winner-duration">
            Battle duration:
            ${escapeHTML(first.duration)}
        </div>

    `;


    /*
        RELATED STORIES
    */

    renderRelated(
        articles,
        selected
    );

}


/* =========================================
   TIMELINE
========================================= */

function renderTimeline(
    event,
    articles
) {

    const timeline = [

        {
            time: "00:00",
            title: "INCIDENT BEGINS",
            text:
                `The confrontation begins in ${event.location}.`
        },

        {
            time: "00:03",
            title: "FIRST IMPACT",
            text:
                "Residents report explosions, structural damage and emergency alerts."
        },

        {
            time: "MID-FIGHT",
            title: "BATTLE SPREADS",
            text:
                "The confrontation moves through the surrounding area."
        },

        {
            time: event.duration,
            title: "BATTLE ENDS",
            text:
                `${event.winner} is declared the winner.`
        },

        {
            time: "+30 MIN",
            title: "EMERGENCY RESPONSE",
            text:
                "Emergency crews enter the affected area."
        },

        {
            time: "+2 HOURS",
            title: "DAMAGE ASSESSMENT",
            text:
                "Officials begin assessing buildings, roads and public infrastructure."
        },

        {
            time: "+6 HOURS",
            title: "DAILY LIFE DISRUPTED",
            text:
                "Residents begin dealing with transport, work, housing and business problems."
        },

        {
            time: "+1 DAY",
            title: "RECOVERY BEGINS",
            text:
                "Repair and reconstruction operations begin."
        }

    ];


    $("#incidentTimeline").innerHTML =
        timeline.map(item => `

            <div class="timeline-item">

                <div class="timeline-time">
                    ${escapeHTML(item.time)}
                </div>

                <div class="timeline-dot"></div>

                <div class="timeline-content">

                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>

                    <p>
                        ${escapeHTML(item.text)}
                    </p>

                </div>

            </div>

        `).join("");

}


/* =========================================
   DAMAGE
========================================= */

function renderDamage(event) {

    const damage =
        event.damage || {};

    const items = [

        ["BUILDINGS", damage.buildings],
        ["ROADS", damage.roads],
        ["VEHICLES", damage.vehicles],
        ["BUSINESSES", damage.businesses],
        ["NPCs AFFECTED", damage.npc_affected],
        ["INJURIES", damage.injuries],
        ["MISSING", damage.missing],
        ["DISPLACED", damage.displaced]

    ];


    $("#damageGrid").innerHTML =
        items.map(item => `

            <div class="damage-card">

                <strong>
                    ${formatNumber(item[1])}
                </strong>

                <span>
                    ${escapeHTML(item[0])}
                </span>

            </div>

        `).join("");

}


/* =========================================
   NPC IMPACT
========================================= */

function renderNPCImpact(
    event,
    articles
) {

    const consequences =
        event.consequences || {};


    const impacts = [

        [
            "TRANSPORT",
            `${formatNumber(
                consequences.transport_routes
            )} routes affected or suspended.`
        ],

        [
            "EDUCATION",
            `${formatNumber(
                consequences.schools_closed
            )} schools affected.`
        ],

        [
            "HEALTH",
            `${formatNumber(
                consequences.hospitals_affected
            )} hospitals affected.`
        ],

        [
            "UTILITIES",
            consequences.utilities ||
            "Utility inspections continue."
        ],

        [
            "BUSINESS",
            `${formatNumber(
                event.damage.businesses
            )} businesses affected.`
        ],

        [
            "HOUSING",
            `${formatNumber(
                event.damage.displaced
            )} residents displaced.`
        ],

        [
            "EMPLOYMENT",
            "Workers face disrupted routes and temporary workplace closures."
        ],

        [
            "FOOD",
            "Deliveries and supply routes are affected."
        ]

    ];


    $("#npcImpact").innerHTML =
        impacts.map(item => `

            <div class="impact-card">

                <h3>
                    ${escapeHTML(item[0])}
                </h3>

                <p>
                    ${escapeHTML(item[1])}
                </p>

            </div>

        `).join("");

}


/* =========================================
   NPC QUOTES
========================================= */

function renderQuotes(event) {

    const quotes =
        event.npc_quotes || [];


    $("#npcQuotes").innerHTML =
        quotes.map(quote => `

            <blockquote>

                "${escapeHTML(quote)}"

                <cite>
                    — Local resident
                </cite>

            </blockquote>

        `).join("");

}


/* =========================================
   AFTERMATH
========================================= */

function renderAftermath(
    event,
    articles
) {

    const reconstruction =
        articles.find(
            article =>
                article.category === "RECONSTRUCTION"
        );


    const longTerm =
        articles.find(
            article =>
                article.category === "ANALYSIS"
        );


    $("#incidentAftermath").innerHTML = `

        <p>
            ${escapeHTML(
                reconstruction
                    ? reconstruction.body
                    : "Reconstruction crews are assessing the area."
            )}
        </p>

        <p>
            ${escapeHTML(
                longTerm
                    ? longTerm.body
                    : "The long-term consequences remain under assessment."
            )}
        </p>

        <div class="aftermath-warning">

            THE BATTLE IS OVER.

            <br>

            THE INCIDENT IS NOT.

        </div>

    `;

}


/* =========================================
   FACTS
========================================= */

function renderFacts(event) {

    $("#incidentFacts").innerHTML = `

        <div class="fact">
            <span>WORLD</span>
            <strong>
                ${escapeHTML(event.world)}
            </strong>
        </div>

        <div class="fact">
            <span>LOCATION</span>
            <strong>
                ${escapeHTML(event.location)}
            </strong>
        </div>

        <div class="fact">
            <span>DURATION</span>
            <strong>
                ${escapeHTML(event.duration)}
            </strong>
        </div>

        <div class="fact">
            <span>WINNER</span>
            <strong>
                ${escapeHTML(event.winner)}
            </strong>
        </div>

        <div class="fact">
            <span>NPCs AFFECTED</span>
            <strong>
                ${formatNumber(
                    event.damage.npc_affected
                )}
            </strong>
        </div>

    `;

}


/* =========================================
   RELATED STORIES
========================================= */

function renderRelated(
    articles,
    selected
) {

    const related =
        articles
            .filter(
                article =>
                    article.id !== selected.id
            )
            .slice(0, 12);


    $("#relatedArticles").innerHTML =
        related.map(article => `

            <article
                class="related-card"
                data-event-id="${escapeHTML(article.event_id)}"
                data-article-id="${escapeHTML(article.id)}"
            >

                <small>
                    ${escapeHTML(article.category)}
                </small>

                <h3>
                    ${escapeHTML(article.headline)}
                </h3>

                <p>
                    ${escapeHTML(article.summary)}
                </p>

            </article>

        `).join("");


    document
        .querySelectorAll(".related-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openIncident(
                        card.dataset.eventId,
                        card.dataset.articleId
                    );

                }
            );

        });

}


/* =========================================
   RANDOM LEAD
========================================= */

function getRandomLead() {

    const breaking =
        allArticles.filter(
            article =>
                article.priority === "URGENT"
        );


    if (breaking.length) {

        return breaking[
            Math.floor(
                Math.random() *
                breaking.length
            )
        ];

    }


    return allArticles[
        Math.floor(
            Math.random() *
            allArticles.length
        )
    ];

}


function renderLead() {

    const article =
        getRandomLead();

    if (!article) {
        return;
    }


    $("#leadCategory").textContent =
        `${article.category} • ${article.type}`;


    $("#leadHeadline").textContent =
        article.headline;


    $("#leadSummary").textContent =
        article.summary;


    $("#leadMeta").textContent =
        `${article.world} • ${article.location} • ${article.reporter}`;


    $("#leadBody").textContent =
        article.body;


    /*
        IMPORTANT:

        The lead article is clickable.
    */

    document
        .querySelector(".lead-story")
        .onclick = () => {

            openIncident(
                article.event_id,
                article.id
            );

        };

}


/* =========================================
   LATEST
========================================= */

function renderLatest() {

    const container =
        $("#latestNews");


    const stories =
        [...allArticles]
            .sort(
                () => Math.random() - 0.5
            )
            .slice(0, 8);


    container.innerHTML =
        stories.map(article => `

            <article
                class="latest-item clickable"
                data-event-id="${escapeHTML(article.event_id)}"
                data-article-id="${escapeHTML(article.id)}"
            >

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


    document
        .querySelectorAll(".latest-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    openIncident(
                        item.dataset.eventId,
                        item.dataset.articleId
                    );

                }
            );

        });

}


/* =========================================
   NEWS GRID
========================================= */

function renderNewsGrid() {

    const container =
        $("#newsGrid");


    let articles =
        [...allArticles];


    if (
        activeCategory !== "ALL" &&
        activeCategory !== "WORLDS"
    ) {

        articles =
            articles.filter(
                article =>
                    article.category ===
                    activeCategory
            );

    }


    articles =
        articles
            .sort(
                () => Math.random() - 0.5
            )
            .slice(0, 24);


    container.innerHTML =
        articles.map(article => `

            <article
                class="news-card clickable"
                data-event-id="${escapeHTML(article.event_id)}"
                data-article-id="${escapeHTML(article.id)}"
            >

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

                <div class="read-more">
                    READ FULL INCIDENT →
                </div>

            </article>

        `).join("");


    document
        .querySelectorAll(".news-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openIncident(
                        card.dataset.eventId,
                        card.dataset.articleId
                    );

                }
            );

        });

}


/* =========================================
   SMALL SECTIONS
========================================= */

function renderSmallSection(
    selector,
    categories
) {

    const container =
        $(selector);


    const articles =
        allArticles
            .filter(
                article =>
                    categories.includes(
                        article.category
                    )
            )
            .sort(
                () => Math.random() - 0.5
            )
            .slice(0, 5);


    container.innerHTML =
        articles.map(article => `

            <article
                class="small-story clickable"
                data-event-id="${escapeHTML(article.event_id)}"
                data-article-id="${escapeHTML(article.id)}"
            >

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


    container
        .querySelectorAll(".small-story")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openIncident(
                        card.dataset.eventId,
                        card.dataset.articleId
                    );

                }
            );

        });

}


/* =========================================
   WORLD NEWS
========================================= */

function renderWorldNews() {

    const container =
        $("#worldNews");


    const worlds = {};


    allArticles.forEach(article => {

        if (!worlds[article.world]) {

            worlds[article.world] = [];

        }

        worlds[article.world].push(article);

    });


    container.innerHTML =
        Object.keys(worlds)
            .map(world => {

                const story =
                    worlds[world][
                        Math.floor(
                            Math.random() *
                            worlds[world].length
                        )
                    ];


                return `

                    <article
                        class="world-card clickable"
                        data-event-id="${escapeHTML(story.event_id)}"
                        data-article-id="${escapeHTML(story.id)}"
                    >

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


    container
        .querySelectorAll(".world-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openIncident(
                        card.dataset.eventId,
                        card.dataset.articleId
                    );

                }
            );

        });

}


/* =========================================
   TICKER
========================================= */

function renderTicker() {

    const stories =
        allArticles.filter(
            article =>
                article.priority === "URGENT"
        );


    if (!stories.length) {
        return;
    }


    const story =
        stories[
            Math.floor(
                Math.random() *
                stories.length
            )
        ];


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
   NAVIGATION
========================================= */

document
    .querySelectorAll(".main-nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

                activeCategory =
                    link.dataset.category;

                if (
                    activeCategory === "ALL"
                ) {

                    showHomepage();

                }

                renderNewsGrid();

                document
                    .querySelector(
                        ".news-grid-section"
                    )
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    });


/* =========================================
   NEW LEAD
========================================= */

$("#newLead")
    .addEventListener(
        "click",
        event => {

            event.stopPropagation();

            renderLead();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


/* =========================================
   BACK BUTTON
========================================= */

$("#backButton")
    .addEventListener(
        "click",
        () => {

            history.pushState(
                {},
                "",
                window.location.pathname
            );

            showHomepage();

        }
    );


/* =========================================
   URL INCIDENT
========================================= */

function checkForIncident() {

    const hash =
        window.location.hash;


    if (
        hash.startsWith("#incident/")
    ) {

        const eventId =
            decodeURIComponent(
                hash.replace(
                    "#incident/",
                    ""
                )
            );


        openIncidentWithoutHistory(
            eventId
        );

    }

}


function openIncidentWithoutHistory(
    eventId
) {

    const articles =
        getEventArticles(eventId);


    if (!articles.length) {

        showHomepage();

        return;

    }


    renderIncident(
        articles,
        articles[0]
    );


    showIncident();

}


/* =========================================
   BROWSER BACK/FORWARD
========================================= */

window.addEventListener(
    "popstate",
    () => {

        checkForIncident();

    }
);


/* =========================================
   DATE
========================================= */

function updateDate() {

    const date =
        new Date();


    $("#currentDate")
        .textContent =
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
