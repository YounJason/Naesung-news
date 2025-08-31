const load_articles = async () => {
    const res = await fetch(`/data/articles.json`);
    const articles = await res.json();
    return articles;
};

let ARTICLES = [];
load_articles().then(data => {
    ARTICLES = data;
    init();
});

const cardHTML = ({ title, desc, img, date, slug, author}) => `
    <article class="card" onclick="location.href='v/${slug}'" style="cursor: pointer;">
        ${img ? `<img class="thumb" alt="" src="${img}">` : ""}
        <div class="content" role="group" aria-label="${title}">
            <h2 class="title">${title}</h2>
            <p class="desc">${desc}</p>
            <div class="meta">${date} · ${author} 기자</div>
        </div>
    </article>
`;


function init() {
    const grid = document.querySelector(".news-grid");
    grid.innerHTML += ARTICLES.map(cardHTML).join("");
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