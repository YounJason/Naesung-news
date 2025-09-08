function timeAgo(isoString) {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now - past; // 밀리초 차이
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30); // 대략 30일을 1개월로 가정
  const diffYear = Math.floor(diffDay / 365); // 대략 365일을 1년으로 가정

  if (diffSec < 60) {
    return `${diffSec}초 전`;
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 30) {
    return `${diffDay}일 전`;
  } else if (diffMonth < 12) {
    return `${diffMonth}개월 전`;
  } else {
    return `${diffYear}년 전`;
  }
}

const load_articles = async () => {
    const res = await fetch(`/data/articles.json`);
    const articles = await res.json();
    return articles;
};

const load_sports = async () => {
    const res = await fetch(`/data/sports.json`);
    const articles = await res.json();
    return articles;
};

let ARTICLES = [];
load_articles().then(data => {
    ARTICLES = data;
    init();
});

let SPORTS_ARTICLES = [];
load_sports().then(data => {
    SPORTS_ARTICLES = data;
    initSports();
});

const cardHTML = ({ title, desc, img, committedAt, slug, author }) => `
    <article class="card" onclick="location.href='https://naesung-news.netlify.app/v/${slug}'" style="cursor: pointer;">
        ${img ? `<img class="thumb" alt="" src="${img}">` : ""}
        <div class="content" role="group" aria-label="${title}">
            <h2 class="title">${title}</h2>
            <p class="desc">${desc}</p>
            <div class="meta">${author} 기자 · ${timeAgo(committedAt)}</div>
        </div>
    </article>
`;

const sports_cardHTML = ({ title, desc, img, committedAt, slug, author, score}) => `
    <article class="card" onclick="location.href='https://naesung-news.netlify.app/s/${slug}'" style="cursor: pointer;">
        ${score ? `<div class="thumb">${img}</div>` : ""}
        <div class="content" role="group" aria-label="${title}">
            <h2 class="title">${title}</h2>
            <p class="desc">${desc}</p>
            <div class="meta">${author} 기자 · ${timeAgo(committedAt)}</div>
        </div>
    </article>
`;

function init() {
    const grid = document.querySelector(".news-grid");
    grid.innerHTML += ARTICLES.map(cardHTML).join("");
}

function initSports() {
    const sportsGrid = document.querySelector(".sports-grid");
    sportsGrid.innerHTML += SPORTS_ARTICLES.map(sports_cardHTML).join("");
}

window.addEventListener("DOMContentLoaded", init);

const load_meal = async () => {
    const today = new Date();
    let formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=C10&SD_SCHUL_CODE=7150094&type=JSON&MLSV_YMD=${formattedDate}`);
    const data = await res.json();
    if (data.mealServiceDietInfo == undefined){
        document.querySelector("#lunch").innerHTML = '오늘은 급식이 제공되지 않습니다.';
        document.querySelector("#dinner").innerHTML = '오늘은 급식이 제공되지 않습니다.';
    } else {
        if (data.mealServiceDietInfo[1].row[0] == undefined)
            document.querySelector("#lunch").innerHTML = '오늘은 중식이 제공되지 않습니다.';
        else
            document.querySelector("#lunch").innerHTML = data.mealServiceDietInfo[1].row[0].DDISH_NM;
        if (data.mealServiceDietInfo[1].row[1] == undefined)
            document.querySelector("#dinner").innerHTML = '오늘은 석식이 제공되지 않습니다.';
        else
            document.querySelector("#dinner").innerHTML = data.mealServiceDietInfo[1].row[1].DDISH_NM;
    }
};



load_meal();

let sports = false;

document.querySelector("#sports").addEventListener("click", () => {
    sports = !sports;
    if (sports) {
        document.querySelector("header").classList.add("sports");
        document.querySelector("#sports").classList.add("sports");
        document.querySelector(".news-grid").classList.add("disabled");
        document.querySelector(".sports-grid").classList.remove("disabled");
    } else {
        document.querySelector("header").classList.remove("sports");
        document.querySelector("#sports").classList.remove("sports");
        document.querySelector(".sports-grid").classList.add("disabled");
        document.querySelector(".news-grid").classList.remove("disabled");
    }

});
