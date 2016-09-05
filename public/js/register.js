var keyType = "2q2r"; //the keytype selected

addState("keytype", "registerKeyList", function () {
    return {
        keys: data.keyTypes.map(makeKeyInfo)
    }
}, function (sel) {
    data.keyTypes.forEach(function (key) {
        $("#" + key + "-cb").click(function (event) {
            $("div", "#keyInfo").hide();
            $("#" + key + "-ki").show();
        });
    });

    $("#continue", sel).click(
        function (event) {
            keyType = $('input[name=keyradio]:checked', '#form-kt').val();
            selectState(keyType + "-generate");
        }
    )
});

addState("2q2r-generate", "2q2rRegister",
    function () {
        return {}
    },
    function (sel) {
        $("#continue", sel).click(
            function (event) {

            }
        );
        $("#back", sel).click(
            function (event) {
                selectState('keytype');
            }
        );
        $("#qrcode", sel).empty();
        $("#qrcode", sel).qrcode({
            text: "R " + data.challenge + " " + data.infoUrl + " " + data.userID,
            width: 192, height: 192
        });

        var disp = displayableChallenge(data.challenge);
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
    init({
        title: 'Device Registration'
    });

    // start with key type selection
    selectState("keytype");

});