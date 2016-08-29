var keyType = "2q2r"; //the keytype selected

addState("keytype", function (sel) {
    $("#continue", sel).click(
        function (event) {
            keyType = $('input[name=keyradio]:checked', '#form-kt').val();
            selectState(keyType + "-generate");
        }
    )
});

addState("2q2r-generate", function (sel) {
    $("#continue", sel).click(
        function (event) {

        }
    );
    $("#back", sel).click(
        function (event) {
            selectState(keytype);
        }
    );
    $("#qrcode", sel).empty();
    $("#qrcode", sel).qrcode({
        text: "R " + data.challenge + " " + data.infoUrl + " " + data.userID,
        size: 100,
        radius: 0.3
    });

    $.get(data.waitUrl, function (res) {
        if (res.successful) {
            $("#qrcode", sel).empty();
            $("#qrcode", sel).append("<img src=\"check.png\" alt=\"Registration\n" +
                "Successful!\" id=\"successImage\" style=\"width: 174px; height: 174px;\">");
        }
    }, "json")
        .fail(function (jqXHR, textStatus) {
            $("#qrcode", sel).empty();
            $("#qrcode", sel).append("<img src=\"timeout.png\" alt=\"Registration\n" +
                "timed out.\" id=\"timeoutImage\" style=\"width: 174px; height: 174px;\">");
           
        });

});


$(document).ready(function () {
    init();

    // start with key type selection
    selectState("keytype");





});