const leaderboardRows = document.querySelector("#leaderboardRows");
const leaderboardStatus = document.querySelector("#leaderboardStatus");
const golfersCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPFqofsibngSPR-qcSst9N36PxWSo9YDAIhBzpJ27pZkhKh7nEtgwL7ehBFai2Nk2HQyoh3k6GHGok/pub?gid=0&single=true&output=csv";

function getGolferCell(row, headerMap, header) {
    const column = headerMap.get(header);
    return column === undefined ? "" : (row[column] || "").trim();
}

async function loadLeaderboard() {
    if (!leaderboardRows || !leaderboardStatus) {
        return;
    }

    try {
        const response = await fetch(golfersCsvUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        }

        const rows = window.parseCsv(await response.text());
        if (rows.length < 2) {
            throw new Error("The published golfers CSV has no player rows.");
        }

        const headerMap = new Map(rows[0].map((header, index) => [
            header.replace(/^\uFEFF/, "").trim().toLowerCase(),
            index
        ]));
        const requiredHeaders = ["name", "points", "record"];
        const missingHeaders = requiredHeaders.filter((header) => !headerMap.has(header));
        if (missingHeaders.length > 0) {
            throw new Error(`The published golfers CSV is missing columns: ${missingHeaders.join(", ")}.`);
        }

        const golfers = rows.slice(1)
            .filter((row) => row.some((value) => value.trim()))
            .map((row, index) => {
                const name = getGolferCell(row, headerMap, "name");
                if (!name) {
                    return null;
                }

                const points = getGolferCell(row, headerMap, "points");
                const numericPoints = Number(points.replace(/,/g, ""));
                if (!Number.isFinite(numericPoints)) {
                    throw new Error(`The points value for ${name} is not numeric.`);
                }

                return {
                    name,
                    points: points || "0",
                    numericPoints,
                    record: getGolferCell(row, headerMap, "record") || "—",
                    sheetOrder: index
                };
            })
            .filter(Boolean)
            .sort((left, right) => right.numericPoints - left.numericPoints || left.sheetOrder - right.sheetOrder);

        if (golfers.length === 0) {
            throw new Error("The published golfers CSV has no players with a name.");
        }

        const highestScore = golfers[0].numericPoints;
        const hasScoringTie = highestScore > 0
            && golfers.filter((golfer) => golfer.numericPoints === highestScore).length > 1;
        const fragment = document.createDocumentFragment();

        golfers.forEach((golfer, index) => {
            const row = document.createElement("tr");
            if (index === 0 || (hasScoringTie && golfer.numericPoints === highestScore)) {
                row.className = "leaderRow";
            }

            [golfer.points, golfer.name, golfer.record].forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.append(cell);
            });
            fragment.append(row);
        });

        leaderboardRows.replaceChildren(fragment);
        leaderboardStatus.hidden = true;
    } catch (error) {
        console.error("Unable to load the leaderboard from the published Google Sheet.", error);
        leaderboardStatus.textContent = "The leaderboard couldn’t be loaded. Please check the published Google Sheet connection.";
        leaderboardStatus.classList.add("isError");
    }
}

loadLeaderboard();
