var state = "";
var states = {};

/**
 * This function must be called once the page is loaded
 */
function init() {
    $('.ui.checkbox').checkbox();

    // JQuery Shim to post JSON
    jQuery["postJSON"] = function (url, data, callback) {
        // shift arguments if data argument was omitted
        if (jQuery.isFunction(data)) {
            callback = data;
            data = undefined;
        }

        return jQuery.ajax({
            url: url,
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: callback
        });
    };
}

/**
 * Function to add a state
 * @name {string} State name
 * @init {Function} Sate init code. Triggered when state changes
 */
function addState(name, init) {
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

/**
 * Auxiliary function to extract big and small displayable text out of challenges
 * 
 * @ch {string} the challenge to process
 * @returns { big: string, small: string }
 */
function displayableChallenge(ch){
    // compute small text
    var small = ch.substr(8,4);
    for (var i=12; (i<ch.length  && i<28); i+=4){
        small += " "+ ch.substr(i,4);
    }
    return {
        big: ch.substr(0,4)+" "+ch.substr(4,4),
        small: small 
    }
}