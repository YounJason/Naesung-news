const ARTICLES = [
    {
        title: `"새로운 내성고, 제가 만들겠습니다." 최근 화제인 '이것'...`,
        desc: `최근 내성고등학교에서 '이것'이 화제가 되고 있다. 새로운 내성고를 만들겠다며...`,
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJ1ylt4xCS9U6eQSBNnq2pVhYcgpSvSXDvOg&s`,
        time: `2025-08-30`,
        url: `/`
    },
    {
        title: `"이제 못하겠다" 자퇴한 1학년, 선생님 잘못은 없는가?`,
        desc: `최근 내성고등학교에서 한 1학년 학생이 자퇴한 이유가 밝혀져 큰 충격을 주고 있다. 그는 이전부터...`,
        img: `https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTsNl5MBMp-QRUW7e4G4Zy1O6FEw7AjTW-6VDNMH_k4WhNIsw1W`,
        time: `2025-08-30`,
        url: `/`
    },
    {
        title: ``,
        desc: ``,
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAPPApzuE7YuN4qCqiGq7zp4TU_kniWSmefg&s`,
        time: ``,
        url: `/`
    },
    {
        title: ``,
        desc: ``,
        img: `https://image.news1.kr/system/photos/2020/5/31/4218080/high.jpg`,
        time: ``,
        url: `/`
    },
    {
        title: ``,
        desc: ``,
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5-qIfKhvk5IOEbyRisYIRCbo_BW7exbBJNw&s`,
        time: ``,
        url: `/`
    }
]

const cardHTML = ({ title, desc, img, time, url}) => `
    <article class="card" onclick="location.href='${url}'" style="cursor: pointer;">
        ${img ? `<img class="thumb" alt="" src="${img}">` : ""}
        <div class="content" role="group" aria-label="${title}">
            <h2 class="title">${title}</h2>
            <p class="desc">${desc}</p>
            <div class="meta">${time}</div>
        </div>
    </article>
`;

function init() {
    const grid = document.querySelector(".news-grid");
    grid.innerHTML += ARTICLES.map(cardHTML).join("");
}

window.addEventListener("DOMContentLoaded", init);

const meal = async () => {
    const today = new Date();
    let formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    formattedDate = 20250901
    const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=C10&SD_SCHUL_CODE=7150094&type=JSON&MLSV_YMD=${formattedDate}`);
    const data = await res.json();
    if (data.mealServiceDietInfo == undefined)
        document.querySelector("#lunch").innerHTML = '오늘은 급식이 제공되지 않습니다.';
    else {
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

meal();