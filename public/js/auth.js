var keyIndex = 0; // the key selected

addState("keyselect", "authKeyList",
    function () {
        console.log("Keys: ", data.keys);
        return {
            keys: data.keys
        }
    }, function (sel) {
        data.keys.forEach(function (key, i) {
            $("#" + i + "-cb").click(
                function (event) {
                    $("div", "#keyInfo").hide();
                    $("#" + i + "-ki").show();
                }
            );
        });

        $("#continue", sel).click(
            function (event) {
                keyIndex = $('input[name=keyradio]:checked', '#form-kt').val();
                var keyType = data.keys[keyIndex].type;
                selectState(keyType + "-login");
            }
        )
    });

addState("2q2r-login", "2q2rAuth",
    function () {
        return {
            key: data.keys[keyIndex]
        }
    }, function (sel) {
        $("#trigger-challenge").click(
            function(event){
                $('#modal-challenge').openModal();
            }
        )

        $.postJSON(data.challengeUrl, {
            keyID: data.keys[keyIndex].keyID
        }, function (res) {
            $("#qrcode", sel).empty();
            $("#qrcode", sel).qrcode({
                text: "A " + res.appID + " " + res.challenge + " " + res.keyID + " " + res.counter,
                width: 192, height: 192
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
                    console.log("Error: ", textStatus);
                    $("#qrcode", sel).empty();
                    $("#qrcode", sel).append("<img src=\"/img/timeout.png\" alt=\"Registration\n" +
                        "timed out.\" id=\"timeoutImage\" style=\"width: 174px; height: 174px;\">");

                });
        }, "json");


    });

$(document).ready(function () {
    init({
        title: 'Authentication'
    });

    // start with key type selection
    selectState("keyselect");

});