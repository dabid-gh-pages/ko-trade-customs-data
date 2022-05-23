// helper functions

/**
 *
 * @param {*} data array of objects
 * @param {*} key the key that you are going to group by (if key is date : group by same dates)
 * @param {*} valueKey : the valuekey that we will add
 * @returns
 */
const groupSumBy = (data, key, valueKey) =>
  data
    .sort((a, b) => a[key].localeCompare(b[key]))
    .reduce((total, currentValue) => {
      const newTotal = total;
      if (total.length && total[total.length - 1][key] === currentValue[key])
        newTotal[total.length - 1] = {
          ...total[total.length - 1],
          ...currentValue,
          [valueKey]:
            parseFloat(total[total.length - 1][valueKey]) +
            parseFloat(currentValue[valueKey]),
        };
      else newTotal[total.length] = currentValue;
      return newTotal;
    }, []);

/**
 *
 * @param {*} data array of objects
 * @param {*} key the key that you are going to group by (if key is date : group by same dates)
 * @param {*} valueKey1 the valuekey that we will add
 * @param {*} valueKey2
 * @returns
 */
const groupSumByTwo = (data, key, valueKey1, valueKey2) =>
  data
    .sort((a, b) => a[key].localeCompare(b[key]))
    .reduce((total, currentValue) => {
      const newTotal = total;
      if (total.length && total[total.length - 1][key] === currentValue[key])
        newTotal[total.length - 1] = {
          ...total[total.length - 1],
          ...currentValue,
          [valueKey1]:
            parseFloat(total[total.length - 1][valueKey1]) +
            parseFloat(currentValue[valueKey1]),
          [valueKey2]:
            parseFloat(total[total.length - 1][valueKey2]) +
            parseFloat(currentValue[valueKey2]),
        };
      else newTotal[total.length] = currentValue;
      return newTotal;
    }, []);

// define granularity of other :
// if 0.01 : 1% 미만인 것은 다 other로
// if 0.005 : 0.5% 미만인 것은 다 other로
/**
 *
 * @param {array} data
 * @param {float} granularity  defines how precise 'other' would be : if the number is higher, more items will be defined as 'other'
 * @returns
 */
function toOthered(data, granularity) {
  // the logic :
  // 1) get the total amount
  // if the total usd amount of a country is below 1% of the total amount of the dataset, this country becomes other

  //helpers
  var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };
  let totalAmt = data.map((item) => item.usdAmt).reduce((a, b) => a + b, 0);

  let dateArray = [...new Set(data.map((item) => item.date))];
  let groupedData = groupBy(data, "cnty"); // this is a object with each country as key

  let countries = [];
  let toOtheredCountries = [];
  //iterate through each countries
  Object.entries(groupedData).forEach(([country, inputArr]) => {
    let newData = dateArray.map((item) => {
      return (
        inputArr.find((inputItem) => inputItem.date == item) || { usdAmt: 0 }
      ).usdAmt;
    });

    let dataObject = {
      name: country,
      sum: newData.reduce((a, b) => a + b, 0),
    };
    countries.push(dataObject);
  });
  // get the list of countries that should be  turned to other
  countries.forEach((country) => {
    if (country.sum < totalAmt * granularity) {
      toOtheredCountries.push(country.name);
    }
  });
  const otheredData = data.map((item) => {
    if (toOtheredCountries.includes(item.cnty)) {
      return { ...item, cnty: "other" };
    } else {
      return item;
    }
  });

  return otheredData;
}

// main functions for data preprocessing / turning into charts

// processing function for monthly quantity column chart ()
function getMonthlyTotalQty(data) {
  summedData = groupSumBy(data, "date", "ttwg").map((item) => ({
    x: item.date,
    y: item.ttwg,
  }));
  return summedData;
}

// processing function for yearly quantity column chart ()
function getYearlyTotalQty(data) {
  withYearData = data.map((item) => ({ ...item, year: item.date.slice(0, 4) }));
  summedData = groupSumBy(withYearData, "year", "ttwg").map((item) => ({
    x: item.date,
    y: item.ttwg,
  }));
  return summedData;
}

// processing function for monthly price line chart ()
function getMonthlyTotalPrice(data) {
  summedData = groupSumByTwo(data, "date", "ttwg", "usdAmt").map((item) => ({
    x: item.date,
    y: parseFloat((item.usdAmt / item.ttwg).toFixed(2)),
  }));
  return summedData;
}

// processing function for monthly price line chart ()
function getYearlyTotalPrice(data) {
  withYearData = data.map((item) => ({ ...item, year: item.date.slice(0, 4) }));
  summedData = groupSumByTwo(withYearData, "year", "ttwg", "usdAmt").map(
    (item) => ({
      x: item.date,
      y: parseFloat((item.usdAmt / item.ttwg).toFixed(2)),
    })
  );
  return summedData;
}

// data preparation for quantity stack 100% chart (by each country)
function getCountryQuantitySeries(data) {
  OtheredData = toOthered(data, 0.01);
  //helpers
  var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  let dateArray = [...new Set(data.map((item) => item.date))];
  let groupedData = groupBy(OtheredData, "cnty"); // this is a object with each country as key

  let series = [];
  //iterate through each countries
  Object.entries(groupedData).forEach(([country, inputArr]) => {
    let newData = dateArray.map((item) => {
      return (
        inputArr.find((inputItem) => inputItem.date == item) || { ttwg: 0 }
      ).ttwg;
    });

    let dataObject = {
      name: country,
      data: newData,
    };
    series.push(dataObject);
  });

  orderedSeries = series.sort(
    (c1, c2) =>
      c2.data.reduce((a, b) => a + b, 0) - c1.data.reduce((a, b) => a + b, 0)
  );

  return { dates: dateArray, series: series };
}

// data preparation for quantity stack 100% chart (by each country)
function getCountryPriceSeries(data) {
  OtheredData = toOthered(data, 0.01);
  //helpers
  var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  let dateArray = [...new Set(OtheredData.map((item) => item.date))];
  let groupedData = groupBy(OtheredData, "cnty"); // this is a object with each country as key

  let series = [];
  //iterate through each countries
  Object.entries(groupedData).forEach(([country, inputArr]) => {
    let newData = dateArray.map((item) => {
      const usdAmt = (
        inputArr.find((inputItem) => inputItem.date == item) || { usdAmt: 0 }
      ).usdAmt;
      const ttwg = (
        inputArr.find((inputItem) => inputItem.date == item) || { ttwg: 0 }
      ).ttwg;
      return parseFloat((usdAmt / ttwg).toFixed(2));
    });

    let dataObject = {
      name: country,
      data: newData,
    };
    series.push(dataObject);
  });
  // remove others in price
  series = series.filter((item) => item.name != "other");
  return { dates: dateArray, series: series };
}

// horizontal bar chart that displays accumulated quantity for each country
// {x:vietnam, y:232323}
function getCountryTotalQty(data) {
  OtheredData = toOthered(data, 0.005);
  var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  let groupedData = groupBy(OtheredData, "cnty"); // this is a object with each country as key
  return Object.entries(groupedData)
    .map((country) => ({
      x: country[0],
      y: country[1].map((item) => item.ttwg).reduce((a, b) => a + b, 0),
    }))
    .sort((c1, c2) => c2.y - c1.y); // add custom sort function so that greatest goes on top
}

/// now goes the rendering part
// 01 getMonthlyTotalQty -> renderMonthlyTotalQty (data,id)  // bar chart
// 02 getYearlyTotalQty -> renderYearlyTotalQty (data,id)  // bar chart
// 03 getMonthlyTotalPrice -> renderMonthlyTotalPrice (data,id)  // line chart
// 04 getYearlyTotalPrice > renderYearlyTotalPrice (data,id)  // line chart
// 05 getCountryQuantitySeries -> renderCountryQuantitySeries (data,id)  // 100% stacked
// 06 getCountryPriceSeries  -> renderCountryPriceSeries (data,id)  // 100% line
// 07 getCountryTotalQty(data) -> renderCountryTotalQty (data,id)  // horizontal bar

function renderMonthlyTotalQty(data, id) {
  const chartData = getMonthlyTotalQty(data);

  var options = {
    theme: {
      mode: "light",
      palette: "palette3",
      monochrome: {
        enabled: true,
        color: "#999999",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },
    chart: {
      type: "bar",
      columnWidth: "70%",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "80%",
      },
    },
    dataLabels: {
      enabled: false,
    },

    series: [
      {
        name: "Monthly Quantity",
        data: chartData,
      },
    ],
    xaxis: {
      type: "datetime",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderYearlyTotalQty(data, id) {
  const chartData = getYearlyTotalQty(data);

  var options = {
    theme: {
      mode: "light",
      palette: "palette3",
      monochrome: {
        enabled: true,
        color: "#999999",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },
    chart: {
      type: "bar",
      columnWidth: "70%",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "80%",
      },
    },
    dataLabels: {
      enabled: false,
    },

    series: [
      {
        name: "Yearly Quantity",
        data: chartData,
      },
    ],
    xaxis: {
      // type: "datetime",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderMonthlyTotalPrice(data, id) {
  const chartData = getMonthlyTotalPrice(data);

  var options = {
    theme: {
      mode: "light",
      palette: "palette3",
      monochrome: {
        enabled: true,
        color: "#999999",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },
    chart: {
      type: "line",
      // columnWidth: "70%",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "80%",
      },
    },
    dataLabels: {
      enabled: false,
    },

    series: [
      {
        name: "Average Price ($/MT)",
        data: chartData,
      },
    ],
    xaxis: {
      type: "datetime",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderYearlyTotalPrice(data, id) {
  const chartData = getYearlyTotalPrice(data);

  var options = {
    theme: {
      mode: "light",
      palette: "palette3",
      monochrome: {
        enabled: true,
        color: "#999999",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },
    chart: {
      type: "line",
      // columnWidth: "70%",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "80%",
      },
    },
    dataLabels: {
      enabled: false,
    },

    series: [
      {
        name: "Average Price ($/MT)",
        data: chartData,
      },
    ],
    xaxis: {
      // type: "datetime",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderCountryQuantitySeries(data, id) {
  const { dates, series } = getCountryQuantitySeries(data);
  console.log(dates);
  console.log(series);
  var options = {
    // theme: {
    //   mode: "light",
    //   palette: "palette1",
    //   monochrome: {
    //     // enabled: true,
    //     color: "#999999",
    //     shadeTo: "light",
    //     shadeIntensity: 0.95,
    //   },
    // },
    chart: {
      type: "bar",
      columnWidth: "70%",
      stacked: true,
      stackType: "100%",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "80%",
      },
    },
    // dataLabels: {
    //   enabled: false,
    // },

    series: series,
    xaxis: {
      type: "datetime",
      categories: dates,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderCountryPriceSeries(data, id) {
  const { dates, series } = getCountryPriceSeries(data);
  console.log(series);
  var options = {
    // theme: {
    //   mode: "light",
    //   palette: "palette1",
    //   monochrome: {
    //     // enabled: true,
    //     color: "#999999",
    //     shadeTo: "light",
    //     shadeIntensity: 0.95,
    //   },
    // },
    chart: {
      type: "line",
    },
    stroke: {
      // show: true,
      curve: "straight",
      lineCap: "butt",
      // colors: undefined,
      width: 2,
      // dashArray: 0,
    },
    // dataLabels: {
    //   enabled: false,
    // },

    series: series,
    xaxis: {
      type: "datetime",
      categories: dates,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}

function renderCountryTotalQty(data, id) {
  const chartData = getCountryTotalQty(data);
  console.log(chartData);

  var options = {
    theme: {
      mode: "light",
      palette: "palette3",
      monochrome: {
        enabled: true,
        color: "#999999",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },
    chart: {
      type: "bar",
      columnWidth: "70%",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        horizontal: true,
        columnWidth: "80%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          console.log(val);
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },

    series: [
      {
        name: "Quantity",
        data: chartData,
      },
    ],
    yaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    xaxis: {
      // return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      labels: {
        formatter: function (val) {
          console.log(val);
          return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          // override the val here
        },
      },
    },
  };

  var chart = new ApexCharts(document.querySelector("#" + id), options);

  chart.render();
}
