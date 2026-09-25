/* ============================================================
   NPC NEWS — MAIN APPLICATION
   COMPLETE REPLACEMENT
   ============================================================ */

let allArticles = [];
let allEvents = [];

let currentArticle = null;
let currentEvent = null;


/* ============================================================
   START APPLICATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    setCurrentDate();

    setupNavigation();
    setupBackButton();
    setupNewLeadButton();

    document.addEventListener("click", handleGlobalArticleClick);

    window.addEventListener("hashchange", handleHash);

    loadNews();

});


/* ============================================================
   LOAD NEWS
   ============================================================ */

async function loadNews() {

    try {

        const response = await fetch(
            "news.json?cache=" + Date.now()
        );

        if (!response.ok) {
            throw new Error(
                "Could not load news.json"
            );
        }

        const data = await response.json();

        /*
         Supported format:

         {
             "site": {},
             "events": [],
             "articles": []
         }

         Also supports:

         [
             events...
         ]

         or old article-only data.
        */

        if (Array.isArray(data)) {

            /*
             We need to determine whether the
             array contains events or articles.
            */

            if (
                data.length &&
                data[0].damage &&
                data[0].consequences
            ) {

                allEvents = data;

                allArticles =
                    createArticlesFromEvents(
                        allEvents
                    );

            } else {

                allArticles = data;

                allEvents =
                    createEventsFromArticles();
            }

        } else {

            allEvents =
                Array.isArray(data.events)
                    ? data.events
                    : [];

            allArticles =
                Array.isArray(data.articles)
                    ? data.articles
                    : [];

        }


        /*
         Normalize everything before rendering.
        */

        allEvents =
            allEvents
                .filter(Boolean)
                .map(normalizeEvent);


        allArticles =
            allArticles
                .filter(Boolean)
                .map(normalizeArticle);


        /*
         If articles don't exist but events do,
         automatically generate articles.
        */

        if (
            !allArticles.length &&
            allEvents.length
        ) {

            allArticles =
                createArticlesFromEvents(
                    allEvents
                );

        }


        /*
         If events are missing but articles contain
         event data, rebuild the events.
        */

        if (!allEvents.length) {

            allEvents =
                createEventsFromArticles();

        }


        console.log(
            "NPC NEWS loaded"
        );

        console.log(
            "Articles:",
            allArticles.length
        );

        console.log(
            "Events:",
            allEvents.length
        );

        console.log(
            "Events:",
            allEvents
        );


        updateStatistics();

        renderHomepage();

        handleHash();

    }

    catch (error) {

        console.error(
            "NPC NEWS ERROR:",
            error
        );

        showError(
            "NPC NEWS could not load the newsroom data. " +
            "Make sure news.json exists inside the dist folder."
        );

    }

}


/* ============================================================
   NORMALIZE EVENT
   ============================================================ */

function normalizeEvent(event) {

    if (!event) {
        return {};
    }


    const damage =
        event.damage || {};


    const consequences =
        event.consequences || {};


    return {

        ...event,

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

        characters:
            Array.isArray(event.characters)
                ? event.characters
                : [],

        winner:
            event.winner ||
            "UNCONFIRMED",

        duration:
            event.duration ||
            event.battle_duration ||
            "UNKNOWN",

        damage: {

            buildings:
                numberOrZero(
                    damage.buildings ??
                    event.buildings
                ),

            roads:
                numberOrZero(
                    damage.roads ??
                    event.roads
                ),

            vehicles:
                numberOrZero(
                    damage.vehicles ??
                    event.vehicles
                ),

            businesses:
                numberOrZero(
                    damage.businesses ??
                    event.businesses
                ),

            npc_affected:
                numberOrZero(
                    damage.npc_affected ??
                    damage.npcs_affected ??
                    event.npc_affected ??
                    event.npcs_affected
                ),

            injuries:
                numberOrZero(
                    damage.injuries ??
                    event.injuries
                ),

            missing:
                numberOrZero(
                    damage.missing ??
                    event.missing
                ),

            displaced:
                numberOrZero(
                    damage.displaced ??
                    event.displaced
                )

        },

        consequences: {

            transport_routes:
                numberOrZero(
                    consequences.transport_routes ??
                    consequences.transport ??
                    event.transport_routes
                ),

            schools_closed:
                numberOrZero(
                    consequences.schools_closed ??
                    consequences.schools ??
                    event.schools_closed
                ),

            hospitals_affected:
                numberOrZero(
                    consequences.hospitals_affected ??
                    consequences.hospitals ??
                    event.hospitals_affected
                ),

            utilities:
                consequences.utilities ||
                event.utilities ||
                "Service disruption reported",

            economic_loss:
                numberOrZero(
                    consequences.economic_loss ??
                    consequences.economicLoss ??
                    event.economic_loss
                )

        },

        npc_quotes:
            Array.isArray(event.npc_quotes)
                ? event.npc_quotes
                : [],

        timeline:
            Array.isArray(event.timeline)
                ? event.timeline
                : [],

        aftermath:
            event.aftermath ||
            null,

        battle_summary:
            event.battle_summary ||
            event.battleReport ||
            ""

    };

}


/* ============================================================
   NORMALIZE ARTICLE
   ============================================================ */

function normalizeArticle(article) {

    if (!article) {
        return {};
    }


    return {

        ...article,

        id:
            article.id ||
            generateArticleId(article),

        event_id:
            article.event_id ||
            article.eventId ||
            article.event?.id ||
            "",

        category:
            article.category ||
            "NEWS",

        headline:
            article.headline ||
            "Untitled report",

        summary:
            article.summary ||
            "",

        body:
            article.body ||
            article.summary ||
            "",

        reporter:
            article.reporter ||
            "NPC News Desk",

        published:
            article.published ||
            article.date ||
            new Date().toISOString(),

        world:
            article.world ||
            "",

        location:
            article.location ||
            ""

    };

}


/* ============================================================
   CREATE ARTICLES FROM EVENTS
   ============================================================ */

function createArticlesFromEvents(events) {

    const articles = [];


    events.forEach(event => {

        const e =
            normalizeEvent(event);


        if (!e.id) {
            return;
        }


        const first =
            e.characters[0] ||
            "Combatant";


        const second =
            e.characters[1] ||
            "Opponent";


        const location =
            e.location;


        const world =
            e.world;


        const damage =
            e.damage;


        const consequences =
            e.consequences;


        const base = {

            event_id: e.id,

            world: world,

            location: location,

            reporter: "NPC News Desk",

            published:
                new Date().toISOString()

        };


        articles.push({

            ...base,

            id:
                e.id +
                "-breaking",

            category:
                "BREAKING",

            headline:
                `${e.winner} defeats ${second} after ${e.duration} battle`,

            summary:
                `The battle in ${location} has ended, but ordinary residents are now dealing with the aftermath.`,

            body:
                `The confrontation between ${first} and ${second} lasted ${e.duration}. ${formatNumber(damage.npc_affected)} NPCs were affected and authorities are assessing the damage.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-battle",

            category:
                "BATTLE",

            headline:
                `${first} vs ${second}: What happened in ${location}`,

            summary:
                `A timeline of the confrontation and its immediate consequences.`,

            body:
                `The reported confrontation involved ${first} and ${second}. ${e.winner} was reported as the winner after ${e.duration}.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-damage",

            category:
                "DAMAGE",

            headline:
                `${formatNumber(damage.buildings)} buildings affected after ${first}-${second} battle`,

            summary:
                `Structural inspections have begun across ${location}.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-transport",

            category:
                "TRANSPORT",

            headline:
                `${formatNumber(consequences.transport_routes)} public transport routes affected`,

            summary:
                `Commuters face disruption while infrastructure inspections continue.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-health",

            category:
                "HEALTH",

            headline:
                `${formatNumber(damage.injuries)} injuries reported after ${location} battle`,

            summary:
                `Medical teams continue to assess residents and responders.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-housing",

            category:
                "HOUSING",

            headline:
                `${formatNumber(damage.displaced)} residents temporarily displaced`,

            summary:
                `Families are looking for temporary accommodation after the battle.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-business",

            category:
                "BUSINESS",

            headline:
                `${formatNumber(damage.businesses)} businesses affected by battle`,

            summary:
                `Shop owners say the fight has created another unexpected business crisis.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-economy",

            category:
                "ECONOMY",

            headline:
                `Battle damage could cost ${formatCurrency(consequences.economic_loss)}`,

            summary:
                `Local officials begin calculating the financial consequences.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-npc-life",

            category:
                "NPC LIFE",

            headline:
                `Residents ask a simple question: Who pays for all this?`,

            summary:
                `Ordinary residents describe life after another superpowered confrontation.`

        });


        articles.push({

            ...base,

            id:
                e.id +
                "-reconstruction",

            category:
                "RECONSTRUCTION",

            headline:
                `Reconstruction begins as ${location} counts its losses`,

            summary:
                `Repair crews begin the long process of restoring normal life.`

        });

    });


    return articles;

}


/* ============================================================
   DATE
   ============================================================ */

function setCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    if (!element) {
        return;
    }


    const now =
        new Date();


    element.textContent =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}


/* ============================================================
   STATISTICS
   ============================================================ */

function updateStatistics() {

    const eventCount =
        document.getElementById(
            "eventCount"
        );


    const articleCount =
        document.getElementById(
            "articleCount"
        );


    const npcCount =
        document.getElementById(
            "npcCount"
        );


    if (eventCount) {

        eventCount.textContent =
            allEvents.length;

    }


    if (articleCount) {

        articleCount.textContent =
            allArticles.length;

    }


    if (npcCount) {

        let total = 0;


        allEvents.forEach(event => {

            total +=
                numberOrZero(
                    event.damage?.npc_affected
                );

        });


        npcCount.textContent =
            formatNumber(total);

    }

}


/* ============================================================
   HOMEPAGE
   ============================================================ */

function renderHomepage() {

    const homepage =
        document.getElementById(
            "homepage"
        );


    const incidentPage =
        document.getElementById(
            "incidentPage"
        );


    if (homepage) {
        homepage.style.display = "block";
    }


    if (incidentPage) {
        incidentPage.style.display = "none";
    }


    renderLead();

    renderLatest();

    renderNewsGrid();


    renderSmallSection(
        "npcNews",
        [
            "NPC LIFE",
            "LOCAL",
            "HOUSING",
            "EMPLOYMENT",
            "HEALTH",
            "EDUCATION"
        ]
    );


    renderSmallSection(
        "businessNews",
        [
            "BUSINESS",
            "ECONOMY",
            "EMPLOYMENT",
            "RECONSTRUCTION"
        ]
    );


    renderSmallSection(
        "transportNews",
        [
            "TRANSPORT",
            "INFRASTRUCTURE",
            "UTILITIES",
            "DAMAGE"
        ]
    );


    renderWorldNews();

    renderTicker();

}


/* ============================================================
   LEAD
   ============================================================ */

function renderLead() {

    if (!allArticles.length) {
        return;
    }


    const lead =
        getLeadArticle();


    if (!lead) {
        return;
    }


    currentArticle =
        lead;


    setText(
        "leadCategory",
        lead.category
    );


    setText(
        "leadHeadline",
        lead.headline
    );


    setText(
        "leadSummary",
        lead.summary
    );


    setText(
        "leadMeta",
        buildMeta(lead)
    );


    setHTML(
        "leadBody",
        `<p>${escapeHTML(
            lead.body ||
            lead.summary ||
            ""
        )}</p>`
    );


    const leadStory =
        document.querySelector(
            ".lead-story"
        );


    if (!leadStory) {
        return;
    }


    leadStory.dataset.eventId =
        lead.event_id;


    leadStory.dataset.articleId =
        lead.id;


    leadStory.classList.add(
        "clickable"
    );

}


/* ============================================================
   NEW LEAD
   ============================================================ */

function setupNewLeadButton() {

    const button =
        document.getElementById(
            "newLead"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            renderLead();

        }
    );

}


/* ============================================================
   GET LEAD
   ============================================================ */

function getLeadArticle() {

    const breaking =
        allArticles.filter(
            article =>
                String(
                    article.category
                ).toUpperCase()
                ===
                "BREAKING"
        );


    if (breaking.length) {

        return randomItem(
            breaking
        );

    }


    return randomItem(
        allArticles
    );

}


/* ============================================================
   LATEST
   ============================================================ */

function renderLatest() {

    const container =
        document.getElementById(
            "latestNews"
        );


    if (!container) {
        return;
    }


    const articles =
        [...allArticles]
            .sort(sortByDate)
            .slice(0, 10);


    container.innerHTML =
        articles.map(article => `

            <article
                class="latest-item clickable"
                data-event-id="${escapeAttribute(article.event_id)}"
                data-article-id="${escapeAttribute(article.id)}"
            >

                <div class="time">
                    ${escapeHTML(
                        article.category
                    )}
                </div>

                <h3>
                    ${escapeHTML(
                        article.headline
                    )}
                </h3>

                <div class="read-more">
                    READ FULL INCIDENT →
                </div>

            </article>

        `).join("");

}


/* ============================================================
   NEWS GRID
   ============================================================ */

function renderNewsGrid() {

    const container =
        document.getElementById(
            "newsGrid"
        );


    if (!container) {
        return;
    }


    const articles =
        shuffle(
            [...allArticles]
        ).slice(0, 16);


    container.innerHTML =
        articles.map(article => `

            <article
                class="news-card clickable"
                data-event-id="${escapeAttribute(article.event_id)}"
                data-article-id="${escapeAttribute(article.id)}"
            >

                <div class="category">
                    ${escapeHTML(
                        article.category
                    )}
                </div>

                <h3>
                    ${escapeHTML(
                        article.headline
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        article.summary
                    )}
                </p>

                <div class="meta">
                    ${buildMeta(article)}
                </div>

                <div class="read-more">
                    READ MORE →
                </div>

            </article>

        `).join("");

}


/* ============================================================
   SMALL SECTIONS
   ============================================================ */

function renderSmallSection(
    elementId,
    categories
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) {
        return;
    }


    const wanted =
        allArticles.filter(article => {

            const category =
                String(
                    article.category || ""
                ).toUpperCase();


            return categories.some(
                item =>
                    category === item ||
                    category.includes(item)
            );

        });


    const articles =
        shuffle(
            wanted.length
                ? wanted
                : [...allArticles]
        ).slice(0, 5);


    container.innerHTML =
        articles.map(article => `

            <article
                class="small-story clickable"
                data-event-id="${escapeAttribute(article.event_id)}"
                data-article-id="${escapeAttribute(article.id)}"
            >

                <small>
                    ${escapeHTML(
                        article.category
                    )}
                </small>

                <h3>
                    ${escapeHTML(
                        article.headline
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        article.summary
                    )}
                </p>

                <div class="read-more">
                    READ FULL INCIDENT →
                </div>

            </article>

        `).join("");

}


/* ============================================================
   WORLD NEWS
   ============================================================ */

function renderWorldNews() {

    const container =
        document.getElementById(
            "worldNews"
        );


    if (!container) {
        return;
    }


    const worlds = {};


    allArticles.forEach(article => {

        const world =
            article.world ||
            getEvent(article.event_id)?.world ||
            "UNKNOWN WORLD";


        if (!worlds[world]) {
            worlds[world] = [];
        }


        worlds[world].push(article);

    });


    container.innerHTML =
        Object.keys(worlds)
            .map(world => {

                const article =
                    randomItem(
                        worlds[world]
                    );


                return `

                    <article
                        class="world-card clickable"
                        data-event-id="${escapeAttribute(article.event_id)}"
                        data-article-id="${escapeAttribute(article.id)}"
                    >

                        <small>
                            WORLD DESK
                        </small>

                        <h3>
                            ${escapeHTML(world)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                article.headline
                            )}
                        </p>

                        <div class="read-more">
                            ENTER WORLD →
                        </div>

                    </article>

                `;

            })
            .join("");

}


/* ============================================================
   TICKER
   ============================================================ */

function renderTicker() {

    const ticker =
        document.getElementById(
            "breakingTicker"
        );


    if (!ticker) {
        return;
    }


    const breaking =
        allArticles.filter(
            article =>
                String(
                    article.category || ""
                ).toUpperCase()
                ===
                "BREAKING"
        );


    const source =
        breaking.length
            ? breaking
            : allArticles;


    ticker.textContent =
        shuffle(
            [...source]
        )
        .slice(0, 5)
        .map(
            article =>
                article.headline
        )
        .join("   •   ");

}


/* ============================================================
   GLOBAL CLICK HANDLER
   ============================================================ */

function handleGlobalArticleClick(event) {

    /*
       Don't interfere with navigation.
    */

    const nav =
        event.target.closest(
            ".main-nav a"
        );


    if (nav) {
        return;
    }


    /*
       Don't interfere with Back button.
    */

    if (
        event.target.closest(
            "#backButton"
        )
    ) {
        return;
    }


    /*
       Don't interfere with LOAD ANOTHER STORY.
    */

    if (
        event.target.closest(
            "#newLead"
        )
    ) {
        return;
    }


    /*
       Find the nearest article/event element.
    */

    const clickable =
        event.target.closest(
            "[data-event-id]"
        );


    if (!clickable) {
        return;
    }


    const eventId =
        clickable.dataset.eventId;


    const articleId =
        clickable.dataset.articleId ||
        null;


    if (!eventId) {

        console.error(
            "Clickable item has no event_id:",
            clickable
        );

        return;

    }


    event.preventDefault();

    openIncident(
        eventId,
        articleId
    );

}


/* ============================================================
   OPEN INCIDENT
   ============================================================ */

function openIncident(
    eventId,
    selectedArticleId = null
) {

    if (!eventId) {
        console.error(
            "Missing event ID."
        );
        return;
    }


    const event =
        getEvent(eventId);


    if (!event) {

        console.error(
            "Could not find event:",
            eventId
        );

        console.log(
            "Available events:",
            allEvents
        );

        alert(
            "Incident data could not be found for this report."
        );

        return;

    }


    currentEvent =
        event;


    const selectedArticle =
        allArticles.find(
            article =>
                String(article.id) ===
                String(selectedArticleId)
        );


    currentArticle =
        selectedArticle ||
        getEventArticles(eventId)[0] ||
        null;


    /*
       Change URL.
    */

    const newHash =
        "#incident/" +
        encodeURIComponent(
            eventId
        );


    if (
        window.location.hash !==
        newHash
    ) {

        window.location.hash =
            "incident/" +
            encodeURIComponent(
                eventId
            );

    }


    renderIncident(
        event,
        currentArticle
    );

}


/* ============================================================
   GET EVENT
   ============================================================ */

function getEvent(eventId) {

    if (!eventId) {
        return null;
    }


    return allEvents.find(
        event =>
            String(event.id) ===
            String(eventId)
    ) || null;

}


/* ============================================================
   RENDER INCIDENT
   ============================================================ */

function renderIncident(
    event,
    selectedArticle
) {

    const homepage =
        document.getElementById(
            "homepage"
        );


    const incidentPage =
        document.getElementById(
            "incidentPage"
        );


    if (!homepage || !incidentPage) {

        console.error(
            "Incident page elements are missing."
        );

        return;

    }


    homepage.style.display =
        "none";


    incidentPage.style.display =
        "block";


    window.scrollTo(
        {
            top: 0,
            behavior: "instant"
        }
    );


    const article =
        selectedArticle || {};


    /*
       HEADER
    */

    setText(
        "incidentCategory",
        article.category ||
        "INCIDENT"
    );


    setText(
        "incidentWorld",
        `${event.world} • ${event.location}`
    );


    setText(
        "incidentHeadline",
        article.headline ||
        buildDefaultHeadline(event)
    );


    setText(
        "incidentSummary",
        article.summary ||
        buildIncidentSummary(event)
    );


    setText(
        "incidentMeta",
        buildMeta({
            ...article,
            world:
                article.world ||
                event.world,

            location:
                article.location ||
                event.location
        })
    );


    /*
       MAIN INCIDENT
    */

    setHTML(
        "incidentOverview",
        buildOverview(
            event,
            article
        )
    );


    renderCharacters(event);

    renderTimeline(event);

    setHTML(
        "incidentBattle",
        buildBattleText(event)
    );

    renderDamage(event);

    renderNPCImpact(event);

    renderQuotes(event);

    renderAftermath(event);

    renderRelated(event.id);

    renderFacts(event);

    renderWinner(event);

}


/* ============================================================
   OVERVIEW
   ============================================================ */

function buildOverview(
    event,
    article
) {

    const damage =
        event.damage || {};


    const consequences =
        event.consequences || {};


    return `

        <p>
            ${escapeHTML(
                article.body ||
                `The incident took place in ${event.location} within the ${event.world}. The confrontation involved ${formatCharacters(event)} and lasted ${event.duration}.`
            )}
        </p>

        <p>
            Initial assessments indicate that
            approximately
            <strong>
                ${formatNumber(
                    damage.npc_affected
                )}
            </strong>
            NPCs were directly or indirectly
            affected by the incident.
        </p>

        <p>
            Local services reported
            ${escapeHTML(
                consequences.utilities
            )}
        </p>

    `;

}


/* ============================================================
   CHARACTERS
   ============================================================ */

function renderCharacters(event) {

    const container =
        document.getElementById(
            "incidentCharacters"
        );


    if (!container) {
        return;
    }


    const characters =
        event.characters || [];


    container.innerHTML =
        characters.map(
            (character, index) => `

                <div class="character-card">

                    <small>
                        ${
                            index === 0
                                ? "PRIMARY COMBATANT"
                                : "OPPOSING COMBATANT"
                        }
                    </small>

                    <h3>
                        ${escapeHTML(character)}
                    </h3>

                    <p>
                        ${
                            String(character)
                            ===
                            String(event.winner)
                                ? "Reported winner of the confrontation."
                                : "Reported opposing participant in the incident."
                        }
                    </p>

                </div>

            `
        ).join("");

}


/* ============================================================
   TIMELINE
   ============================================================ */

function renderTimeline(event) {

    const container =
        document.getElementById(
            "incidentTimeline"
        );


    if (!container) {
        return;
    }


    let timeline =
        Array.isArray(event.timeline)
            ? event.timeline
            : [];


    if (!timeline.length) {

        timeline = [

            {
                time: "START",
                title: "Incident begins",
                text:
                    `${formatCharacters(event)} are reported to have begun their confrontation in ${event.location}.`
            },

            {
                time: "DURING",
                title: "Battle expands",
                text:
                    `The confrontation continues for ${event.duration}, affecting surrounding infrastructure and civilian activity.`
            },

            {
                time: "RESPONSE",
                title: "Emergency response begins",
                text:
                    `Emergency crews begin assessing the ${formatNumber(event.damage.npc_affected)} NPCs affected and the damage reported across ${event.location}.`
            },

            {
                time: "END",
                title: "Confrontation ends",
                text:
                    `${event.winner} is reported as the winner after ${event.duration}.`
            }

        ];

    }


    container.innerHTML =
        timeline.map(item => `

            <div class="timeline-item">

                <div class="timeline-time">
                    ${escapeHTML(
                        item.time ||
                        ""
                    )}
                </div>

                <div class="timeline-dot"></div>

                <div class="timeline-content">

                    <h3>
                        ${escapeHTML(
                            item.title ||
                            ""
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            item.text ||
                            ""
                        )}
                    </p>

                </div>

            </div>

        `).join("");

}


/* ============================================================
   BATTLE
   ============================================================ */

function buildBattleText(event) {

    const characters =
        event.characters || [];


    return `

        <p>
            The confrontation involved
            <strong>
                ${escapeHTML(
                    characters[0] ||
                    "an unidentified combatant"
                )}
            </strong>
            and
            <strong>
                ${escapeHTML(
                    characters[1] ||
                    "an unidentified opponent"
                )}
            </strong>.
        </p>

        <p>
            The reported duration was
            <strong>
                ${escapeHTML(
                    event.duration
                )}
            </strong>.
        </p>

        <p>
            ${escapeHTML(
                event.battle_summary ||
                `The confrontation caused damage across ${event.location}, affecting buildings, roads, vehicles, businesses and essential services.`
            )}
        </p>

        <p>
            The reported winner was
            <strong>
                ${escapeHTML(
                    event.winner
                )}
            </strong>.
        </p>

    `;

}


/* ============================================================
   DAMAGE
   ============================================================ */

function renderDamage(event) {

    const container =
        document.getElementById(
            "damageGrid"
        );


    if (!container) {
        return;
    }


    const damage =
        event.damage;


    const items = [

        [
            "BUILDINGS",
            damage.buildings
        ],

        [
            "ROADS",
            damage.roads
        ],

        [
            "VEHICLES",
            damage.vehicles
        ],

        [
            "BUSINESSES",
            damage.businesses
        ],

        [
            "NPCs AFFECTED",
            damage.npc_affected
        ],

        [
            "INJURIES",
            damage.injuries
        ],

        [
            "MISSING",
            damage.missing
        ],

        [
            "DISPLACED",
            damage.displaced
        ]

    ];


    container.innerHTML =
        items.map(
            ([label, value]) => `

                <div class="damage-card">

                    <strong>
                        ${formatNumber(value)}
                    </strong>

                    <span>
                        ${label}
                    </span>

                </div>

            `
        ).join("");

}


/* ============================================================
   NPC IMPACT
   ============================================================ */

function renderNPCImpact(event) {

    const container =
        document.getElementById(
            "npcImpact"
        );


    if (!container) {
        return;
    }


    const consequences =
        event.consequences;


    const items = [

        [
            "TRANSPORT",
            `${formatNumber(
                consequences.transport_routes
            )} routes affected`
        ],

        [
            "SCHOOLS",
            `${formatNumber(
                consequences.schools_closed
            )} schools closed`
        ],

        [
            "HOSPITALS",
            `${formatNumber(
                consequences.hospitals_affected
            )} hospitals affected`
        ],

        [
            "UTILITIES",
            consequences.utilities
        ],

        [
            "ECONOMIC LOSS",
            formatCurrency(
                consequences.economic_loss
            )
        ]

    ];


    container.innerHTML =
        items.map(
            ([title, text]) => `

                <div class="impact-card">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            String(text)
                        )}
                    </p>

                </div>

            `
        ).join("");

}


/* ============================================================
   QUOTES
   ============================================================ */

function renderQuotes(event) {

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
            `<p class="no-quotes">
                No direct resident statements have been published yet.
            </p>`;

        return;

    }


    container.innerHTML =
        quotes.map(
            quote => `

                <blockquote>

                    “${escapeHTML(
                        quote
                    )}”

                    <cite>
                        — Local resident
                    </cite>

                </blockquote>

            `
        ).join("");

}


/* ============================================================
   AFTERMATH
   ============================================================ */

function renderAftermath(event) {

    const container =
        document.getElementById(
            "incidentAftermath"
        );


    if (!container) {
        return;
    }


    const aftermath =
        event.aftermath;


    if (
        typeof aftermath ===
        "string"
    ) {

        container.innerHTML =
            `<p>${escapeHTML(
                aftermath
            )}</p>

            <div class="aftermath-warning">
                THE BATTLE IS OVER.
                THE CONSEQUENCES ARE NOT.
            </div>`;

        return;

    }


    if (
        aftermath &&
        typeof aftermath ===
        "object"
    ) {

        container.innerHTML = `

            <p>
                ${escapeHTML(
                    aftermath.immediate ||
                    ""
                )}
            </p>

            <p>
                ${escapeHTML(
                    aftermath.short_term ||
                    ""
                )}
            </p>

            <p>
                ${escapeHTML(
                    aftermath.long_term ||
                    ""
                )}
            </p>

            <div class="aftermath-warning">
                THE BATTLE IS OVER.
                THE CONSEQUENCES ARE NOT.
            </div>

        `;

        return;

    }


    container.innerHTML = `

        <p>
            Emergency services are continuing
            to assess the affected area.
        </p>

        <p>
            Infrastructure repairs,
            business recovery and civilian
            relocation are expected to continue
            after the confrontation.
        </p>

        <div class="aftermath-warning">
            THE BATTLE IS OVER.
            THE CONSEQUENCES ARE NOT.
        </div>

    `;

}


/* ============================================================
   RELATED
   ============================================================ */

function renderRelated(eventId) {

    const container =
        document.getElementById(
            "relatedArticles"
        );


    if (!container) {
        return;
    }


    const articles =
        getEventArticles(
            eventId
        );


    container.innerHTML =
        articles.map(article => `

            <article
                class="related-card clickable"
                data-event-id="${escapeAttribute(article.event_id)}"
                data-article-id="${escapeAttribute(article.id)}"
            >

                <small>
                    ${escapeHTML(
                        article.category
                    )}
                </small>

                <h3>
                    ${escapeHTML(
                        article.headline
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        article.summary
                    )}
                </p>

                <div class="read-more">
                    READ THIS REPORT →
                </div>

            </article>

        `).join("");

}


/* ============================================================
   FACTS
   ============================================================ */

function renderFacts(event) {

    const container =
        document.getElementById(
            "incidentFacts"
        );


    if (!container) {
        return;
    }


    const damage =
        event.damage;


    const consequences =
        event.consequences;


    container.innerHTML = `

        <div class="fact">

            <span>WORLD</span>

            <strong>
                ${escapeHTML(
                    event.world
                )}
            </strong>

        </div>


        <div class="fact">

            <span>LOCATION</span>

            <strong>
                ${escapeHTML(
                    event.location
                )}
            </strong>

        </div>


        <div class="fact">

            <span>DURATION</span>

            <strong>
                ${escapeHTML(
                    event.duration
                )}
            </strong>

        </div>


        <div class="fact">

            <span>NPCs AFFECTED</span>

            <strong>
                ${formatNumber(
                    damage.npc_affected
                )}
            </strong>

        </div>


        <div class="fact">

            <span>ECONOMIC LOSS</span>

            <strong>
                ${formatCurrency(
                    consequences.economic_loss
                )}
            </strong>

        </div>

    `;

}


/* ============================================================
   WINNER
   ============================================================ */

function renderWinner(event) {

    const container =
        document.getElementById(
            "incidentWinner"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="winner-name">
            ${escapeHTML(
                event.winner
            )}
        </div>

        <div class="winner-duration">
            Reported duration:
            ${escapeHTML(
                event.duration
            )}
        </div>

    `;

}


/* ============================================================
   GET ARTICLES FOR EVENT
   ============================================================ */

function getEventArticles(eventId) {

    return allArticles
        .filter(
            article =>
                String(
                    article.event_id
                ) ===
                String(eventId)
        )
        .sort(sortByDate);

}


/* ============================================================
   CREATE EVENTS FROM ARTICLES
   ============================================================ */

function createEventsFromArticles() {

    const map = {};


    allArticles.forEach(article => {

        const eventId =
            article.event_id;


        if (!eventId) {
            return;
        }


        if (!map[eventId]) {

            if (article.event) {

                map[eventId] =
                    normalizeEvent(
                        article.event
                    );

            } else {

                map[eventId] = {

                    id:
                        eventId,

                    world:
                        article.world ||
                        "UNKNOWN WORLD",

                    location:
                        article.location ||
                        "UNKNOWN LOCATION",

                    characters:
                        article.characters ||
                        [],

                    winner:
                        article.winner ||
                        "UNCONFIRMED",

                    duration:
                        article.duration ||
                        "UNKNOWN",

                    damage:
                        article.damage ||
                        {},

                    consequences:
                        article.consequences ||
                        {},

                    npc_quotes:
                        article.npc_quotes ||
                        [],

                    timeline:
                        article.timeline ||
                        [],

                    aftermath:
                        article.aftermath ||
                        null

                };

            }

        }

    });


    return Object.values(map);

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {

    document
        .querySelectorAll(
            ".main-nav a"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

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
                                String(
                                    category
                                ).toUpperCase()
                        );


                    if (!filtered.length) {

                        showHomepage();

                        return;

                    }


                    renderFilteredHomepage(
                        filtered,
                        category
                    );

                }
            );

        });

}


/* ============================================================
   FILTERED HOMEPAGE
   ============================================================ */

function renderFilteredHomepage(
    articles,
    category
) {

    const homepage =
        document.getElementById(
            "homepage"
        );


    const incidentPage =
        document.getElementById(
            "incidentPage"
        );


    if (homepage) {
        homepage.style.display =
            "block";
    }


    if (incidentPage) {
        incidentPage.style.display =
            "none";
    }


    const grid =
        document.getElementById(
            "newsGrid"
        );


    if (!grid) {
        return;
    }


    const selected =
        shuffle(
            [...articles]
        ).slice(0, 20);


    grid.innerHTML = `

        <div style="
            grid-column:1/-1;
            margin-bottom:10px;
        ">

            <div class="section-heading">

                <h2>
                    ${escapeHTML(
                        category
                    )}
                </h2>

                <span>
                    ${articles.length}
                    REPORTS
                </span>

            </div>

        </div>

        ${selected.map(article => `

            <article
                class="news-card clickable"
                data-event-id="${escapeAttribute(article.event_id)}"
                data-article-id="${escapeAttribute(article.id)}"
            >

                <div class="category">
                    ${escapeHTML(
                        article.category
                    )}
                </div>

                <h3>
                    ${escapeHTML(
                        article.headline
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        article.summary
                    )}
                </p>

                <div class="meta">
                    ${buildMeta(article)}
                </div>

                <div class="read-more">
                    READ MORE →
                </div>

            </article>

        `).join("")}

    `;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   SHOW HOMEPAGE
   ============================================================ */

function showHomepage() {

    const homepage =
        document.getElementById(
            "homepage"
        );


    const incidentPage =
        document.getElementById(
            "incidentPage"
        );


    if (homepage) {

        homepage.style.display =
            "block";

    }


    if (incidentPage) {

        incidentPage.style.display =
            "none";

    }


    if (
        window.location.hash
            .startsWith(
                "#incident/"
            )
    ) {

        history.replaceState(
            null,
            "",
            window.location.pathname +
            window.location.search
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   BACK BUTTON
   ============================================================ */

function setupBackButton() {

    const button =
        document.getElementById(
            "backButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            showHomepage();

        }
    );

}


/* ============================================================
   HASH ROUTER
   ============================================================ */

function handleHash() {

    const hash =
        window.location.hash;


    if (
        !hash.startsWith(
            "#incident/"
        )
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
        getEvent(eventId);


    if (!event) {

        console.error(
            "Incident not found:",
            eventId
        );

        showHomepage();

        return;

    }


    const article =
        getEventArticles(
            eventId
        )[0] || null;


    renderIncident(
        event,
        article
    );

}


/* ============================================================
   META
   ============================================================ */

function buildMeta(article) {

    if (!article) {
        return "";
    }


    const parts = [];


    if (article.reporter) {

        parts.push(
            "BY " +
            String(
                article.reporter
            )
        );

    }


    if (article.published) {

        parts.push(
            formatDate(
                article.published
            )
        );

    }


    if (article.world) {

        parts.push(
            article.world
        );

    }


    if (article.location) {

        parts.push(
            article.location
        );

    }


    return escapeHTML(
        parts.join(" • ")
    );

}


/* ============================================================
   DEFAULT HEADLINE
   ============================================================ */

function buildDefaultHeadline(event) {

    const characters =
        event.characters || [];


    return `${characters[0] || "Combatant"} defeats ${characters[1] || "opponent"} in ${event.location}`;

}


/* ============================================================
   DEFAULT SUMMARY
   ============================================================ */

function buildIncidentSummary(event) {

    return `The ${event.duration} confrontation in ${event.location} has ended, leaving ${formatNumber(event.damage.npc_affected)} NPCs affected and local infrastructure dealing with the aftermath.`;

}


/* ============================================================
   CHARACTERS TEXT
   ============================================================ */

function formatCharacters(event) {

    return (event.characters || [])
        .map(
            character =>
                escapeHTML(
                    character
                )
        )
        .join(" and ");

}


/* ============================================================
   SORT
   ============================================================ */

function sortByDate(a, b) {

    const dateA =
        new Date(
            a.published ||
            a.date ||
            0
        ).getTime();


    const dateB =
        new Date(
            b.published ||
            b.date ||
            0
        ).getTime();


    return dateB - dateA;

}


/* ============================================================
   NUMBER
   ============================================================ */

function numberOrZero(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(
            String(value)
                .replace(/,/g, "")
                .replace(/[^\d.-]/g, "")
        );


    return Number.isFinite(number)
        ? number
        : 0;

}


/* ============================================================
   FORMAT NUMBER
   ============================================================ */

function formatNumber(value) {

    return numberOrZero(
        value
    ).toLocaleString(
        "en-IN"
    );

}


/* ============================================================
   FORMAT CURRENCY
   ============================================================ */

function formatCurrency(value) {

    const number =
        numberOrZero(
            value
        );


    return "₹" +
        number.toLocaleString(
            "en-IN"
        );

}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(value) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

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


/* ============================================================
   RANDOM
   ============================================================ */

function randomItem(array) {

    if (!array || !array.length) {
        return null;
    }


    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];

}


/* ============================================================
   SHUFFLE
   ============================================================ */

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }


    return array;

}


/* ============================================================
   ARTICLE ID
   ============================================================ */

function generateArticleId(article) {

    return (
        String(
            article.event_id ||
            "article"
        ) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


/* ============================================================
   SET TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


/* ============================================================
   SET HTML
   ============================================================ */

function setHTML(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.innerHTML =
            value ?? "";

    }

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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


/* ============================================================
   ESCAPE ATTRIBUTE
   ============================================================ */

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* ============================================================
   ERROR
   ============================================================ */

function showError(message) {

    const homepage =
        document.getElementById(
            "homepage"
        );


    if (!homepage) {
        return;
    }


    homepage.innerHTML = `

        <section style="
            background:white;
            border:1px solid #ccc;
            padding:50px;
            margin:40px 0;
        ">

            <h1 style="
                font-family:Georgia,serif;
            ">
                NEWSROOM ERROR
            </h1>

            <p>
                ${escapeHTML(
                    message
                )}
            </p>

            <p>
                Open the browser console
                for technical details.
            </p>

        </section>

    `;

}
