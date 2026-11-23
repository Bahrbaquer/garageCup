const leaderboardRows = document.querySelector("#leaderboardRows");
const leaderboardStatus = document.querySelector("#leaderboardStatus");
const golfersCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPFqofsibngSPR-qcSst9N36PxWSo9YDAIhBzpJ27pZkhKh7nEtgwL7ehBFai2Nk2HQyoh3k6GHGok/pub?gid=0&single=true&output=csv";

async function loadLeaderboard() {
    if (!leaderboardRows || !leaderboardStatus) {
        return;
    }

    try {
        const response = await fetch(golfersCsvUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        }

        const golfers = window.getRankedGolfers(window.parseCsv(await response.text()));

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
