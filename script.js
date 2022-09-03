//  Define Major Elements

const wrapper = document.querySelector(".wrapper"),
  inputPart = document.querySelector(".input-part"),
  inputField = inputPart.querySelector("input"),
  weatherPart = wrapper.querySelector(".weather-part"),
  arrowBack = wrapper.querySelector("header i");

let api;

let globalScopeData;

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

    // toggle on all card elements
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      card.classList.toggle("show");
    });

    loadCharts(
      hsCodeTag.value,
      startDateTag.value,
      endDateTag.value,
      selectTag.value
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
function loadCharts(hsCode, startDate, endDate, tradeType = "export") {
  url = `https://unipass.customs.go.kr/ets/hmpg/retrievePrlstPrCntyPrImexAcrsLst.do?priodKind=MON&priodFr=${startDate}+&priodTo=${endDate}+&hsSgnGrpCol=HS10_SGN&hsSgnWhrCol=HS10_SGN&hsSgn=${hsCode}&ttwgTpcd=1000&langTpcd=KOR`;
  console.log(url);
  let corsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  fetch(corsUrl)
    .then((res) => res.json())
    .then((data) => data["contents"])
    .then((result) => parseImportData(result))
    .then((parsedResult) => renderCharts(parsedResult))
    .catch(() => {});
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
  // insert the data in the global scope
  globalScopeData = processed;
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

function renderCharts(data) {
  renderMonthlyTotalQty(data, "chart1");
  renderYearlyTotalQty(data, "chart2");
  renderMonthlyTotalPrice(data, "chart3");
  renderYearlyTotalPrice(data, "chart4");
  renderCountryQuantitySeries(data, "chart5");
  renderCountryPriceSeries(data, "chart6");
  renderCountryTotalQty(data, "chart7");
}
