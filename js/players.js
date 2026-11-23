const playerCards = document.querySelector("#playerCards");
const playersStatus = document.querySelector("#playersStatus");

function getCell(row, headerMap, header) {
    const column = headerMap.get(header.toLowerCase());
    return column === undefined ? "" : (row[column] || "").trim();
}

function makeStat(label, value) {
    const stat = document.createElement("p");
    const labelElement = document.createElement("span");
    const valueElement = document.createElement("span");

    labelElement.className = "detailLabel";
    labelElement.textContent = label;
    valueElement.textContent = value || "—";
    stat.append(labelElement, valueElement);

    return stat;
}

function makePlayerCard(player, fallback) {
    const card = document.createElement("article");
    const heading = document.createElement("h2");
    const name = document.createElement("span");
    const photo = document.createElement("img");
    const stats = document.createElement("div");
    const backgroundLogo = document.createElement("img");
    const points = player.points || fallback.Points || "";
    const handicap = player.handicap || fallback.Handicap || "";
    const record = player.record || fallback.Record || "";

    card.className = "playerCard";
    name.textContent = player.name;
    heading.append(name);

    photo.className = "bioImg";
    photo.alt = player.name;
    photo.src = window.getGolferImageSource(player.image);
    photo.addEventListener("error", () => {
        photo.src = "images/logo.png";
    }, { once: true });

    stats.className = "leaderStats";
    stats.append(
        makeStat("Garage Cup", points ? `${points} points` : ""),
        makeStat("Handicap", handicap),
        makeStat("Record", record)
    );

    backgroundLogo.className = "playerCardBackground";
    backgroundLogo.src = "images/logo.png";
    backgroundLogo.alt = "";
    backgroundLogo.setAttribute("aria-hidden", "true");

    card.append(heading, photo, stats, backgroundLogo);
    return card;
}

async function loadPlayerCards() {
    if (!playerCards || !playersStatus) {
        return;
    }

    try {
        const fallbacks = JSON.parse(playerCards.dataset.fallbacks || "{}");
        const response = await fetch(playerCards.dataset.sheetUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        }

        const rows = window.parseCsv(await response.text());
        if (rows.length < 2) {
            throw new Error("The published CSV has no player rows.");
        }

        const headers = rows[0].map((header, index) => [
            header.replace(/^\uFEFF/, "").trim().toLowerCase(),
            index
        ]);
        const headerMap = new Map(headers);
        if (!headerMap.has("name")) {
            throw new Error('The published CSV is missing the required "Name" column.');
        }

        const players = rows.slice(1)
            .filter((row) => row.some((value) => value.trim()))
            .map((row) => {
                const name = getCell(row, headerMap, "name");
                if (!name) {
                    return null;
                }

                const image = getCell(row, headerMap, "img");
                return {
                    name,
                    points: getCell(row, headerMap, "points"),
                    handicap: getCell(row, headerMap, "handicap"),
                    record: getCell(row, headerMap, "record"),
                    image
                };
            })
            .filter(Boolean);

        if (players.length === 0) {
            throw new Error("The published CSV has no players with a name.");
        }

        const fragment = document.createDocumentFragment();
        players.forEach((player) => {
            fragment.append(makePlayerCard(player, fallbacks[player.name] || {}));
        });

        playerCards.replaceChildren(fragment);
        playersStatus.hidden = true;
    } catch (error) {
        console.error("Unable to load player profiles from the published Google Sheet.", error);
        playersStatus.textContent = "Player profiles couldn’t be loaded. Please check the published Google Sheet connection.";
        playersStatus.classList.add("isError");
    }
}

loadPlayerCards();
