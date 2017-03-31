import "babel-polyfill";
import https from "https";

const failResponse = {
    success: false
};

function buildResult(url, rsaSignResult, pageId) {
    if (rsaSignResult.success) {
        rsaSignResult.id = pageId;
        rsaSignResult.url = url;
        rsaSignResult.paymentGateway = "Test Gateway"; //TODO parameterize
        return rsaSignResult;
    } else {
        return failResponse;
    }
}

exports.handler = function(event, context, callback) {
    console.log("Received event:", JSON.stringify(event, null, 2));
    console.log("Received context:", JSON.stringify(context, null, 2));

    const {zuoraHost, zuoraPaymentPageId} = event["stage-variables"];
    const uri = "https://" + zuoraHost + "/apps/PublicHostedPageLite.do";
    const postData = JSON.stringify({
        method: "POST",
        pageId: zuoraPaymentPageId,
        uri: uri
    });

    let req = https.request({
        headers: {
            ...event["stage-variables"],
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Content-Length": postData.length
        },
        hostname: `rest.${zuoraHost}`,
        method: "POST",
        path: "/v1/rsa-signatures"
    }, res => {
        let rawData = "";
        res.on("data", data => {
            rawData += data;
        });
        res.on("end", () => {
            console.log("Received data:", rawData);
            callback(null, buildResult(uri, JSON.parse(rawData), zuoraPaymentPageId));
        });
    });
    req.on("error", e => {
        console.error(e);
        callback(null, failResponse);
    });
    req.write(postData);
    req.end();
};
