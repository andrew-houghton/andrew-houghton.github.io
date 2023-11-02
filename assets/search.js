let selectedState = 'all';
let selectedSearch = '';
let selectedGauge = null;

function selectGauge(key) {
  selectedGauge = key;
  document.getElementById("gauge-search").style.display = "none";
  document.getElementById("gauge-display").style.display = "block";
  document.getElementById("selected-gauge-text").textContent = gaugeData[selectedGauge].name;

}
function deselectGauge() {
  selectedGauge = null;
  document.getElementById("gauge-search").style.display = "block";
  document.getElementById("gauge-display").style.display = "none";
}

function stateFilterSelected(radio) {
  selectedState = radio.value
  showGauges();
}

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function updateSearchString(){
  selectedSearch = document.getElementById("search-text").value;
  showGauges();
}

const searchChange = debounce(() => updateSearchString());

function publishLocation(position) {
  var latLonInput = document.getElementById("lat-lon-input");
  latLonInput.value = `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`;
  document.getElementById("lat-lon-input-label").style.display = "none";
}
function loadLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(publishLocation);
  }
}

function showGauges() {
  var gaugeGrid = document.getElementById("gauge-grid");
  gaugeGrid.innerHTML = '';
  var gaugeList = Object.entries(gaugeData);

  // Sort
  gaugeList.sort((a,b) => a[1].name.localeCompare(b[1].name))

  // State filter
  if (selectedState != 'all') {
    gaugeList = gaugeList.filter((g) => g[1].state == selectedState)
  }

  // Search filter
  if (selectedSearch != '') {
    var ss = selectedSearch.toLowerCase();  // case insensitive search

    gaugeList = gaugeList.filter((g) => (
      g[0] == selectedSearch ||
      g[1].name.toLowerCase().includes(ss) ||
      g[1].data_source.toLowerCase().includes(ss) ||
      g[1].sections_strings.some((s) => s.toLowerCase().includes(ss))
    ));
  }

  // Handle empty results
  var gaugeCount = gaugeList.length;
  if (gaugeCount == 0) {
    var end_message = document.createElement('p');
    end_message.textContent = `No gauges.`
    gaugeGrid.appendChild(end_message);
  }

  // Display items
  for (const [key, value] of gaugeList) {
    var item = document.createElement('div');
    item.classList.add("mdl-cell");
    item.classList.add("mdl-cell--3-col");

    var a = document.createElement('a');
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
      var end_message = document.createElement('p');
      end_message.style.margin = "8px";
      end_message.textContent = `And ${gaugeCount-20} other gauges`;
      gaugeGrid.appendChild(end_message);
      break;
    }
  }

}

function setupGauges() {
  // Show all gauges to begin with
  showGauges(gaugeData);
}