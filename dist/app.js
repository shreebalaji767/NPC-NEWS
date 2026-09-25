let allArticles = [];
let allEvents = [];


// ============================================================
// ELEMENTS FROM YOUR INDEX.HTML
// ============================================================

const homepage = document.getElementById("homepage");
const incidentPage = document.getElementById("incidentPage");

const newsGrid = document.getElementById("newsGrid");
const latestNews = document.getElementById("latestNews");

const npcNews = document.getElementById("npcNews");
const businessNews = document.getElementById("businessNews");
const transportNews = document.getElementById("transportNews");
const worldNews = document.getElementById("worldNews");

const breakingTicker = document.getElementById("breakingTicker");

const eventCount = document.getElementById("eventCount");
const articleCount = document.getElementById("articleCount");
const npcCount = document.getElementById("npcCount");

const newLead = document.getElementById("newLead");


// ============================================================
// INCIDENT ELEMENTS
// ============================================================

const backButton = document.getElementById("backButton");

const incidentCategory =
    document.getElementById("incidentCategory");

const incidentWorld =
    document.getElementById("incidentWorld");

const incidentHeadline =
    document.getElementById("incidentHeadline");

const incidentSummary =
    document.getElementById("incidentSummary");

const incidentMeta =
    document.getElementById("incidentMeta");

const incidentOverview =
    document.getElementById("incidentOverview");

const incidentCharacters =
    document.getElementById("incidentCharacters");

const incidentTimeline =
    document.getElementById("incidentTimeline");

const incidentBattle =
    document.getElementById("incidentBattle");

const damageGrid =
    document.getElementById("damageGrid");

const npcImpact =
    document.getElementById("npcImpact");

const npcQuotes =
    document.getElementById("npcQuotes");

const incidentAftermath =
    document.getElementById("incidentAftermath");

const relatedArticles =
    document.getElementById("relatedArticles");

const incidentFacts =
    document.getElementById("incidentFacts");

const incidentWinner =
    document.getElementById("incidentWinner");


// ============================================================
// LOAD NEWS.JSON
// ============================================================

async function loadNews() {

    try {

        const response =
            await fetch("news.json?v=" + Date.now());

        if (!response.ok) {
            throw new Error("news.json could not be loaded");
        }

        const data = await response.json();


        /*
         ========================================================
         SUPPORT BOTH FORMATS

         FORMAT 1:

         {
             "events": [],
             "articles": []
         }

         FORMAT 2:

         [
             ...
         ]
         ========================================================
        */

        if (Array.isArray(data)) {

            allEvents = data;

            allArticles = createArticlesFromEvents(data);

        } else {

            allEvents = data.events || [];

            allArticles = data.articles || [];

        }


        console.log(
            "Events loaded:",
            allEvents.length
        );

        console.log(
            "Articles loaded:",
            allArticles.length
        );


        updateStatistics();

        renderHomepage();

        setupNavigation();

        setupLeadButton();

        handleURL();


    } catch (error) {

        console.error(
            "NPC NEWS ERROR:",
            error
        );

        newsGrid.innerHTML = `
            <div class="error-box">

                <h2>NEWSROOM ERROR</h2>

                <p>
                    NPC News could not load the newsroom data.
                </p>

                <p>
                    Check that <strong>news.json</strong>
                    exists inside the same folder as this page.
                </p>

            </div>
        `;

    }

}


// ============================================================
// IF ONLY EVENTS.JSON DATA EXISTS
// CREATE BASIC ARTICLES
// ============================================================

function createArticlesFromEvents(events) {

    const articles = [];

    events.forEach(event => {

        articles.push({

            id:
                event.id + "-main",

            event_id:
                event.id,

            category:
                "BREAKING",

            headline:
                buildMainHeadline(event),

            summary:
                buildMainSummary(event),

            body:
                buildMainBody(event),

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

            published:
                "TODAY"

        });


        articles.push({

            id:
                event.id + "-damage",

            event_id:
                event.id,

            category:
                "DAMAGE",

            headline:
                `${event.damage?.buildings || 0} buildings affected after ${event.location} battle`,

            summary:
                `Residents and businesses are dealing with the physical consequences of the confrontation.`,

            world:
                event.world,

            location:
                event.location,

            published:
                "TODAY"

        });


        articles.push({

            id:
                event.id + "-business",

            event_id:
                event.id,

            category:
                "BUSINESS",

            headline:
                `${event.damage?.businesses || 0} businesses affected in ${event.location}`,

            summary:
                `Local businesses are assessing losses following the incident.`,

            world:
                event.world,

            location:
                event.location,

            published:
                "TODAY"

        });


        articles.push({

            id:
                event.id + "-transport",

            event_id:
                event.id,

            category:
                "TRANSPORT",

            headline:
                `${event.consequences?.transport_routes || 0} transport routes disrupted after battle`,

            summary:
                `Transport authorities have reported disruption across the affected area.`,

            world:
                event.world,

            location:
                event.location,

            published:
                "TODAY"

        });


        articles.push({

            id:
                event.id + "-npc",

            event_id:
                event.id,

            category:
                "NPC LIFE",

            headline:
                `Residents of ${event.location} deal with aftermath`,

            summary:
                `For ordinary residents, the battle is over. The consequences are not.`,

            world:
                event.world,

            location:
                event.location,

            published:
                "TODAY"

        });

    });


    return articles;
}


// ============================================================
// MAIN HEADLINE
// ============================================================

function buildMainHeadline(event) {

    const characters =
        event.characters || [];

    if (characters.length >= 2) {

        return `${characters[0]} defeats ${characters[1]} in ${event.location}`;

    }

    return `Major incident reported in ${event.location}`;

}


// ============================================================
// MAIN SUMMARY
// ============================================================

function buildMainSummary(event) {

    return `
        The confrontation lasted ${event.duration || "an unknown period"}.
        Authorities are now dealing with the consequences across
        ${event.location}.
    `.trim();

}


// ============================================================
// MAIN BODY
// ============================================================

function buildMainBody(event) {

    return `
        The battle has ended, but residents of
        ${event.location} are now facing the aftermath.

        Authorities are assessing damage to buildings,
        roads, vehicles and businesses while emergency
        services continue responding to the incident.
    `.trim();

}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    if (eventCount) {

        eventCount.textContent =
            allEvents.length.toLocaleString("en-IN");

    }


    if (articleCount) {

        articleCount.textContent =
            allArticles.length.toLocaleString("en-IN");

    }


    let totalNPC = 0;

    allEvents.forEach(event => {

        totalNPC +=
            Number(
                event.damage?.npc_affected || 0
            );

    });


    if (npcCount) {

        npcCount.textContent =
            totalNPC.toLocaleString("en-IN");

    }

}


// ============================================================
// RENDER HOMEPAGE
// ============================================================

function renderHomepage() {

    renderNewsGrid();

    renderLatest();

    renderNPCNews();

    renderBusinessNews();

    renderTransportNews();

    renderWorldNews();

    renderTicker();

    renderLead();

}


// ============================================================
// NEWS GRID
// ============================================================

function renderNewsGrid() {

    if (!newsGrid) return;


    const articles =
        allArticles.slice(0, 40);


    newsGrid.innerHTML =
        articles
            .map(article =>
                createArticleCard(article)
            )
            .join("");


    attachArticleClicks();

}


// ============================================================
// ARTICLE CARD
// ============================================================

function createArticleCard(article) {

    const eventId =
        article.event_id ||
        article.eventId ||
        article.id;


    return `

        <article
            class="news-card"
            data-event-id="${escapeHTML(eventId)}"
        >

            <div class="article-label">

                ${escapeHTML(
                    article.category ||
                    article.type ||
                    "NEWS"
                )}

            </div>


            <h3>

                ${escapeHTML(
                    article.headline ||
                    article.title ||
                    "Untitled Story"
                )}

            </h3>


            <div class="article-meta">

                ${escapeHTML(
                    article.world ||
                    ""
                )}

                ${article.location
                    ? " • " +
                      escapeHTML(article.location)
                    : ""
                }

            </div>


            <p>

                ${escapeHTML(
                    article.summary ||
                    ""
                )}

            </p>


            <button
                type="button"
                class="read-button read-more-button"
                data-event-id="${escapeHTML(eventId)}"
            >
                READ FULL INCIDENT →
            </button>


        </article>

    `;

}


// ============================================================
// CLICK HANDLER
// ============================================================

function attachArticleClicks() {

    const cards =
        document.querySelectorAll(
            ".news-card"
        );


    cards.forEach(card => {

        card.addEventListener(
            "click",
            function(event) {

                /*
                 If the user clicked the button,
                 the button handler will handle it.
                */

                if (
                    event.target.closest(
                        ".read-more-button"
                    )
                ) {
                    return;
                }


                const eventId =
                    card.dataset.eventId;


                if (eventId) {

                    openIncident(eventId);

                }

            }
        );

    });


    const buttons =
        document.querySelectorAll(
            ".read-more-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                const eventId =
                    button.dataset.eventId;


                if (eventId) {

                    openIncident(eventId);

                }

            }
        );

    });

}


// ============================================================
// OPEN INCIDENT
// ============================================================

function openIncident(eventId) {

    console.log(
        "OPENING INCIDENT:",
        eventId
    );


    const event =
        findEvent(eventId);


    if (!event) {

        console.error(
            "Incident not found:",
            eventId
        );

        alert(
            "This news article is not connected to an incident."
        );

        return;

    }


    /*
     Put incident in browser URL.
    */

    history.pushState(
        {},
        "",
        "#incident/" +
        encodeURIComponent(eventId)
    );


    showIncident(eventId);

}


// ============================================================
// FIND EVENT
// ============================================================

function findEvent(eventId) {

    return allEvents.find(
        event =>
            String(event.id) ===
            String(eventId)
    );

}


// ============================================================
// SHOW INCIDENT
// ============================================================

function showIncident(eventId) {

    const event =
        findEvent(eventId);


    if (!event) return;


    homepage.classList.add(
        "hidden"
    );


    incidentPage.classList.add(
        "active"
    );


    incidentPage.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "incident-view"
    );


    renderIncident(event);


    window.scrollTo(
        0,
        0
    );

}


// ============================================================
// RENDER INCIDENT
// ============================================================

function renderIncident(event) {

    const mainArticle =
        allArticles.find(
            article =>
                (
                    article.event_id ||
                    article.eventId
                ) === event.id
        );


    /*
     HEADER
    */

    incidentCategory.textContent =
        mainArticle?.category ||
        "INCIDENT";


    incidentWorld.textContent =
        event.world ||
        "";


    incidentHeadline.textContent =
        mainArticle?.headline ||
        buildMainHeadline(event);


    incidentSummary.textContent =
        mainArticle?.summary ||
        buildMainSummary(event);


    incidentMeta.textContent =
        `${event.location || ""} • ${event.duration || ""}`;


    /*
     WHAT HAPPENED
    */

    incidentOverview.innerHTML = `

        <p>
            A major confrontation was reported in
            <strong>
                ${escapeHTML(event.location)}
            </strong>,
            part of the
            <strong>
                ${escapeHTML(event.world)}
            </strong>.
        </p>

        <p>
            The confrontation involved
            <strong>
                ${escapeHTML(
                    event.characters?.join(" and ") ||
                    "multiple combatants"
                )}
            </strong>
            and lasted
            <strong>
                ${escapeHTML(
                    event.duration ||
                    "an unknown period"
                )}
            </strong>.
        </p>

        <p>
            The reported winner was
            <strong>
                ${escapeHTML(
                    event.winner ||
                    "not immediately confirmed"
                )}
            </strong>.
        </p>

    `;


    /*
     CHARACTERS
    */

    renderCharacters(event);


    /*
     TIMELINE
    */

    renderTimeline(event);


    /*
     BATTLE
    */

    incidentBattle.innerHTML = `

        <p>
            ${escapeHTML(
                event.characters?.[0] ||
                "The first combatant"
            )}
            confronted
            ${escapeHTML(
                event.characters?.[1] ||
                "the opposing combatant"
            )}
            in
            ${escapeHTML(event.location)}.
        </p>

        <p>
            The confrontation lasted
            <strong>
                ${escapeHTML(event.duration)}
            </strong>.
        </p>

        <p>
            The reported winner was
            <strong>
                ${escapeHTML(event.winner)}
            </strong>.
        </p>

    `;


    /*
     DAMAGE
    */

    renderDamage(event);


    /*
     NPC IMPACT
    */

    renderNPCImpact(event);


    /*
     QUOTES
    */

    renderQuotes(event);


    /*
     AFTERMATH
    */

    renderAftermath(event);


    /*
     RELATED STORIES
    */

    renderRelated(event);


    /*
     SIDEBAR
    */

    renderFacts(event);

}


// ============================================================
// CHARACTERS
// ============================================================

function renderCharacters(event) {

    const characters =
        event.characters || [];


    incidentCharacters.innerHTML =
        characters
            .map(
                (character, index) => `

                    <div class="character-card">

                        <span>
                            ${index + 1}
                        </span>

                        <strong>
                            ${escapeHTML(character)}
                        </strong>

                    </div>

                `
            )
            .join("");

}


// ============================================================
// TIMELINE
// ============================================================

function renderTimeline(event) {

    const timeline =
        event.timeline || [];


    if (!timeline.length) {

        incidentTimeline.innerHTML = `

            <div class="timeline-item">

                <div class="timeline-time">
                    INCIDENT
                </div>

                <div>

                    <strong>
                        Battle reported
                    </strong>

                    <p>
                        The confrontation occurred in
                        ${escapeHTML(event.location)}.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    incidentTimeline.innerHTML =
        timeline
            .map(
                item => `

                    <div class="timeline-item">

                        <div class="timeline-time">

                            ${escapeHTML(
                                item.time ||
                                ""
                            )}

                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    item.title ||
                                    ""
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    item.description ||
                                    ""
                                )}
                            </p>

                        </div>

                    </div>

                `
            )
            .join("");

}


// ============================================================
// DAMAGE
// ============================================================

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


    damageGrid.innerHTML =
        items
            .filter(
                item =>
                    item[1] !== undefined &&
                    item[1] !== null
            )
            .map(
                item => `

                    <div class="damage-card">

                        <span>
                            ${item[0]}
                        </span>

                        <strong>
                            ${formatNumber(item[1])}
                        </strong>

                    </div>

                `
            )
            .join("");

}


// ============================================================
// NPC IMPACT
// ============================================================

function renderNPCImpact(event) {

    const c =
        event.consequences || {};


    npcImpact.innerHTML = `

        <div class="impact-card">

            <strong>
                ${formatNumber(
                    c.transport_routes || 0
                )}
            </strong>

            <span>
                Transport routes affected
            </span>

        </div>


        <div class="impact-card">

            <strong>
                ${formatNumber(
                    c.schools_closed || 0
                )}
            </strong>

            <span>
                Schools closed
            </span>

        </div>


        <div class="impact-card">

            <strong>
                ${formatNumber(
                    c.hospitals_affected || 0
                )}
            </strong>

            <span>
                Hospitals affected
            </span>

        </div>


        <div class="impact-card">

            <strong>
                ${formatMoney(
                    c.economic_loss || 0
                )}
            </strong>

            <span>
                Estimated economic impact
            </span>

        </div>


        <div class="impact-card wide">

            <strong>
                UTILITIES
            </strong>

            <span>
                ${escapeHTML(
                    c.utilities ||
                    "No utility information available."
                )}
            </span>

        </div>

    `;

}


// ============================================================
// QUOTES
// ============================================================

function renderQuotes(event) {

    const quotes =
        event.npc_quotes || [];


    npcQuotes.innerHTML =
        quotes
            .map(
                quote => `

                    <blockquote>

                        “${escapeHTML(
                            quote
                        )}”

                    </blockquote>

                `
            )
            .join("");

}


// ============================================================
// AFTERMATH
// ============================================================

function renderAftermath(event) {

    const a =
        event.aftermath || {};


    if (
        a.immediate ||
        a.short_term ||
        a.long_term
    ) {

        incidentAftermath.innerHTML = `

            ${
                a.immediate
                ?
                `
                <h3>
                    IMMEDIATE
                </h3>

                <p>
                    ${escapeHTML(
                        a.immediate
                    )}
                </p>
                `
                :
                ""
            }


            ${
                a.short_term
                ?
                `
                <h3>
                    SHORT TERM
                </h3>

                <p>
                    ${escapeHTML(
                        a.short_term
                    )}
                </p>
                `
                :
                ""
            }


            ${
                a.long_term
                ?
                `
                <h3>
                    LONG TERM
                </h3>

                <p>
                    ${escapeHTML(
                        a.long_term
                    )}
                </p>
                `
                :
                ""
            }

        `;

    } else {

        incidentAftermath.innerHTML = `

            <p>
                Emergency crews are assessing the damage
                across ${escapeHTML(event.location)}.
            </p>

            <p>
                Residents and businesses are expected to
                continue dealing with disruption while
                reconstruction work takes place.
            </p>

        `;

    }

}


// ============================================================
// RELATED ARTICLES
// ============================================================

function renderRelated(event) {

    const related =
        allArticles.filter(
            article =>
                (
                    article.event_id ||
                    article.eventId
                ) === event.id
        );


    /*
     Do not show nothing.
     If generator only made one article,
     create a fallback.
    */

    if (!related.length) {

        relatedArticles.innerHTML = `
            <p>
                No related coverage available.
            </p>
        `;

        return;
    }


    relatedArticles.innerHTML =
        related
            .map(
                article => `

                    <article
                        class="related-card"
                        data-event-id="${escapeHTML(event.id)}"
                    >

                        <div class="article-label">

                            ${escapeHTML(
                                article.category ||
                                "NEWS"
                            )}

                        </div>

                        <h3>

                            ${escapeHTML(
                                article.headline ||
                                article.title ||
                                "Related report"
                            )}

                        </h3>

                        <p>

                            ${escapeHTML(
                                article.summary ||
                                ""
                            )}

                        </p>

                        <button
                            type="button"
                            class="read-button related-button"
                            data-event-id="${escapeHTML(event.id)}"
                        >
                            READ INCIDENT →
                        </button>

                    </article>

                `
            )
            .join("");


    document
        .querySelectorAll(".related-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                function() {

                    openIncident(
                        button.dataset.eventId
                    );

                }
            );

        });

}


// ============================================================
// INCIDENT FACTS
// ============================================================

function renderFacts(event) {

    const damage =
        event.damage || {};


    incidentFacts.innerHTML = `

        <div class="fact-row">

            <span>WORLD</span>

            <strong>
                ${escapeHTML(
                    event.world || "-"
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>LOCATION</span>

            <strong>
                ${escapeHTML(
                    event.location || "-"
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>DURATION</span>

            <strong>
                ${escapeHTML(
                    event.duration || "-"
                )}
            </strong>

        </div>


        <div class="fact-row">

            <span>NPCs AFFECTED</span>

            <strong>
                ${formatNumber(
                    damage.npc_affected || 0
                )}
            </strong>

        </div>

    `;


    incidentWinner.innerHTML = `

        <div class="winner-name">

            ${escapeHTML(
                event.winner ||
                "UNKNOWN"
            )}

        </div>

        <div class="winner-label">
            REPORTED WINNER
        </div>

    `;

}


// ============================================================
// LATEST NEWS
// ============================================================

function renderLatest() {

    if (!latestNews) return;


    latestNews.innerHTML =
        allArticles
            .slice(0, 8)
            .map(
                article => `

                    <div
                        class="latest-item"
                        data-event-id="${escapeHTML(
                            article.event_id ||
                            article.eventId ||
                            article.id
                        )}"
                    >

                        <span>
                            ${escapeHTML(
                                article.category ||
                                "NEWS"
                            )}
                        </span>

                        <strong>
                            ${escapeHTML(
                                article.headline ||
                                article.title ||
                                ""
                            )}
                        </strong>

                    </div>

                `
            )
            .join("");


    document
        .querySelectorAll(".latest-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                function() {

                    openIncident(
                        item.dataset.eventId
                    );

                }
            );

        });

}


// ============================================================
// NPC NEWS
// ============================================================

function renderNPCNews() {

    renderSmallSection(
        npcNews,
        [
            "NPC LIFE",
            "HOUSING",
            "EMPLOYMENT",
            "LOCAL"
        ]
    );

}


// ============================================================
// BUSINESS NEWS
// ============================================================

function renderBusinessNews() {

    renderSmallSection(
        businessNews,
        [
            "BUSINESS",
            "ECONOMY"
        ]
    );

}


// ============================================================
// TRANSPORT NEWS
// ============================================================

function renderTransportNews() {

    renderSmallSection(
        transportNews,
        [
            "TRANSPORT",
            "DAMAGE",
            "UTILITIES"
        ]
    );

}


// ============================================================
// SMALL SECTIONS
// ============================================================

function renderSmallSection(
    container,
    categories
) {

    if (!container) return;


    const filtered =
        allArticles
            .filter(
                article =>
                    categories.includes(
                        String(
                            article.category ||
                            article.type ||
                            ""
                        ).toUpperCase()
                    )
            )
            .slice(0, 5);


    container.innerHTML =
        filtered
            .map(
                article => `

                    <div
                        class="small-story"
                        data-event-id="${escapeHTML(
                            article.event_id ||
                            article.eventId ||
                            article.id
                        )}"
                    >

                        <div class="article-label">

                            ${escapeHTML(
                                article.category ||
                                "NEWS"
                            )}

                        </div>

                        <h3>

                            ${escapeHTML(
                                article.headline ||
                                article.title ||
                                ""
                            )}

                        </h3>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(".small-story")
        .forEach(item => {

            item.addEventListener(
                "click",
                function() {

                    openIncident(
                        item.dataset.eventId
                    );

                }
            );

        });

}


// ============================================================
// WORLDS
// ============================================================

function renderWorldNews() {

    if (!worldNews) return;


    const worlds = {};


    allArticles.forEach(article => {

        const world =
            article.world ||
            "UNKNOWN WORLD";


        if (!worlds[world]) {

            worlds[world] = [];

        }


        worlds[world].push(article);

    });


    worldNews.innerHTML =
        Object.keys(worlds)
            .map(world => {

                const article =
                    worlds[world][0];


                return `

                    <div
                        class="world-card"
                        data-event-id="${escapeHTML(
                            article.event_id ||
                            article.eventId ||
                            article.id
                        )}"
                    >

                        <span>
                            ${escapeHTML(world)}
                        </span>

                        <h3>

                            ${escapeHTML(
                                article.headline ||
                                article.title ||
                                ""
                            )}

                        </h3>

                        <small>
                            ${worlds[world].length}
                            reports
                        </small>

                    </div>

                `;

            })
            .join("");


    worldNews
        .querySelectorAll(".world-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                function() {

                    openIncident(
                        card.dataset.eventId
                    );

                }
            );

        });

}


// ============================================================
// BREAKING TICKER
// ============================================================

function renderTicker() {

    if (!breakingTicker) return;


    const headlines =
        allArticles
            .slice(0, 12)
            .map(
                article =>
                    article.headline ||
                    article.title ||
                    ""
            );


    breakingTicker.textContent =
        headlines.join("  •  ");

}


// ============================================================
// LEAD STORY
// ============================================================

function renderLead() {

    if (!allArticles.length) return;


    showLead(
        allArticles[
            Math.floor(
                Math.random() *
                allArticles.length
            )
        ]
    );

}


function showLead(article) {

    const category =
        document.getElementById(
            "leadCategory"
        );

    const headline =
        document.getElementById(
            "leadHeadline"
        );

    const summary =
        document.getElementById(
            "leadSummary"
        );

    const meta =
        document.getElementById(
            "leadMeta"
        );

    const body =
        document.getElementById(
            "leadBody"
        );


    category.textContent =
        article.category ||
        "NEWS";


    headline.textContent =
        article.headline ||
        article.title ||
        "";


    summary.textContent =
        article.summary ||
        "";


    meta.textContent =
        `${article.world || ""} • ${article.location || ""}`;


    body.textContent =
        article.body ||
        "";


    /*
     IMPORTANT:
     Make lead story clickable.
    */

    const lead =
        document.querySelector(
            ".lead-story"
        );


    if (lead) {

        lead.onclick = function() {

            openIncident(
                article.event_id ||
                article.eventId ||
                article.id
            );

        };

    }

}


// ============================================================
// NEW LEAD BUTTON
// ============================================================

function setupLeadButton() {

    if (!newLead) return;


    newLead.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();


            if (!allArticles.length) {
                return;
            }


            const article =
                allArticles[
                    Math.floor(
                        Math.random() *
                        allArticles.length
                    )
                ];


            showLead(article);

        }
    );

}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    document
        .querySelectorAll(".main-nav a")
        .forEach(link => {

            link.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();


                    const category =
                        link.dataset.category;


                    if (
                        category === "ALL" ||
                        category === "WORLDS"
                    ) {

                        showHomepage();

                        return;

                    }


                    const filtered =
                        allArticles.filter(
                            article =>
                                String(
                                    article.category ||
                                    ""
                                ).toUpperCase()
                                ===
                                category.toUpperCase()
                        );


                    renderFilteredNews(
                        filtered,
                        category
                    );

                }
            );

        });

}


// ============================================================
// FILTERED NEWS
// ============================================================

function renderFilteredNews(
    articles,
    category
) {

    homepage.classList.remove(
        "hidden"
    );


    incidentPage.classList.add(
        "hidden"
    );


    if (!articles.length) {

        newsGrid.innerHTML = `

            <div class="empty-news">

                <h2>
                    No ${escapeHTML(category)}
                    reports available.
                </h2>

            </div>

        `;

        return;

    }


    newsGrid.innerHTML =
        articles
            .map(article =>
                createArticleCard(article)
            )
            .join("");


    attachArticleClicks();


    window.scrollTo(
        0,
        document.querySelector(
            ".news-grid-section"
        )?.offsetTop || 0
    );

}


// ============================================================
// SHOW HOMEPAGE
// ============================================================

function showHomepage() {

    homepage.classList.remove(
        "hidden"
    );


    incidentPage.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "incident-view"
    );


    window.scrollTo(
        0,
        0
    );

}


// ============================================================
// BACK BUTTON
// ============================================================

if (backButton) {

    backButton.addEventListener(
        "click",
        function() {

            history.pushState(
                {},
                "",
                window.location.pathname
            );

            showHomepage();

        }
    );

}


// ============================================================
// BROWSER BACK / FORWARD
// ============================================================

window.addEventListener(
    "popstate",
    handleURL
);

window.addEventListener(
    "hashchange",
    handleURL
);


// ============================================================
// HANDLE URL
// ============================================================

function handleURL() {

    const hash =
        window.location.hash;


    if (
        !hash ||
        !hash.startsWith("#incident/")
    ) {

        showHomepage();

        return;

    }


    const eventId =
        decodeURIComponent(
            hash.substring(
                "#incident/".length
            )
        );


    const event =
        findEvent(eventId);


    if (event) {

        showIncident(eventId);

    } else {

        showHomepage();

    }

}


// ============================================================
// NUMBER FORMAT
// ============================================================

function formatNumber(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return escapeHTML(value);

    }


    return number.toLocaleString(
        "en-IN"
    );

}


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return escapeHTML(value);

    }


    return "₹" +
        number.toLocaleString(
            "en-IN"
        );

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    loadNews
);
