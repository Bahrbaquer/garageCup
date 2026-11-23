const leaderName = document.querySelector("#playerName");
const leaderPhoto = document.querySelector("#playerImg");
const leaderPoints = document.querySelector("#pointsTotal");
const leaderRecord = document.querySelector("#playerRecord");
const leaderStatus = document.querySelector("#leaderStatus");
const golfersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPFqofsibngSPR-qcSst9N36PxWSo9YDAIhBzpJ27pZkhKh7nEtgwL7ehBFai2Nk2HQyoh3k6GHGok/pub?gid=0&single=true&output=csv";
const nextCourse = document.querySelector("#nextCourse");
const nextDate = document.querySelector("#nextDate");
const nextFormat = document.querySelector("#nextFormat");
const courseBackground = document.querySelector("#course_bkrd_img");
const nextTeams = document.querySelector("#nextTeams");
const nextTeamA = document.querySelector("#nextTeamA");
const nextTeamB = document.querySelector("#nextTeamB");
const nextRoundStatus = document.querySelector("#nextRoundStatus");
const scheduleSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPFqofsibngSPR-qcSst9N36PxWSo9YDAIhBzpJ27pZkhKh7nEtgwL7ehBFai2Nk2HQyoh3k6GHGok/pub?gid=871809002&single=true&output=csv";

function getScheduleCell(row, headerMap, header) {
    const column = headerMap.get(header);
    return column === undefined ? "" : (row[column] || "").trim();
}

async function loadCurrentLeader() {
    if (!leaderName || !leaderPhoto || !leaderPoints || !leaderRecord || !leaderStatus) {
        return;
    }

    try {
        const response = await fetch(golfersSheetUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        }

        const golfers = window.getRankedGolfers(window.parseCsv(await response.text()));

        const leader = golfers[0];
        leaderName.textContent = leader.name;
        leaderPhoto.src = window.getGolferImageSource(leader.image);
        leaderPhoto.alt = leader.name;
        leaderPhoto.addEventListener("error", () => {
            leaderPhoto.src = "images/logo.png";
        }, { once: true });
        leaderPoints.textContent = leader.points;
        leaderRecord.textContent = leader.record;
    } catch (error) {
        console.error("Unable to load the current leader from the published Google Sheet.", error);
        leaderName.textContent = "Leader unavailable";
        leaderPhoto.src = "images/logo.png";
        leaderPhoto.alt = "";
        leaderPoints.textContent = "—";
        leaderRecord.textContent = "—";
        leaderStatus.textContent = "Current leader details couldn’t be loaded. Please check the published Google Sheet connection.";
        leaderStatus.classList.add("isError");
        leaderStatus.hidden = false;
    }
}

function renderTeam(container, team) {
    const names = team.split(/\s*&\s*/).map((name) => name.trim()).filter(Boolean);
    container.replaceChildren();
    names.forEach((name) => {
        const player = document.createElement("span");
        player.textContent = name;
        container.append(player);
    });
}

async function loadNextRound() {
    if (!nextCourse || !nextDate || !nextFormat || !courseBackground || !nextTeams || !nextTeamA || !nextTeamB || !nextRoundStatus) {
        return;
    }

    try {
        const response = await fetch(scheduleSheetUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        }

        const rows = window.parseCsv(await response.text());
        if (rows.length < 2) {
            throw new Error("The published schedule CSV has no schedule rows.");
        }

        const headerMap = new Map(rows[0].map((header, index) => [
            header.replace(/^\uFEFF/, "").trim().toLowerCase(),
            index
        ]));
        const requiredHeaders = ["date", "course", "format", "team_a", "team_b"];
        const missingHeaders = requiredHeaders.filter((header) => !headerMap.has(header));
        if (missingHeaders.length > 0) {
            throw new Error(`The published schedule CSV is missing columns: ${missingHeaders.join(", ")}.`);
        }

        const firstRound = rows.slice(1).find((row) => row.some((value) => value.trim()));
        if (!firstRound) {
            throw new Error("The published schedule CSV has no schedule rows.");
        }

        const course = getScheduleCell(firstRound, headerMap, "course");
        const date = getScheduleCell(firstRound, headerMap, "date");
        const format = getScheduleCell(firstRound, headerMap, "format");
        const teamA = getScheduleCell(firstRound, headerMap, "team_a");
        const teamB = getScheduleCell(firstRound, headerMap, "team_b");
        const courseImageColumn = headerMap.get("img");
        const courseImage = courseImageColumn === undefined
            ? (firstRound[5] || "").trim()
            : getScheduleCell(firstRound, headerMap, "img");
        if (!course || !date || !format) {
            throw new Error("The first schedule row must include a date, course, and format.");
        }

        nextCourse.textContent = course;
        nextDate.textContent = date;
        nextFormat.textContent = format;
        const courseImageSource = window.getImageSource(courseImage, "images/courses", "");
        courseBackground.hidden = !courseImageSource;
        if (courseImageSource) {
            courseBackground.addEventListener("error", () => {
                courseBackground.hidden = true;
            }, { once: true });
            courseBackground.src = courseImageSource;
        } else {
            courseBackground.removeAttribute("src");
        }

        if (teamA && teamB) {
            renderTeam(nextTeamA, teamA);
            renderTeam(nextTeamB, teamB);
            nextTeams.hidden = false;
        }
    } catch (error) {
        console.error("Unable to load the next round from the published Google Sheet.", error);
        nextCourse.textContent = "Unavailable";
        nextDate.textContent = "—";
        nextFormat.textContent = "—";
        nextTeams.hidden = true;
        nextRoundStatus.textContent = "Next round details couldn’t be loaded. Please check the published schedule tab.";
        nextRoundStatus.classList.add("isError");
        nextRoundStatus.hidden = false;
    }
}

loadCurrentLeader();
loadNextRound();
