function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function extractNum(data, numBytes) {
  data.ptr += numBytes;
  var selectedBytes = data.bytes.slice(data.ptr - numBytes, data.ptr);

  var val;
  if (numBytes == 1) {
    var val = new Uint8Array(selectedBytes)[0];
  } else if (numBytes == 2) {
    var val = new Uint16Array(selectedBytes)[0];
  } else {
    var val = new Uint32Array(selectedBytes)[0];
  }
  if (val == 2 ** (numBytes * 8) - 1) return null;
  return val;
}

function roundTwoDp(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

var symbolLookup = [
  ["01d.svg", "clear sky"],
  ["02d.svg", "fair"],
  ["03d.svg", "partly cloudy"],
  ["04.svg", "cloudy"],
  ["05d.svg", "rain showers"],
  ["06d.svg", "rain showers and thunder"],
  ["07d.svg", "sleet showers"],
  ["08d.svg", "snow showers"],
  ["09.svg", "rain"],
  ["10.svg", "heavy rain"],
  ["11.svg", "heavy rain and thunder"],
  ["12.svg", "sleet"],
  ["13.svg", "snow"],
  ["14.svg", "snow and thunder"],
  ["15.svg", "fog"],
  ["20d.svg", "sleet showers and thunder"],
  ["21d.svg", "snow showers and thunder"],
  ["22.svg", "rain and thunder"],
  ["23.svg", "sleet and thunder"],
  ["24d.svg", "light rain showers and thunder"],
  ["25d.svg", "heavy rain showers and thunder"],
  ["26d.svg", "light sleet showers and thunder"],
  ["27d.svg", "heavy sleet showers and thunder"],
  ["28d.svg", "light snow showers and thunder"],
  ["29d.svg", "heavy snow showers and thunder"],
  ["30.svg", "light rain and thunder"],
  ["31.svg", "light sleet and thunder"],
  ["32.svg", "heavy sleet and thunder"],
  ["33.svg", "light snow and thunder"],
  ["34.svg", "heavy snow and thunder"],
  ["40d.svg", "light rain showers"],
  ["41d.svg", "heavy rain showers"],
  ["42d.svg", "light sleet showers"],
  ["43d.svg", "heavy sleet showers"],
  ["44d.svg", "light snow showers"],
  ["45d.svg", "heavy snow showers"],
  ["46.svg", "light rain"],
  ["47.svg", "light sleet"],
  ["48.svg", "heavy sleet"],
  ["49.svg", "light snow"],
  ["50.svg", "heavy snow"],
];

function decode(text) {
  // data holds a byte array and a reference to the last position read in the array
  var data = { ptr: 0, bytes: base64ToArrayBuffer(text) };
  var output = {};

  output.baseTime = dayjs.unix(extractNum(data, 4));
  output.gaugeId = extractNum(data, 2);
  var gaugeLen = extractNum(data, 1);
  var weatherLen = extractNum(data, 1);

  output.weatherItems = [];
  for (let i = 0; i < weatherLen; i++) {
    var item = {};
    item.rainfall = roundTwoDp(extractNum(data, 2) / 10);
    item.max = roundTwoDp(extractNum(data, 2) / 10 - 100);
    item.min = roundTwoDp(extractNum(data, 2) / 10 - 100);
    item.wind = roundTwoDp(extractNum(data, 2) / 10);
    var symbolRaw = extractNum(data, 1);
    item.symbolUrl = symbolRaw == 0 ? null : symbolLookup[symbolRaw][0];
    item.symbolDesc = symbolRaw == 0 ? null : symbolLookup[symbolRaw][1];
    output.weatherItems.push(item);
  }

  output.gaugeItems = [];
  for (let i = 0; i < gaugeLen; i++) {
    var item = {};
    var rainfallBytes = data.bytes.slice(data.ptr, data.ptr + 4);
    data.ptr += 4;
    item.reading = roundTwoDp(new Float32Array(rainfallBytes)[0]);
    item.readingTimeDiffMins = extractNum(data, 2);
    output.gaugeItems.push(item);
  }

  var timeSesReceivedS = extractNum(data, 4);
  output.timeSesReceived =
    timeSesReceivedS == 0 ? null : dayjs.unix(timeSesReceivedS);
  var timeInreachSentS = extractNum(data, 4);
  output.timeInreachSent =
    timeInreachSentS == 0 ? null : dayjs.unix(timeInreachSentS);
  return output;
}

const formatReading = (reading) => {
  if (reading < 1) {
    return Math.round(reading * 1000) / 1000;
  }
  if (reading < 10) {
    return Math.round(reading * 100) / 100;
  }
  return reading.toFixed(0);
};
function readingWithUnits(reading, gaugeId) {
  if (gaugeData[gaugeId].measurement_type == "flow") {
    return formatReading(reading) + " m³/s";
  } else if (gaugeData[gaugeId].measurement_type == "height") {
    return formatReading(reading) + "m";
  } else if (gaugeData[gaugeId].measurement_type == "power") {
    return formatReading(reading) + " MW";
  } else if (gaugeData[gaugeId].measurement_type == "spill") {
    if (reading > 0) {
      return formatReading(reading) + "m spill";
    }
    return formatReading(-reading) + "m from spilling";
  }
  return reading;
}

function render(output) {
  document.getElementById("parsed-data-section").style.display = "block";

  var weatherTbody = document.getElementById("weather-forecast-tbody");
  weatherTbody.innerHTML = "";
  if (output.weatherItems.length == 0) {
    weatherTbody.textContent = "No weather readings";
  } else {
    for (let i = 0; i < output.weatherItems.length; i++) {
      var tr = weatherTbody.insertRow();

      // Date
      var td = tr.insertCell();
      td.classList.add("mdl-data-table__cell--non-numeric");
      td.appendChild(
        document.createTextNode(output.baseTime.add(i, "day").format("D MMM")),
      );

      // Icon
      var td = tr.insertCell();
      td.classList.add("mdl-data-table__cell--non-numeric");
      var icon = document.createElement("img");
      icon.src = `/assets/svg/${output.weatherItems[i].symbolUrl}`;
      icon.alt = output.weatherItems[i].symbolDesc;
      icon.height = 40;
      td.appendChild(icon);

      // Max / Min
      var td = tr.insertCell();
      td.appendChild(
        document.createTextNode(
          `${output.weatherItems[i].max}° / ${output.weatherItems[i].min}°`,
        ),
      );

      // Precip
      var td = tr.insertCell();
      td.appendChild(
        document.createTextNode(`${output.weatherItems[i].rainfall} mm`),
      );

      // Wind
      var td = tr.insertCell();
      td.appendChild(
        document.createTextNode(`${output.weatherItems[i].wind} m/s`),
      );
    }
  }

  var gaugeTbody = document.getElementById("gauge-readings-tbody");
  gaugeTbody.innerHTML = "";
  if (output.gaugeItems.length == 0) {
    gaugeTbody.textContent = "No weather readings";
  } else {
    for (let i = 0; i < output.gaugeItems.length; i++) {
      var tr = gaugeTbody.insertRow();

      // Date
      var readingTime = output.baseTime.subtract(
        output.gaugeItems[i].readingTimeDiffMins,
        "minute",
      );
      var td = tr.insertCell();
      td.classList.add("mdl-data-table__cell--non-numeric");
      var dateText = document.createElement("div");
      dateText.appendChild(
        document.createTextNode(readingTime.format("D MMM h:m A")),
      );
      td.appendChild(dateText);
      var relativeText = document.createElement("div");
      relativeText.appendChild(document.createTextNode(readingTime.fromNow()));
      td.appendChild(relativeText);

      // Reading
      var td = tr.insertCell();
      td.appendChild(
        document.createTextNode(
          readingWithUnits(output.gaugeItems[i].reading, output.gaugeId),
        ),
      );
    }
  }

  // Fill text
  document.getElementById("gauge-name").textContent = `${
    gaugeData[output.gaugeId].data_source
  } - ${gaugeData[output.gaugeId].name}`;
  document.getElementById("gauge-id-debug").textContent = output.gaugeId;
  document.getElementById("time-ses-received").textContent =
    output.timeSesReceived.fromNow();
  document.getElementById("time-ses-received-abs").textContent =
    output.timeSesReceived.toString();
  document.getElementById("base-time").textContent = output.baseTime.fromNow();
  document.getElementById("base-time-abs").textContent =
    output.baseTime.toString();
  document.getElementById("time-inreach-sent").textContent =
    output.timeInreachSent.fromNow();
  document.getElementById("time-inreach-sent-abs").textContent =
    output.timeInreachSent.toString();
}

function parse(text) {
  var output = decode(text);
  render(output);
}

// uulBZRYlAgQBACwEBARFAAQIADYEAAQ0AAQVABYE4wMrACUKABME4AMdACUpXI8/VQFmZoY/XwCy4EBlu+lBZQ==
