var keys = []; // list of keys to delete

addState("keyselect", function (sel) {
    $("#continue", sel).click(
        function (event) {
            keys = $('input[name=keycheckbox]:checked', '#form-kt').val();

            console.log("Keys: ", keys);

            selectState("deleted");
        }
    )
});

$(document).ready(function () {
    init();

    for (var i = 0; i < data.keys.length; i++) {
        var name = data.keys[i].name;
        var type = data.keys[i].type;
        $("#keylist").append(
            '<div class="field">' +
            '<div class="ui checkbox">' +
            '<input type="checkbox" value="' + i + '" name="keycheckbox">' +
            '<label><b>' + name + '</b> [' + type + ']</label>' +
            '</div>' +
            '</div>'
        );
    }
    // start with key type selection
    selectState("keyselect");

});