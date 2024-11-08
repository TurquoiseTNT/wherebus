function consoleSetup(){
    console.log('%cHello, Developer!', 'color: lightblue; font-size: 32px;');
    console.log('%cBe Careful. Anything Pasted in here gets run from this site and could give a hacker access to your tickets. Proceed with caution.', 'color: lightblue; font-size: 16px;');
}
async function initMap() {
    map = L.map('map').setView([51.505, -0.09], 16);
    L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=0d302bbdc3d84bedb7b4fa2327463704', {
        minZoom: 14,
        maxZoom: 18,
        attribution: '&copy; Thunderforest Maps'
    }).addTo(map);
    var userIcon = L.icon({
        iconUrl: 'images/loc.png',
        shadowUrl: '',
    
        iconSize:     [30, 30],
        shadowSize:   [0,0],
        iconAnchor:   [15, 15],
    });
    var userLocAc = false;
    var trackingStarted = false;
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLoc = L.marker([position.coords.latitude, position.coords.longitude], {icon: userIcon}).addTo(map);
            map.panTo([position["coords"]["latitude"], position["coords"]["longitude"]], 18);
            userLocAc = true;
        });
        navigator.geolocation.watchPosition((position) => {
            if (userLocAc && !trackingStarted){
                userLoc.setLatLng([position.coords.latitude, position.coords.longitude]);
                map.panTo([position.coords.latitude, position.coords.longitude]);
            }
        });
    }
}
async function getTickets() {
    tickets = JSON.parse(localStorage.getItem("tickets"));
    //tickets = [{name:"John D.",service:"Route 69"}]
    for (let x in tickets) {
        addTicketToMenu(x);
    }
}
async function addTicketToMenu(x) {
    aChild = document.createElement("a");
    newChild = document.createElement("div");
    newChild.classList.add("ticket");
    newChild.innerHTML = tickets[x]["name"] + " - " + tickets[x]["service"]
    aChild.href = "/ticket?" + x
    aChild.append(newChild);
    document.getElementById("menu-content").append(aChild);
}
async function getTicketData(){
    ticketRequested = Number(window.location.search.substring(1));
    ticketsData = JSON.parse(localStorage.getItem("tickets"));
    if (ticketsData[ticketRequested]){
        tid = ticketsData[ticketRequested]["tid"];
        console.log("%cTicket Requested: " + ticketRequested, 'color: lightgreen;')
        console.log("%cTicket Start ID: " + ticketsData[ticketRequested]["tid"], 'color: lightgreen;')
        baseUrl = "https://cors.wherebus.turquoisetnt.one/?" + encodeURI("https://eryqma7z39.execute-api.eu-west-1.amazonaws.com/prod/customer-ticket/" + tid);
        trackUrl = "https://cors.wherebus.turquoisetnt.one/?" + encodeURI("https://k4dxsjc6v3.execute-api.eu-west-1.amazonaws.com/prod/live-tracking/customer-ticket/" + tid)
        requestToServer = await fetch(baseUrl);
        data = await requestToServer.json();
        parseUserTicket(await data);
        if (data["has_tracking"]){
            var busitem = L.marker([51.505, -0.09]);
            var onMap = false;
            setInterval(updateBusTracker(trackUrl, busitem, onMap), 30000);
        }
    } else {
        alert("An Error Occured Attempting to Get Your Ticket. Please Tell an Admin this error code: LocStDataNotFnd")
    }
}
async function parseUserTicket(data){
    console.log("%cUser Ticket Data: " + JSON.stringify(data), 'color: lightgreen;');
    passenger = data["passenger"]
    if (passenger["first_name"].slice(-1) == " "){
        userName = passenger["first_name"] + passenger["last_name"]
    } else {
        userName = passenger["first_name"] + " " + passenger["last_name"]
    }
    document.getElementById("tabtitle").innerText = userName
}
async function updateBusTracker(url, busitem, onMap){
    loc = await getBusLocation(url);
    if (loc != false){
        busitem.setLatLng(loc);
        map.panTo(loc);
    }
    if (onMap) {
        busitem.addTo(map);
    }
}
async function getBusLocation(url){
    const lCResp = await fetch(url);
    if (!lCResp.ok) {
        throw new Error(`Response status: ${lCResp.status}`);
    }
    const bus = await lCResp.json();
    var t = new Date();
    t.setMinutes(t.getMinutes() - 5);
    if (bus["last_updated"] > t) {
        trackingStarted = true;
        return [bus["lat"], bus["long"]];
    } else {
        console.log("%cBus Has Not Reported Location in past 5 Minutes!", 'color: lightgreen;');
        return false;
    }
}