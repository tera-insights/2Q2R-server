var state = "";
var states = {};

/**
 * This function must be called once the page is loaded
 */
function init(){
    $('.ui.checkbox').checkbox();
}

/**
 * Function to add a state
 * @name {string} State name
 * @init {Function} Sate init code. Triggered when state changes
 */
function addState(name, init){
    states[name] = init;
}


/**
 * Function to switch states. This controls the <section> active
 * Call the state init with state selector as argument as well
 */
function selectState(state) {
    $("section").hide();
    var stateSel = $("section[state='" + state + "']");
    console.log("Selected: ", stateSel);
    stateSel.show();
    if (states[state])
        states[state](stateSel);
}


