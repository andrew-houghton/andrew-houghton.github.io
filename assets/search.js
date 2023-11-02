let selectedState = "all";
let selectedSearch = "";
let selectedGauge = null;

function selectGauge(key) {
  selectedGauge = key;
  document.getElementById("gauge-search").style.display = "none";
  document.getElementById("gauge-display").style.display = "block";
  document.getElementById("selected-gauge-text").textContent =
    gaugeData[selectedGauge].name;
  updateRequestText();
}

function deselectGauge() {
  selectedGauge = null;
  document.getElementById("gauge-search").style.display = "block";
  document.getElementById("gauge-display").style.display = "none";
  updateRequestText();
}

function stateFilterSelected(radio) {
  selectedState = radio.value;
  showGauges();
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

function updateSearchString() {
  selectedSearch = document.getElementById("search-text").value;
  showGauges();
}

function updateLocationString() {
  updateRequestText();
}

const searchChange = debounce(() => updateSearchString());
const locationChange = debounce(() => updateLocationString());

function publishLocation(position) {
  var latLonInput = document.getElementById("lat-lon-input");
  latLonInput.value = `${position.coords.latitude.toFixed(
    4,
  )},${position.coords.longitude.toFixed(4)}`;
  document.getElementById("lat-lon-input-label").style.display = "none";
  updateRequestText();
}
function loadLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(publishLocation);
  }
}

function copyText() {
  var requestTextDisplay = document.getElementById("request-text");
  navigator.clipboard.writeText(requestTextDisplay.textContent.trim());
}

function updateRequestText() {
  var locationText = document.getElementById("lat-lon-input").value.trim();
  var plaintextReply = document.getElementById("plaintext-reply").checked;

  var requestTextDisplay = document.getElementById("request-text");
  requestTextDisplay.textContent = `gauge:${
    selectedGauge || "NO GAUGE"
  } location:${locationText || "NO LOCATION"} client:1${
    plaintextReply ? " text" : ""
  }`;

  var valid = true;
  var statusChipContainer = document.getElementById("error-chip");
  statusChipContainer.innerHTML = "";
  var errors = document.getElementById("errors");
  errors.innerHTML = "";

  if (!selectedGauge) {
    valid = false;
    var p = document.createElement("p");
    p.textContent = `Gauge must be selected.`;
    errors.appendChild(p);
  }
  if (!locationText) {
    valid = false;
    var p = document.createElement("p");
    p.textContent = `Location must be set to 'lat,lon'.`;
    errors.appendChild(p);
  } else if (!/^-?[0-9.]+,-?[0-9.]+$/.test(locationText)) {
    valid = false;
    var p = document.createElement("p");
    p.textContent = `Location: '${locationText}' must match format '-23.1236,123.1245'`;
    errors.appendChild(p);
  }

  var chip = document.createElement("span");
  chip.classList.add("mdl-chip");
  var chipText = document.createElement("span");
  chipText.classList.add("mdl-chip__text");
  var copyButton = document.getElementById("copy-button");
  if (valid) {
    chipText.textContent = "Ready to send";
    chip.style.background = "#D2F8D2";
    copyButton.disabled = false;
  } else {
    chipText.textContent = "Invalid";
    chip.style.background = "#FFDDDB";
    copyButton.disabled = true;
  }
  chip.appendChild(chipText);
  statusChipContainer.appendChild(chip);
}

function showGauges() {
  var gaugeGrid = document.getElementById("gauge-grid");
  gaugeGrid.innerHTML = "";
  var gaugeList = Object.entries(gaugeData);

  // Sort
  gaugeList.sort((a, b) => a[1].name.localeCompare(b[1].name));

  // State filter
  if (selectedState != "all") {
    gaugeList = gaugeList.filter((g) => g[1].state == selectedState);
  }

  // Search filter
  if (selectedSearch != "") {
    var ss = selectedSearch.toLowerCase(); // case insensitive search

    gaugeList = gaugeList.filter(
      (g) =>
        g[0] == selectedSearch ||
        g[1].name.toLowerCase().includes(ss) ||
        g[1].data_source.toLowerCase().includes(ss) ||
        g[1].sections_strings.some((s) => s.toLowerCase().includes(ss)),
    );
  }

  // Handle empty results
  var gaugeCount = gaugeList.length;
  if (gaugeCount == 0) {
    var end_message = document.createElement("p");
    end_message.textContent = `No gauges.`;
    gaugeGrid.appendChild(end_message);
  }

  // Display items
  for (const [key, value] of gaugeList) {
    var item = document.createElement("div");
    item.classList.add("mdl-cell");
    item.classList.add("mdl-cell--3-col");

    var a = document.createElement("a");
    a.textContent = value.name;
    a.style.textWrap = "nowrap";
    a.style.textOverflow = "ellipsis";
    a.style.display = "block";
    a.style.overflow = "hidden";
    a.style.color = "blue";
    a.style.textDecoration = "underline";
    a.onclick = () => selectGauge(key);

    item.appendChild(a);
    gaugeGrid.appendChild(item);

    // Handle overflow
    if (gaugeGrid.childElementCount >= 20 && gaugeCount > 20) {
      var end_message = document.createElement("p");
      end_message.style.margin = "8px";
      end_message.textContent = `And ${gaugeCount - 20} other gauges`;
      gaugeGrid.appendChild(end_message);
      break;
    }
  }
}

function setupGauges() {
  // Show all gauges to begin with
  showGauges(gaugeData);
}
