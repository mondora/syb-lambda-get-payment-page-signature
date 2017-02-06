import "babel-polyfill";
import https from "https";

// StartYourBusiness Credit card payment page ID
const pageId = "2c92c0f959d961e8015a030562be0c8c";

const failResponse = {
    success: false
};

function buildResult(url, rsaSignResult) {
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

    const {zuoraApiHost} = event["stage-variables"];
    const uri = "https://" + zuoraApiHost + "/apps/PublicHostedPageLite.do";
    const postData = JSON.stringify({
        method: "POST",
        pageId: pageId,
        uri: uri
    });

    let req = https.request({
        headers: {
            ...event["stage-variables"],
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Content-Length": postData.length
        },
        hostname: zuoraApiHost,
        method: "POST",
        path: "/rest/v1/rsa-signatures"
    }, res => {
        let rawData = "";
        res.on("data", data => {
            rawData += data;
        });
        res.on("end", () => {
            console.log("Received data:", rawData);
            callback(null, buildResult(uri, JSON.parse(rawData)));
        });
    });
    req.on("error", e => {
        console.error(e);
        callback(null, failResponse);
    });
    req.write(postData);
    req.end();
};
