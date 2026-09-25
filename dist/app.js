"use strict";

/* =========================================================
   NPC NEWS
   FRESH NEWSROOM ENGINE
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

const SEEN_HEADLINES_KEY = "npc_news_seen_headlines_v3";
const GENERATION_KEY = "npc_news_generation_v3";


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

    currentDate.textContent =
        now.toLocaleDateString(
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

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}


function randomID() {

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


function normalizeArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}


function pick(array) {

    if (!Array.isArray(array) ||
        !array.length) {

        return "";
    }

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];
}


function uniqueByHeadline(articles) {

    const seen = new Set();

    return articles.filter(article => {

        const headline =
            String(
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


/* =========================================================
   CROSS-REFRESH MEMORY
========================================================= */

function getSeenHeadlines() {

    try {

        const raw =
            sessionStorage.getItem(
                SEEN_HEADLINES_KEY
            );

        if (!raw) {
            return new Set();
        }

        const parsed =
            JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return new Set();
        }

        return new Set(parsed);

    } catch (error) {

        return new Set();
    }
}


function saveSeenHeadlines(set) {

    try {

        const values =
            [...set].slice(-500);

        sessionStorage.setItem(
            SEEN_HEADLINES_KEY,
            JSON.stringify(values)
        );

    } catch (error) {

        /*
         * sessionStorage may be unavailable
         * in some private/browser configurations.
         */
    }
}


function headlineKey(headline) {

    return String(
        headline || ""
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


/* =========================================================
   NORMALIZE EVENT
========================================================= */

function normalizeEvent(event) {

    if (!event ||
        typeof event !== "object") {

        return null;
    }

    const damage =
        event.damage || {};

    const consequences =
        event.consequences || {};

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
            normalizeArray(
                event.characters
            ),

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
                Number(
                    damage.buildings
                ) || 0,

            roads:
                Number(
                    damage.roads
                ) || 0,

            vehicles:
                Number(
                    damage.vehicles
                ) || 0,

            businesses:
                Number(
                    damage.businesses
                ) || 0,

            npc_affected:
                Number(
                    damage.npc_affected
                ) || 0,

            injuries:
                Number(
                    damage.injuries
                ) || 0,

            missing:
                Number(
                    damage.missing
                ) || 0,

            displaced:
                Number(
                    damage.displaced
                ) || 0
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
            normalizeArray(
                event.npc_quotes
            ),

        timeline:
            normalizeArray(
                event.timeline
            ),

        aftermath:
            event.aftermath ||
            ""
    };
}


/* =========================================================
   NORMALIZE ARTICLE
========================================================= */

function normalizeArticle(article) {

    if (!article ||
        typeof article !== "object") {

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


/* =========================================================
   EVENT FALLBACK
========================================================= */

function createEventsFromArticles(
    articles
) {

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
                        article.summary ||
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

    return [
        ...map.values()
    ];
}


/* =========================================================
   FIND EVENT / ARTICLE
========================================================= */

function getEvent(eventId) {

    return ALL_EVENTS.find(
        event =>
            String(event.id) ===
            String(eventId)
    );
}


function getArticle(articleId) {

    return ALL_ARTICLES.find(
        article =>
            String(article.id) ===
            String(articleId)
    );
}


function getArticlesForEvent(
    eventId
) {

    return ALL_ARTICLES.filter(
        article =>
            String(article.event_id) ===
            String(eventId)
    );
}


/* =========================================================
   ENRICH EVENTS
========================================================= */

function enrichEventsFromArticles() {

    ALL_EVENTS.forEach(event => {

        const articles =
            getArticlesForEvent(
                event.id
            );

        if (!articles.length) {
            return;
        }

        const first =
            articles.find(
                article =>
                    article.type ===
                    "BREAKING"
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
   FRESH ARTICLE TEMPLATES
========================================================= */

const STORY_BLUEPRINTS = [

    {
        type: "BREAKING",
        category: "BREAKING",
        priority: "HIGH",

        headlines: [

            "{location}: {hero} defeats {villain} after {duration}",

            "BREAKING: {hero} wins major clash with {villain} in {location}",

            "{location} battle ends with {hero} declared winner",

            "Major confrontation ends after {duration} in {location}",

            "{hero} claims victory as {location} battle comes to an end"
        ],

        summaries: [

            "The confrontation between {hero} and {villain} has ended after {duration}.",

            "Emergency crews are beginning the response after the latest major clash in {location}.",

            "Officials have confirmed the conclusion of the confrontation in {location}.",

            "Residents are assessing the immediate consequences after the battle."
        ]
    },


    {
        type: "BATTLE",
        category: "BATTLE",
        priority: "HIGH",

        headlines: [

            "{hero} and {villain} clash for {duration}",

            "Inside the {duration} battle between {hero} and {villain}",

            "{location} witnesses another major hero-villain confrontation",

            "Battle report: {hero} overcomes {villain}",

            "What happened during the {location} confrontation"
        ],

        summaries: [

            "The battle lasted {duration} before {hero} emerged as the recorded winner.",

            "Witnesses described a rapidly escalating confrontation across {location}.",

            "The conflict moved through multiple areas before finally ending."
        ]
    },


    {
        type: "DAMAGE",
        category: "DAMAGE",
        priority: "HIGH",

        headlines: [

            "{buildings} buildings damaged during {location} battle",

            "{location} begins damage assessment after major clash",

            "Damage crews face {buildings} affected buildings after battle",

            "{roads} roads and {vehicles} vehicles among latest damage figures",

            "Officials release initial damage figures from {location}"
        ],

        summaries: [

            "Initial assessments indicate {buildings} buildings and {roads} roads were affected.",

            "Authorities are continuing to document structural and transport damage.",

            "Repair teams are being assigned as the scale of the damage becomes clearer."
        ]
    },


    {
        type: "ROADS",
        category: "TRANSPORT",
        priority: "NORMAL",

        headlines: [

            "{roads} roads affected after {location} confrontation",

            "Road crews begin clearing routes around {location}",

            "{location} transport network faces disruption after battle",

            "Drivers warned as damaged roads slow movement",

            "Repair teams inspect roads damaged during latest incident"
        ],

        summaries: [

            "{roads} roads have been listed for inspection or repair.",

            "Transport officials are working to reopen affected routes.",

            "Drivers are being asked to avoid damaged sections where possible."
        ]
    },


    {
        type: "VEHICLES",
        category: "TRANSPORT",
        priority: "NORMAL",

        headlines: [

            "{vehicles} vehicles reported damaged in {location}",

            "Vehicle owners begin assessing battle-related losses",

            "Parking areas become part of {location} damage assessment",

            "Transport operators count damaged vehicles after confrontation",

            "Vehicle recovery crews deployed around {location}"
        ],

        summaries: [

            "{vehicles} vehicles are included in the initial damage assessment.",

            "Recovery operators are beginning to remove damaged vehicles.",

            "Residents are checking cars, taxis and commercial vehicles."
        ]
    },


    {
        type: "PUBLIC TRANSPORT",
        category: "TRANSPORT",
        priority: "NORMAL",

        headlines: [

            "{transportRoutes} transport routes affected by {location} battle",

            "Public transport schedules disrupted after confrontation",

            "Transit operators adjust routes around damaged areas",

            "{location} commuters face temporary route changes",

            "Transport authorities announce emergency route review"
        ],

        summaries: [

            "{transportRoutes} routes are currently affected by the incident.",

            "Transit operators are reviewing alternative routes.",

            "Commuters are being advised to expect delays."
        ]
    },


    {
        type: "BUSINESS",
        category: "BUSINESS",
        priority: "NORMAL",

        headlines: [

            "{businesses} businesses report disruption after battle",

            "{location} shops begin counting losses after confrontation",

            "Local businesses face another difficult day after {location} clash",

            "Business owners survey damage across {location}",

            "Commercial district begins recovery after major incident"
        ],

        summaries: [

            "{businesses} businesses are included in the initial assessment.",

            "Shop owners are reopening where conditions allow.",

            "Commercial activity remains disrupted in affected areas."
        ]
    },


    {
        type: "EMPLOYMENT",
        category: "NPC LIFE",
        priority: "NORMAL",

        headlines: [

            "Workers in {location} told to expect disruption",

            "Employers introduce temporary arrangements after battle",

            "Office workers adapt to damage around {location}",

            "Businesses ask staff to work remotely where possible",

            "Workers face another day of uncertainty after confrontation"
        ],

        summaries: [

            "Some employers are introducing temporary working arrangements.",

            "Workers are adapting to transport and building disruptions.",

            "Local businesses are reviewing staffing plans."
        ]
    },


    {
        type: "HOUSING",
        category: "HOUSING",
        priority: "NORMAL",

        headlines: [

            "{displaced} residents displaced after {location} battle",

            "Families begin returning to damaged homes",

            "Housing teams inspect buildings around {location}",

            "Residents seek temporary accommodation after confrontation",

            "Apartment residents wait for safety inspections"
        ],

        summaries: [

            "{displaced} residents are listed as displaced in the initial assessment.",

            "Housing officials are inspecting affected buildings.",

            "Families are waiting for clearance before returning home."
        ]
    },


    {
        type: "SCHOOLS",
        category: "HEALTH",
        priority: "NORMAL",

        headlines: [

            "{schoolsClosed} schools closed following {location} incident",

            "Schools across {location} review reopening plans",

            "Students affected as schools remain closed",

            "Education officials assess battle-related disruption",

            "School closures continue while authorities inspect affected areas"
        ],

        summaries: [

            "{schoolsClosed} schools are currently affected.",

            "Education officials are reviewing building safety.",

            "Families are waiting for further reopening information."
        ]
    },


    {
        type: "HOSPITALS",
        category: "HEALTH",
        priority: "HIGH",

        headlines: [

            "{hospitalsAffected} hospitals affected by latest emergency",

            "Hospitals around {location} activate emergency procedures",

            "Medical facilities prepare for continued response",

            "Healthcare workers respond after major confrontation",

            "Hospitals review capacity following {location} battle"
        ],

        summaries: [

            "{hospitalsAffected} hospitals are included in the current response assessment.",

            "Medical teams are continuing emergency operations.",

            "Healthcare facilities are reviewing staffing and capacity."
        ]
    },


    {
        type: "INJURIES",
        category: "HEALTH",
        priority: "HIGH",

        headlines: [

            "{injuries} injuries recorded after {location} confrontation",

            "Medical teams treat injured residents following battle",

            "Emergency departments respond to {injuries} reported injuries",

            "Injury figures rise as assessment continues",

            "Residents receive treatment after {location} incident"
        ],

        summaries: [

            "Officials currently report {injuries} injuries.",

            "Medical teams are continuing to assess affected residents.",

            "Some injuries were reported after the confrontation ended."
        ]
    },


    {
        type: "MISSING PERSONS",
        category: "NPC LIFE",
        priority: "HIGH",

        headlines: [

            "{missing} people remain missing after {location} battle",

            "Search teams continue looking for missing residents",

            "Families await information on {missing} missing people",

            "Authorities expand search around affected areas",

            "Missing-person investigation continues after confrontation"
        ],

        summaries: [

            "{missing} people are currently listed as missing.",

            "Search teams are checking damaged and evacuated areas.",

            "Families are waiting for updates from authorities."
        ]
    },


    {
        type: "UTILITIES",
        category: "NPC LIFE",
        priority: "HIGH",

        headlines: [

            "Utility services disrupted across {location}",

            "{location} residents face utility inspections after battle",

            "Crews work to restore essential services",

            "Power and water systems undergo emergency checks",

            "Utility teams begin post-battle repairs"
        ],

        summaries: [

            "{utilities}",

            "Utility crews are inspecting essential infrastructure.",

            "Residents have been warned that restoration work may take time."
        ]
    },


    {
        type: "FOOD",
        category: "NPC LIFE",
        priority: "NORMAL",

        headlines: [

            "Food demand rises across {location} after battle",

            "Local stores report unusual demand for essentials",

            "Residents stock up as disruption continues",

            "Food suppliers adjust deliveries after confrontation",

            "Supermarkets adapt to changing demand"
        ],

        summaries: [

            "Local stores are reporting changes in demand following the incident.",

            "Residents are purchasing additional essential supplies.",

            "Suppliers are reviewing delivery schedules."
        ]
    },


    {
        type: "ECONOMY",
        category: "BUSINESS",
        priority: "NORMAL",

        headlines: [

            "{loss} economic loss estimated after {location} battle",

            "Economic impact of {location} confrontation comes into focus",

            "Businesses assess financial consequences of latest incident",

            "Repair costs expected to weigh on local economy",

            "Officials begin calculating economic losses"
        ],

        summaries: [

            "The initial economic impact is estimated at {loss}.",

            "Businesses are beginning to calculate direct and indirect losses.",

            "The financial consequences extend beyond damaged buildings."
        ]
    },


    {
        type: "INSURANCE",
        category: "BUSINESS",
        priority: "NORMAL",

        headlines: [

            "Insurance claims expected to surge after {location} battle",

            "Insurers prepare for wave of damage claims",

            "Property owners begin documenting battle losses",

            "Vehicle owners contact insurers after confrontation",

            "Claims teams move into affected areas"
        ],

        summaries: [

            "Property and vehicle owners are beginning to document losses.",

            "Insurance teams are preparing for a large number of claims.",

            "Claims assessment is expected to continue for days."
        ]
    },


    {
        type: "GOVERNMENT",
        category: "BREAKING",
        priority: "NORMAL",

        headlines: [

            "Officials announce emergency response for {location}",

            "Government teams coordinate response after major battle",

            "Authorities release first official response",

            "{location} emergency operation enters recovery phase",

            "Officials promise continued support for affected residents"
        ],

        summaries: [

            "Authorities have begun coordinating emergency and recovery operations.",

            "Government departments are assessing immediate needs.",

            "Officials say the response will continue until major hazards are cleared."
        ]
    },


    {
        type: "NPC INTERVIEW",
        category: "NPC LIFE",
        priority: "NORMAL",

        headlines: [

            "Residents of {location} describe the moment the battle began",

            "NPCs tell their stories after the {location} confrontation",

            "Inside the lives disrupted by the latest battle",

            "Residents explain what happened on the ground",

            "Local voices emerge after {location} clash"
        ],

        summaries: [

            "Residents described confusion, noise and sudden disruption during the confrontation.",

            "People living near the affected area are beginning to share their experiences.",

            "Local residents say the aftermath may last longer than the battle itself."
        ]
    },


    {
        type: "SOCIAL MEDIA",
        category: "NPC LIFE",
        priority: "NORMAL",

        headlines: [

            "Social media fills with footage from {location}",

            "Residents flood networks with battle aftermath images",

            "Online reports document disruption across {location}",

            "NPCs share damage photos as cleanup begins",

            "The {location} battle dominates local feeds"
        ],

        summaries: [

            "Residents are sharing photos and reports from affected areas.",

            "Online posts are helping families track changing conditions.",

            "Authorities are also monitoring public reports."
        ]
    },


    {
        type: "EMERGENCY SERVICES",
        category: "HEALTH",
        priority: "HIGH",

        headlines: [

            "Emergency crews remain deployed across {location}",

            "Rescue teams continue work after battle ends",

            "Fire, medical and rescue crews coordinate response",

            "Emergency services enter second phase of operation",

            "Response teams search damaged areas"
        ],

        summaries: [

            "Emergency services remain active across several affected areas.",

            "Rescue and medical teams are continuing their work.",

            "Crews are moving from rescue operations toward recovery."
        ]
    },


    {
        type: "ENVIRONMENT",
        category: "DAMAGE",
        priority: "NORMAL",

        headlines: [

            "Environmental teams inspect {location} after battle",

            "Cleanup crews assess debris and damaged areas",

            "Battle leaves environmental concerns behind",

            "Authorities begin post-battle environmental inspection",

            "Debris cleanup expands around {location}"
        ],

        summaries: [

            "Environmental teams are assessing debris and damaged infrastructure.",

            "Cleanup operations are expanding across affected areas.",

            "Officials are monitoring the area for secondary hazards."
        ]
    },


    {
        type: "RECONSTRUCTION",
        category: "DAMAGE",
        priority: "NORMAL",

        headlines: [

            "Reconstruction begins across {location}",

            "Repair crews arrive after major confrontation",

            "{location} enters early reconstruction phase",

            "Workers begin rebuilding damaged infrastructure",

            "Recovery teams map out reconstruction priorities"
        ],

        summaries: [

            "Repair teams are beginning work on damaged infrastructure.",

            "Authorities are prioritising essential services and transport routes.",

            "Reconstruction planning has started across affected areas."
        ]
    },


    {
        type: "LONG TERM",
        category: "NPC LIFE",
        priority: "NORMAL",

        headlines: [

            "Residents ask what comes next for {location}",

            "Long-term recovery questions emerge after battle",

            "How {location} could change after the confrontation",

            "The battle is over. Recovery has only begun.",

            "Residents prepare for a long rebuilding process"
        ],

        summaries: [

            "The immediate emergency may be over, but recovery is expected to continue.",

            "Residents are already asking how the area will change.",

            "Long-term rebuilding could affect daily life for months."
        ]
    },


    {
        type: "LOCAL BUSINESS",
        category: "BUSINESS",
        priority: "NORMAL",

        headlines: [

            "Coffee shop reopens after {location} disruption",

            "Small businesses try to reopen after battle",

            "Local shop owners begin recovery",

            "First businesses return to normal operations",

            "Independent businesses reopen despite continuing repairs"
        ],

        summaries: [

            "Some local businesses are cautiously reopening.",

            "Owners are cleaning, repairing and preparing to resume trade.",

            "Small businesses say returning to normal will take time."
        ]
    },


    {
        type: "COMMUNITY",
        category: "NPC LIFE",
        priority: "NORMAL",

        headlines: [

            "Residents form cleanup groups across {location}",

            "Community volunteers begin clearing battle debris",

            "Neighbours organise recovery effort",

            "Residents help one another after confrontation",

            "Community cleanup expands across affected streets"
        ],

        summaries: [

            "Residents are organising volunteer cleanup efforts.",

            "Neighbourhood groups are helping affected families.",

            "Community volunteers have begun clearing smaller areas."
        ]
    },


    {
        type: "TAXI",
        category: "TRANSPORT",
        priority: "NORMAL",

        headlines: [

            "Taxi drivers create temporary routes around {location}",

            "Local drivers improvise new routes after road damage",

            "Taxi operators help commuters bypass damaged roads",

            "Drivers adapt to post-battle traffic restrictions",

            "Transport workers build unofficial recovery routes"
        ],

        summaries: [

            "Taxi drivers are adapting routes around damaged roads.",

            "Local drivers are helping commuters reach unaffected areas.",

            "Transport workers are responding to changing road conditions."
        ]
    },


    {
        type: "APARTMENT",
        category: "HOUSING",
        priority: "NORMAL",

        headlines: [

            "Apartment residents return after safety inspections",

            "Families return to buildings cleared after battle",

            "Housing blocks begin reopening in {location}",

            "Residents wait for apartment clearance",

            "Building inspections continue across {location}"
        ],

        summaries: [

            "Some residents are beginning to return after inspections.",

            "Housing teams are checking buildings before reopening.",

            "Families are waiting for official clearance."
        ]
    },


    {
        type: "SUPERMARKET",
        category: "BUSINESS",
        priority: "NORMAL",

        headlines: [

            "Local supermarket reports unusually high demand",

            "Stores see rush for essential supplies",

            "Supermarkets adjust stock after battle",

            "Demand for food and water rises across {location}",

            "Retailers struggle to keep essential goods available"
        ],

        summaries: [

            "Retailers are reporting unusually high demand.",

            "Stores are adjusting supply levels to meet changing needs.",

            "Essential goods remain the main focus for shoppers."
        ]
    },


    {
        type: "STREET VENDORS",
        category: "BUSINESS",
        priority: "NORMAL",

        headlines: [

            "Street vendors relocate after battle damage",

            "Small vendors move away from damaged streets",

            "Local vendors search for safer trading areas",

            "Street markets shift following {location} disruption",

            "Vendors adapt to changing pedestrian traffic"
        ],

        summaries: [

            "Street vendors are relocating around damaged areas.",

            "Small traders are searching for safer and busier locations.",

            "The local street economy is adapting to the disruption."
        ]
    },


    {
        type: "REMOTE WORK",
        category: "EMPLOYMENT",
        priority: "NORMAL",

        headlines: [

            "Office workers switch to remote work after battle",

            "Companies introduce temporary remote-work arrangements",

            "Workers stay home as {location} repairs continue",

            "Businesses move staff online during recovery",

            "Remote work expands after infrastructure disruption"
        ],

        summaries: [

            "Some companies are allowing staff to work remotely.",

            "Employers are adjusting operations while repairs continue.",

            "Workers are avoiding affected areas where possible."
        ]
    },


    {
        type: "DEBRIS",
        category: "DAMAGE",
        priority: "NORMAL",

        headlines: [

            "Residents complain about slow debris collection",

            "Debris remains on streets across {location}",

            "Cleanup delays frustrate local residents",

            "Waste crews struggle with post-battle debris",

            "Residents ask when damaged streets will be cleared"
        ],

        summaries: [

            "Residents are asking for faster debris collection.",

            "Cleanup crews are working through large quantities of debris.",

            "Some streets remain difficult to access."
        ]
    }

];


/* =========================================================
   TEMPLATE DATA
========================================================= */

function eventTemplateData(event) {

    const damage =
        event.damage || {};

    const consequences =
        event.consequences || {};

    let hero = "";
    let villain = "";

    if (
        Array.isArray(event.characters)
    ) {

        const names =
            event.characters
                .map(character => {

                    if (
                        typeof character ===
                        "string"
                    ) {
                        return character;
                    }

                    return character?.name ||
                        "";
                })
                .filter(Boolean);

        hero =
            names[0] ||
            event.winner ||
            "The Hero";

        villain =
            names[1] ||
            "The Villain";
    }

    if (!hero) {
        hero = event.winner || "The Hero";
    }

    if (!villain) {
        villain = "The Villain";
    }

    return {

        location:
            event.location,

        world:
            event.world,

        hero,

        villain,

        winner:
            event.winner,

        duration:
            event.duration,

        buildings:
            formatNumber(
                damage.buildings
            ),

        roads:
            formatNumber(
                damage.roads
            ),

        vehicles:
            formatNumber(
                damage.vehicles
            ),

        businesses:
            formatNumber(
                damage.businesses
            ),

        npcAffected:
            formatNumber(
                damage.npc_affected
            ),

        injuries:
            formatNumber(
                damage.injuries
            ),

        missing:
            formatNumber(
                damage.missing
            ),

        displaced:
            formatNumber(
                damage.displaced
            ),

        transportRoutes:
            formatNumber(
                consequences.transport_routes
            ),

        schoolsClosed:
            formatNumber(
                consequences.schools_closed
            ),

        hospitalsAffected:
            formatNumber(
                consequences.hospitals_affected
            ),

        utilities:
            consequences.utilities,

        loss:
            formatCurrency(
                consequences.economic_loss
            )
    };
}


/* =========================================================
   REPLACE TEMPLATE VARIABLES
========================================================= */

function fillTemplate(
    template,
    data
) {

    return String(template)
        .replace(
            /\{([a-zA-Z0-9_]+)\}/g,
            function(_, key) {

                return data[key] !== undefined
                    ? data[key]
                    : "";
            }
        );
}


/* =========================================================
   GENERATE ARTICLE
========================================================= */

function generateFreshArticle(
    event,
    blueprint,
    seenHeadlines
) {

    const data =
        eventTemplateData(event);

    const headlineOptions =
        blueprint.headlines || [];

    const summaryOptions =
        blueprint.summaries || [];

    /*
     * Try several times to avoid a headline
     * already seen during this browser session.
     */

    let headline = "";
    let summary = "";

    for (
        let attempt = 0;
        attempt < 20;
        attempt++
    ) {

        headline =
            fillTemplate(
                pick(headlineOptions),
                data
            );

        const key =
            headlineKey(headline);

        if (
            key &&
            !seenHeadlines.has(key)
        ) {
            break;
        }
    }

    /*
     * Summary.
     */

    summary =
        fillTemplate(
            pick(summaryOptions),
            data
        );


    /*
     * Build a longer newsroom body.
     */

    const bodyParts = [

        summary,

        `${event.location} remains the main focus of the latest response.`,

        `The confrontation involved ${data.hero} and ${data.villain} and lasted ${data.duration}.`,

        `Initial figures indicate ${data.buildings} buildings, ${data.roads} roads and ${data.vehicles} vehicles were affected.`,

        `${data.npcAffected} NPCs are included in the current impact assessment.`,

        `Officials continue to review the wider consequences of the incident.`

    ];


    /*
     * Remove repeated/empty sentences.
     */

    const body =
        [...new Set(
            bodyParts
                .filter(Boolean)
        )]
        .join(" ");


    /*
     * Random publication time.
     *
     * This makes the newsroom look like a
     * stream of reports rather than 256 reports
     * having exactly the same timestamp.
     */

    const minutesAgo =
        Math.floor(
            Math.random() * 720
        );

    const published =
        new Date(
            Date.now() -
            minutesAgo * 60 * 1000
        ).toISOString();


    const article = {

        id:
            randomID(),

        event_id:
            event.id,

        category:
            blueprint.category,

        type:
            blueprint.type,

        priority:
            blueprint.priority,

        headline,

        summary,

        body,

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

        published,

        reporter:
            randomReporter()
    };


    return article;
}


/* =========================================================
   REPORTER NAMES
========================================================= */

function randomReporter() {

    const reporters = [

        "NPC News Desk",

        "Central Desk",

        "World Affairs Desk",

        "Emergency Desk",

        "City Bureau",

        "Transport Bureau",

        "Business Desk",

        "NPC Life Desk",

        "Recovery Desk",

        "Field Reporter",

        "Night Desk",

        "Public Affairs Desk"

    ];

    return pick(reporters);
}


/* =========================================================
   GENERATE FRESH NEWSROOM
========================================================= */

function generateFreshNewsroom(
    events
) {

    const generated = [];

    const seenHeadlines =
        getSeenHeadlines();


    /*
     * Shuffle events so every refresh can
     * produce a different order.
     */

    const shuffledEvents =
        shuffle(events);


    shuffledEvents.forEach(event => {

        /*
         * Shuffle the complete blueprint list.
         *
         * Every incident can therefore receive
         * a different mix of reports.
         */

        const blueprints =
            shuffle(
                STORY_BLUEPRINTS
            );


        /*
         * Generate approximately 20-30 reports
         * per incident.
         *
         * This is fresh client-side content.
         */

        const amount =
            20 +
            Math.floor(
                Math.random() * 9
            );


        blueprints
            .slice(0, amount)
            .forEach(blueprint => {

                const article =
                    generateFreshArticle(
                        event,
                        blueprint,
                        seenHeadlines
                    );


                const key =
                    headlineKey(
                        article.headline
                    );


                /*
                 * Prevent duplicates within
                 * this generated newsroom too.
                 */

                if (
                    key &&
                    !generated.some(
                        item =>
                            headlineKey(
                                item.headline
                            ) === key
                    )
                ) {

                    generated.push(
                        article
                    );

                    seenHeadlines.add(
                        key
                    );
                }
            });
    });


    saveSeenHeadlines(
        seenHeadlines
    );


    /*
     * Shuffle the final newsroom.
     */

    return shuffle(
        generated
    );
}


/* =========================================================
   LOAD NEWS
========================================================= */

async function loadNews() {

    try {

        const response =
            await fetch(
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


        NEWS =
            data || {};


        let rawEvents = [];

        let rawArticles = [];


        if (
            Array.isArray(data)
        ) {

            rawArticles =
                data;

        } else {

            rawEvents =
                Array.isArray(
                    data.events
                )
                    ? data.events
                    : [];

            rawArticles =
                Array.isArray(
                    data.articles
                )
                    ? data.articles
                    : [];
        }


        /*
         * First load the permanent incident
         * information.
         */

        ALL_EVENTS =
            rawEvents
                .map(
                    normalizeEvent
                )
                .filter(Boolean);


        /*
         * If events aren't available,
         * reconstruct them from the old
         * article data.
         */

        if (
            !ALL_EVENTS.length
        ) {

            const oldArticles =
                rawArticles
                    .map(
                        normalizeArticle
                    )
                    .filter(Boolean);

            ALL_EVENTS =
                createEventsFromArticles(
                    oldArticles
                );
        }


        /*
         * Keep old articles temporarily so
         * events can be enriched if necessary.
         */

        const oldArticles =
            rawArticles
                .map(
                    normalizeArticle
                )
                .filter(Boolean);


        ALL_ARTICLES =
            oldArticles;


        enrichEventsFromArticles();


        /*
         * THIS IS THE IMPORTANT PART.
         *
         * We now throw away the permanent
         * article list as the primary newsroom
         * and generate a fresh newsroom from
         * the incidents.
         */

        ALL_ARTICLES =
            generateFreshNewsroom(
                ALL_EVENTS
            );


        /*
         * If something went wrong and no fresh
         * articles were created, use old data.
         */

        if (
            !ALL_ARTICLES.length &&
            oldArticles.length
        ) {

            ALL_ARTICLES =
                oldArticles;
        }


        /*
         * New generation identifier.
         */

        try {

            sessionStorage.setItem(
                GENERATION_KEY,
                randomID()
            );

        } catch (error) {}


        renderStatistics();

        renderTicker();

        setupNavigation();

        handleHash();

    } catch (error) {

        console.error(error);

        if (homepage) {

            homepage.innerHTML = `

                <section class="incident-section">

                    <h2>
                        NEWSROOM ERROR
                    </h2>

                    <p>
                        NPC News could not load
                        the newsroom data.
                    </p>

                    <p>
                        Please check that
                        <strong>
                            news.json
                        </strong>
                        exists inside the
                        dist folder.
                    </p>

                </section>

            `;
        }
    }
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
                (
                    sum,
                    event
                ) =>
                    sum +
                    Number(
                        event.damage
                            ?.npc_affected
                        || 0
                    ),
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
                article.type ===
                    "BREAKING" ||
                article.priority ===
                    "HIGH"
        );


    const selected =
        shuffle(
            breaking.length
                ? breaking
                : ALL_ARTICLES
        )
        .slice(0, 5);


    breakingTicker.innerHTML =
        selected
            .map(article => {

                return `

                    <span
                        class="ticker-item"
                        data-event-id="${escapeHTML(
                            article.event_id
                        )}"
                        data-article-id="${escapeHTML(
                            article.id
                        )}">

                        ${escapeHTML(
                            article.headline
                        )}

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
        .querySelectorAll(
            ".main-nav a[data-category]"
        )
        .forEach(link => {

            if (
                link.dataset.navigationReady ===
                "true"
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

function navigateToCategory(
    category
) {

    category =
        String(
            category || "ALL"
        )
        .trim()
        .toUpperCase();


    currentView =
        category;

    currentEventId =
        null;

    currentArticleId =
        null;


    const hash =
        category === "ALL"
            ? "#home"
            : "#category/" +
              encodeURIComponent(
                  category
              );


    if (
        window.location.hash !==
        hash
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


    if (
        category === "ALL"
    ) {

        restoreHomepageSections();

        renderHomepage();

        return;
    }


    if (
        category === "WORLDS"
    ) {

        renderWorldsPage();

        return;
    }


    restoreHomepageSections();

    renderCategoryPage(
        category
    );
}


/* =========================================================
   SHOW PAGES
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

    restoreHomepageSections();

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
                article.priority ===
                    "HIGH" ||
                article.type ===
                    "BREAKING"
        );


    const source =
        breaking.length
            ? breaking
            : ALL_ARTICLES;


    const article =
        pick(
            shuffle(source)
        );


    if (!article) {
        return;
    }


    if (leadCategory) {

        leadCategory.textContent =
            article.category ||
            "BREAKING";
    }


    if (leadHeadline) {

        leadHeadline.textContent =
            article.headline;
    }


    if (leadSummary) {

        leadSummary.textContent =
            article.summary || "";
    }


    if (leadMeta) {

        leadMeta.innerHTML = `

            ${escapeHTML(
                article.world || ""
            )}

            •

            ${escapeHTML(
                article.location || ""
            )}

            •

            ${formatDate(
                article.published
            )}

        `;
    }


    if (leadBody) {

        leadBody.innerHTML =
            article.body
                ? `<p>${escapeHTML(
                    article.body
                )}</p>`
                : "";
    }


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
                    event.target ===
                    newLead
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
        )
        .slice(0, 10);


    latestNews.innerHTML =
        selected
            .map(
                article =>
                    articleCard(
                        article,
                        "compact"
                    )
            )
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
            shuffle(
                articles
            )
        )
        .slice(0, 16);


    newsGrid.innerHTML =
        selected
            .map(
                article =>
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

    if (
        !npcNews ||
        !businessNews ||
        !transportNews
    ) {
        return;
    }


    const npc =
        uniqueByHeadline(
            shuffle(
                articles.filter(
                    article =>
                        isNPCArticle(
                            article
                        )
                )
            )
        )
        .slice(0, 5);


    const business =
        uniqueByHeadline(
            shuffle(
                articles.filter(
                    article =>
                        isBusinessArticle(
                            article
                        )
                )
            )
        )
        .slice(0, 5);


    const transport =
        uniqueByHeadline(
            shuffle(
                articles.filter(
                    article =>
                        isTransportArticle(
                            article
                        )
                )
            )
        )
        .slice(0, 5);


    npcNews.innerHTML =
        npc
            .map(
                article =>
                    articleCard(
                        article,
                        "small"
                    )
            )
            .join("");


    businessNews.innerHTML =
        business
            .map(
                article =>
                    articleCard(
                        article,
                        "small"
                    )
            )
            .join("");


    transportNews.innerHTML =
        transport
            .map(
                article =>
                    articleCard(
                        article,
                        "small"
                    )
            )
            .join("");
}


/* =========================================================
   ARTICLE CATEGORY HELPERS
========================================================= */

function isNPCArticle(
    article
) {

    const text =
        (
            article.category +
            " " +
            article.headline +
            " " +
            article.type
        )
        .toUpperCase();


    return (

        text.includes("NPC") ||

        text.includes("HOUSING") ||

        text.includes("SOCIAL") ||

        text.includes("FOOD") ||

        text.includes("EMPLOYMENT") ||

        text.includes("COMMUNITY")
    );
}


function isBusinessArticle(
    article
) {

    const text =
        (
            article.category +
            " " +
            article.headline +
            " " +
            article.type
        )
        .toUpperCase();


    return (

        text.includes("BUSINESS") ||

        text.includes("ECONOM") ||

        text.includes("INSURANCE") ||

        text.includes("EMPLOYMENT")
    );
}


function isTransportArticle(
    article
) {

    const text =
        (
            article.category +
            " " +
            article.headline +
            " " +
            article.type
        )
        .toUpperCase();


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
            data-event-id="${escapeHTML(
                article.event_id
            )}"
            data-article-id="${escapeHTML(
                article.id
            )}"
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
        [
            ...new Set(
                ALL_EVENTS.map(
                    event =>
                        event.world
                )
            )
        ];


    worldNews.innerHTML =
        worlds
            .map(world => {

                const event =
                    ALL_EVENTS.find(
                        item =>
                            item.world ===
                            world
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
                        data-event-id="${escapeHTML(
                            event.id
                        )}"
                        data-article-id="${
                            escapeHTML(
                                article?.id ||
                                ""
                            )
                        }"
                        tabindex="0"
                        role="button">

                        <div class="article-label">
                            WORLD
                        </div>

                        <h3>
                            ${escapeHTML(
                                world
                            )}
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
            })
            .join("");
}


/* =========================================================
   CATEGORY PAGE
========================================================= */

function renderCategoryPage(
    category
) {

    showHomepage();

    restoreHomepageSections();

    updateActiveNavigation(
        category
    );


    let filtered = [];


    switch (category) {

        case "BREAKING":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        article.type ===
                            "BREAKING" ||
                        article.priority ===
                            "HIGH"
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
                        isNPCArticle(
                            article
                        )
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
                        isBusinessArticle(
                            article
                        )
                );

            break;


        case "TRANSPORT":

            filtered =
                ALL_ARTICLES.filter(
                    article =>
                        isTransportArticle(
                            article
                        )
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


    if (!filtered.length) {

        filtered =
            ALL_ARTICLES.filter(
                article =>
                    String(
                        article.category ||
                        ""
                    )
                    .toUpperCase() ===
                    category
            );
    }


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

    restoreHomepageSections();


    const uniqueArticles =
        uniqueByHeadline(
            articles
        );


    const lead =
        uniqueArticles[0];


    if (lead) {

        if (leadCategory) {

            leadCategory.textContent =
                category;
        }


        if (leadHeadline) {

            leadHeadline.textContent =
                lead.headline;
        }


        if (leadSummary) {

            leadSummary.textContent =
                lead.summary || "";
        }


        if (leadMeta) {

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
        }


        if (leadBody) {

            leadBody.innerHTML =
                lead.body
                    ? `<p>${escapeHTML(
                        lead.body
                    )}</p>`
                    : "";
        }


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


    renderLatest(
        uniqueArticles
    );


    renderNewsGrid(
        uniqueArticles
    );


    renderSmallSections(
        uniqueArticles
    );


    renderWorldNews();


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
        [
            ...new Set(
                ALL_EVENTS.map(
                    event =>
                        event.world
                )
            )
        ];


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


    if (!worldNews) {
        return;
    }


    worldNews.innerHTML =
        worlds
            .map(world => {

                const event =
                    ALL_EVENTS.find(
                        item =>
                            item.world ===
                            world
                    );


                if (!event) {
                    return "";
                }


                const articles =
                    getArticlesForEvent(
                        event.id
                    );


                return `

                    <article
                        class="world-card"
                        data-event-id="${escapeHTML(
                            event.id
                        )}"
                        data-article-id="${
                            escapeHTML(
                                articles[0]?.id ||
                                ""
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
            })
            .join("");
}


/* =========================================================
   RESTORE HOMEPAGE
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
                )
                .toUpperCase();


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
            ? getArticle(
                articleId
            )
            : null;


    if (
        !article ||
        String(
            article.event_id
        ) !== String(eventId)
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
        window.location.hash !==
        hash
    ) {

        history.pushState(
            {
                eventId:
                    event.id,

                articleId:
                    article?.id ||
                    null
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


    const incidentCategory =
        document.getElementById(
            "incidentCategory"
        );


    if (incidentCategory) {

        incidentCategory.textContent =
            category;
    }


    const incidentWorld =
        document.getElementById(
            "incidentWorld"
        );


    if (incidentWorld) {

        incidentWorld.textContent =
            world +
            (
                location
                    ? " • " +
                      location
                    : ""
            );
    }


    const incidentHeadline =
        document.getElementById(
            "incidentHeadline"
        );


    if (incidentHeadline) {

        incidentHeadline.textContent =
            headline;
    }


    const incidentSummary =
        document.getElementById(
            "incidentSummary"
        );


    if (incidentSummary) {

        incidentSummary.textContent =
            summary;
    }


    const incidentMeta =
        document.getElementById(
            "incidentMeta"
        );


    if (incidentMeta) {

        incidentMeta.innerHTML = `

            ${escapeHTML(
                event.world
            )}

            •

            ${escapeHTML(
                event.location
            )}

            •

            Duration:
            ${escapeHTML(
                event.duration
            )}

            •

            ${formatDate(
                article?.published
            )}

        `;
    }


    const incidentOverview =
        document.getElementById(
            "incidentOverview"
        );


    if (incidentOverview) {

        incidentOverview.innerHTML = `

            <p>

                ${escapeHTML(
                    event.overview ||
                    article?.body ||
                    summary
                )}

            </p>

        `;
    }


    renderCharacters(
        event
    );


    renderTimeline(
        event
    );


    const incidentBattle =
        document.getElementById(
            "incidentBattle"
        );


    if (incidentBattle) {

        incidentBattle.innerHTML = `

            <p>

                ${escapeHTML(
                    event.battle_summary ||
                    article?.body ||
                    "Battle details are still being reported."
                )}

            </p>

        `;
    }


    renderDamage(
        event
    );


    renderNPCImpact(
        event
    );


    renderQuotes(
        event
    );


    const incidentAftermath =
        document.getElementById(
            "incidentAftermath"
        );


    if (incidentAftermath) {

        incidentAftermath.innerHTML = `

            <p>

                ${escapeHTML(
                    event.aftermath ||
                    "Authorities are continuing to assess the aftermath."
                )}

            </p>

        `;
    }


    renderRelatedArticles(
        event
    );


    renderFacts(
        event
    );


    const winner =
        document.getElementById(
            "incidentWinner"
        );


    if (winner) {

        winner.innerHTML = `

            <strong>

                ${escapeHTML(
                    event.winner
                )}

            </strong>

            <p>
                Officially recorded winner.
            </p>

        `;
    }


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
        characters
            .map(
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
            )
            .join("");
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
        timeline
            .map(
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
            )
            .join("");
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
        cards
            .map(
                ([label, value]) => `

                    <div class="damage-card">

                        <strong>

                            ${formatNumber(
                                value
                            )}

                        </strong>

                        <span>

                            ${escapeHTML(
                                label
                            )}

                        </span>

                    </div>

                `
            )
            .join("");
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
        cards
            .map(
                ([label, value]) => `

                    <div class="impact-card">

                        <strong>

                            ${
                                typeof value ===
                                "number"

                                    ? formatNumber(
                                        value
                                    )

                                    : escapeHTML(
                                        value
                                    )
                            }

                        </strong>

                        <span>

                            ${escapeHTML(
                                label
                            )}

                        </span>

                    </div>

                `
            )
            .join("");


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
        quotes
            .map(
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

                                            —
                                            ${escapeHTML(
                                                quote.name
                                            )}

                                        </cite>

                                    `
                                    : ""
                            }

                        </blockquote>

                    `;
                }
            )
            .join("");
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
        )
        .slice(0, 12);


    container.innerHTML =
        articles
            .map(
                article =>
                    articleCard(
                        article,
                        "small"
                    )
            )
            .join("");
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

            <span>
                World
            </span>

            <strong>

                ${escapeHTML(
                    event.world
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Location
            </span>

            <strong>

                ${escapeHTML(
                    event.location
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Duration
            </span>

            <strong>

                ${escapeHTML(
                    event.duration
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Buildings
            </span>

            <strong>

                ${formatNumber(
                    damage.buildings
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Roads
            </span>

            <strong>

                ${formatNumber(
                    damage.roads
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Vehicles
            </span>

            <strong>

                ${formatNumber(
                    damage.vehicles
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                NPCs Affected
            </span>

            <strong>

                ${formatNumber(
                    damage.npc_affected
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Injuries
            </span>

            <strong>

                ${formatNumber(
                    damage.injuries
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Missing
            </span>

            <strong>

                ${formatNumber(
                    damage.missing
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Displaced
            </span>

            <strong>

                ${formatNumber(
                    damage.displaced
                )}

            </strong>

        </div>


        <div class="fact-row">

            <span>
                Economic Loss
            </span>

            <strong>

                ${formatCurrency(
                    consequences.economic_loss
                )}

            </strong>

        </div>

    `;
}


/* =========================================================
   GLOBAL CLICK HANDLING
========================================================= */

function setupGlobalClicks() {

    document.addEventListener(
        "click",
        function(event) {

            const target =
                event.target.closest(
                    "[data-event-id]"
                );


            if (!target) {
                return;
            }


            if (
                target.tagName ===
                    "A" ||
                target.closest("a")
            ) {
                return;
            }


            if (
                target.tagName ===
                    "BUTTON" ||
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

            if (
                window.history.length >
                1
            ) {

                history.back();

                return;
            }


            navigateToCategory(
                currentView ||
                "ALL"
            );
        }
    );
}


/* =========================================================
   NEW LEAD
========================================================= */

function setupNewLead() {

    if (!newLead) {
        return;
    }


    newLead.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            /*
             * A completely different lead is
             * selected from the freshly generated
             * newsroom.
             */

            renderLead();
        }
    );
}


/* =========================================================
   HASH ROUTING
========================================================= */

function handleHash() {

    const hash =
        window.location.hash ||
        "";


    if (
        hash === "" ||
        hash === "#home" ||
        hash === "#"
    ) {

        currentView =
            "ALL";

        restoreHomepageSections();

        renderHomepage();

        return;
    }


    if (
        hash.startsWith(
            "#category/"
        )
    ) {

        const category =
            decodeURIComponent(
                hash.replace(
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
            getEvent(
                eventId
            );


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


        let article =
            articleId
                ? getArticle(
                    articleId
                )
                : null;


        if (!article) {

            article =
                getArticlesForEvent(
                    eventId
                )[0];
        }


        showIncidentPage();


        renderIncident(
            event,
            article
        );

        return;
    }


    navigateToCategory(
        "ALL"
    );
}


/* =========================================================
   BROWSER HISTORY
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
                article.category ||
                ""
            ) +

            " " +

            String(
                article.type ||
                ""
            ) +

            " " +

            String(
                article.headline ||
                ""
            ) +

            " " +

            String(
                article.summary ||
                ""
            ) +

            " " +

            String(
                article.body ||
                ""
            )
        )
        .toUpperCase();


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
