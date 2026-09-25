let stories = [];

let lastStory = -1;


async function loadNews() {

    try {

        const response =
            await fetch("news.json");

        stories =
            await response.json();

        showRandomStory();

    }

    catch (error) {

        document.getElementById("news").innerHTML = `

            <div class="error">

                <h2>
                    NEWSROOM FAILURE
                </h2>

                <p>
                    The NPCs have apparently broken
                    the news server.
                </p>

            </div>

        `;

    }

}


function showRandomStory() {

    if (stories.length === 0) {
        return;
    }


    let index;


    do {

        index =
            Math.floor(
                Math.random() * stories.length
            );

    }

    while (
        stories.length > 1 &&
        index === lastStory
    );


    lastStory = index;


    document.getElementById("news").innerHTML =
        stories[index];

}


loadNews();
