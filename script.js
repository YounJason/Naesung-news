const ARTICLES = [
    {
        title: `오늘의 급식 정보`,
        desc: `중식<br />잡곡밥(내성고) (5)<br/>꽃게된장찌개(내성고) (5.6.8.9)<br/>돈수육(내성고) (5.6.10.13)<br/>실곤약야채무침(내성고) (5.6.13)<br/>쌈채소&쌈장(내성고) (5.6.13)<br/>배추김치(내성고) (9)<br/>파프리카된장무침(내성고) (5.6.13)<br/>스테비아토마토(내성고) (12)<br/><br/>석식<br/>잡곡밥(내성고) (5)<br/>프렌치토스트(내성고) (1.2.5.6.13)<br/>육개장(내성고) (1.16)<br/>아삭오이고추된장무침(내성고) (5.6.13)<br/>감자채볶음(내성고) (5)<br/>매콤닭불구이(내성고) (2.5.6.10.12.15.16)<br/>배추김치(내성고) (9)`,
        time: `2025-09-01`
    },
    {
        title: `"새로운 내성고, 제가 만들겠습니다." 최근 화제인 '이것'...`,
        desc: `최근 내성고등학교에서 '이것'이 화제가 되고 있다. 새로운 내성고를 만들겠다며...`,
        img: `/image/news1.png`,
        time: `2025-08-30`
    },
    {
        title: `"이제 못하겠다" 자퇴한 1학년, 선생님 잘못은 없는가?`,
        desc: `최근 내성고등학교에서 한 1학년 학생이 자퇴한 이유가 밝혀져 큰 충격을 주고 있다. 그는 이전부터...`,
        img: `/image/news2.png`,
        time: `2025-08-30`
    },
    {
        title: ``,
        desc: ``,
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAPPApzuE7YuN4qCqiGq7zp4TU_kniWSmefg&s`,
        time: ``
    },
    {
        title: ``,
        desc: ``,
        img: `https://image.news1.kr/system/photos/2020/5/31/4218080/high.jpg`,
        time: ``
    },
    {
        title: ``,
        desc: ``,
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5-qIfKhvk5IOEbyRisYIRCbo_BW7exbBJNw&s`,
        time: ``
    }
]

const cardHTML = ({ title, desc, img, time }) => `
    <article class="card">
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
    grid.innerHTML = ARTICLES.map(cardHTML).join("");
}

window.addEventListener("DOMContentLoaded", init);

const meal = async () => {
    const today = new Date();
    let formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    formattedDate = 20250901
    const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=C10&SD_SCHUL_CODE=7150094&type=JSON&MLSV_YMD=${formattedDate}`);
    const data = await res.json();
    if (data.mealServiceDietInfo == undefined)
        console.log('오늘은 급식이 제공되지 않습니다.');
    else {
        console.log(data.mealServiceDietInfo[1].row[0].DDISH_NM);
        if (data.mealServiceDietInfo[1].row[1] == undefined)
            console.log('오늘은 석식이 제공되지 않습니다.');
        else
            console.log(data.mealServiceDietInfo[1].row[1].DDISH_NM);
    }
};

meal();