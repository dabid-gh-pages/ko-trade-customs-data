//  Define Major Elements

const wrapper = document.querySelector(".wrapper"),
  inputPart = document.querySelector(".input-part"),
  infoTxt = inputPart.querySelector(".info-txt"),
  inputField = inputPart.querySelector("input"),
  weatherPart = wrapper.querySelector(".weather-part"),
  arrowBack = wrapper.querySelector("header i");

let api;

// define inputText -> make these required  text with the required functionality
const hsCodeTag = document.querySelector(".hs-code"),
  startDateTag = document.querySelector(".start-date"),
  endDateTag = inputPart.querySelector(".end-date");

// define select tag
const selectTag = document.querySelector("select.export-type");
types = ["export", "import"];
types.forEach((type) => {
  let selected = type === 2022 ? "selected" : "";
  let option = `<option ${selected} value="${type}">${type}</option>`;
  selectTag.insertAdjacentHTML("beforeend", option);
});

// define button
const searchBtn = document.querySelector("button");

searchBtn.addEventListener("click", () => {
  // check validity and fires the event only when all valid
  const allValid = [hsCodeTag, startDateTag, endDateTag].every((input) =>
    input.reportValidity()
  );
  if (allValid) {
    console.log("all the elements are  valid");
    console.log(
      getData(
        hsCodeTag.value,
        startDateTag.value,
        endDateTag.value,
        selectTag.value
      )
    );
  } else {
    console.log("something is not valid");
    return;
  }
});

/**
 *
 * @param {string} hsCode hs code in 10 digit format
 * @param {string} startDate year/month in 6 digit (YYYYMM) format
 * @param {string} endDate year/month in 6 digit (YYYYMM) format
 * @param {string} tradeType trade type (enum:either export or import)
 */
function getData(hsCode, startDate, endDate, tradeType = "export") {
  url = `https://unipass.customs.go.kr/ets/hmpg/retrievePrlstPrCntyPrImexAcrsLst.do?priodKind=MON&priodFr=${startDate}+&priodTo=${endDate}+&hsSgnGrpCol=HS10_SGN&hsSgnWhrCol=HS10_SGN&hsSgn=${hsCode}&ttwgTpcd=1000&langTpcd=KOR`;
  console.log(url);
  let corsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  infoTxt.innerText = "Getting trade data...";
  infoTxt.classList.add("pending");
  fetch(corsUrl)
    .then((res) => res.json())
    .then((data) => data["contents"])
    .then((result) => parseImportData(result))
    .then((parsedResult) => console.log(parsedResult))
    .catch(() => {
      infoTxt.innerText = "Something went wrong";
      infoTxt.classList.replace("pending", "error");
    });
}

function onSuccess(position) {
  const { latitude, longitude } = position.coords;
  api = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=your_api_key`;
  fetchData();
}

function onError(error) {
  infoTxt.innerText = error.message;
  infoTxt.classList.add("error");
}

//parsefunction : input is json, output is parsed array of data
function parseImportData(data) {
  var result = JSON.parse(data)["items"].slice(1);
  console.log(result);
  var processed = result
    .map((row) => ({
      date: parseDate(row["priodTitle"]),
      englPrlstNm: row["englPrlstNm"],
      hsCode: row["hsSgn"],
      cnty: row["cntyEnglNm"],
      ttwg: parseFloat(row["impTtwg"].replace(/(\s|,)+/g, "")),
      usdAmt: parseFloat(row["impUsdAmt"].replace(/(\s|,)+/g, "")) * 1000,
    }))
    .filter((row) => row.ttwg !== 0) //0인건 다 지우기
    .map((row) => ({
      ...row,
      price: parseFloat((row.usdAmt / row.ttwg).toFixed(2)),
    })); //2자리로 나눈 후, 다시 숫자로 변환
  return processed;
}

arrowBack.addEventListener("click", () => {
  wrapper.classList.remove("active");
});

// helper functions
// 2020.02 => 2020-02-01
function parseDate(dateString) {
  let processedDate = dateString.replace(/(\d{4})(\.)(\d{2})/g, "$1-$3-01");
  return processedDate;
}

function renderChart(id) {
  var options = {
    chart: {
      type: "bar",
    },
    series: [
      {
        name: "sales",
        data: [30, 40, 45, 50, 49, 60, 70, 91, 125],
      },
    ],
    xaxis: {
      categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
    },
  };
  console.log("#" + id);
  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderAll() {
  renderChart("chart1");
  renderChart("chart2");
  renderChart("chart3");
  renderChart("chart4");
}

renderAll();
