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
        width: 160, height: 160
    });

    var disp = displayableChallenge(res.challenge);
    $("#challenge-big", sel).text(disp.big);
    $("#challenge-small", sel).text(disp.small);

    $.get(data.waitUrl, function (res) {
        if (res.successful) {
            $("#qrcode", sel).empty();
            $("#qrcode", sel).append("<img src=\"/img/check.png\" alt=\"Registration\n" +
                "Successful!\" id=\"successImage\" style=\"width: 174px; height: 174px;\">");
        }
    })
        .fail(function (jqXHR, textStatus) {
            $("#qrcode", sel).empty();
            $("#qrcode", sel).append("<img src=\"/img/timeout.png\" alt=\"Registration\n" +
                "timed out.\" id=\"timeoutImage\" style=\"width: 174px; height: 174px;\">");

        });

});


$(document).ready(function () {
    init();

    // start with key type selection
    selectState("keytype");

});