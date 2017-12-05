'use strict';
const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    config = require('./../bin/configuration'),
    { exec } = require('child_process'),
    fs = require('fs'),
    parseString = require('xml2js').parseString,
    request = require('request');


app.set('PORT', process.env.PORT || config.defaultPort);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser())

app.use('/', express.static('www'));

app.get('/:clientId', (req, res) => {

    console.log(req.params.clientId);

    let options = { method: 'GET', uri: config.API_SERVER_PATH + '/cart' }
    request(options, (err, response, body) => {
        res.cookie('cart', body);
        res.redirect('/index.html');
    })

})

// app.get('/', (req, res) => {
//     res.redirect('/index.html');
// })

// app.post('/payments', (req, res) => {
//     console.log(req.body);
//     res.status(200).send('OK');
// })

if (!fs.existsSync('payment_request')) {
    fs.mkdirSync('payment_request');
}

app.post('/payment', (req, res, next) => {
    //console.log(req.body);

    let items = req.body.item;
    let a = '';
    for (let i = 0; i < items.length; i++) {
        a += `<item id="${i}"><unitPrice>${items[i].price}</unitPrice><quantity>${items[i].quantity}</quantity></item>`;

    }


    let cyber_xml = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
     <soapenv:Header>
       <wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
          <wsse:UsernameToken>
           <wsse:Username>29081990</wsse:Username>
           <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">ZCScmdZ2kBCOmbZwCzB+Jtx33ZwC5EQNd3j5z/hMA+xwnbc1Qebu6l9QPCzqH4LHUx1B2kxJ+QQKGk/LPKwHH60u9UxLxxjVYnuNV2ozW9u86ev/WJwAyQ3+AF19InVPjPAMlHHf6l5lvPgeN+MZQ5UC0elhvpROqUhNukMoVZBcUKXWSBcB5GdGTTXq7s+zHhE7mHGUUYxp+YjgxlGXicDOR6Y7s7Tbt1NawkyzCIfjIXhIz46h9KCuJRtqw0zzJE3B13MKyaKteeguKj+XMmMPjzDISvV9tJSxlLoW9Ja43Td/ylKtwLcITGPdPwAugzl1DcM+pypzcKUuWqFtWQ==</wsse:Password>
         </wsse:UsernameToken>
       </wsse:Security>
     </soapenv:Header>
     <soapenv:Body>
       <requestMessage xmlns="urn:schemas-cybersource-com:transaction-data-1.142">
         <merchantID>29081990</merchantID>
         <merchantReferenceCode>MRC-29</merchantReferenceCode>
         <billTo>
           <firstName>${req.body.billTo.firstname}</firstName>
           <lastName>${req.body.billTo.lastname}</lastName>
           <street1>${req.body.billTo.street1}</street1>
           <street2>${req.body.billTo.street2}</street2>
           <city>${req.body.billTo.city}</city>
           <state>${req.body.billTo.state}</state>
           <postalCode>${req.body.billTo.zipcode}</postalCode>
           <country>${req.body.billTo.country}</country>
           <email>${req.body.billTo.email}</email>
         </billTo>
        ${a}
         <purchaseTotals>
           <currency>${req.body.purchaseTotals.currency}</currency>
         </purchaseTotals>
         <card>
           <accountNumber>${req.body.card.accountNumber}</accountNumber>
           <expirationMonth>${req.body.card.expirationMonth}</expirationMonth>
           <expirationYear>${req.body.card.expirationYear}</expirationYear>
         </card>
         <ccAuthService run="true"/>
       </requestMessage>
     </soapenv:Body>
    </soapenv:Envelope>`;





    fs.open(`payment_request/${req.body.clientId}.xml`, "wx", function(err, fd) {
        fs.writeFile(`payment_request/${req.body.clientId}.xml`, cyber_xml, function(err) {
            if (err)
                return console.log(err);

            let action = `curl --header "Content-Type: text/plain" -d@payment_request/${req.body.clientId}.xml https://ics2wstest.ic3.com/commerce/1.x/transactionProcessor/CyberSourceTransaction_1.142.wsdl`;

            exec(action, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                parseString(stdout, function(err, result) {
                    //fs.unlink(`payment_request/${req.body.clientId}.xml`);
                    console.log('results is', JSON.stringify(result));
                    console.log('results is', result['soap:Envelope']['$']['soap:Body']);

                    let msgStatus = result["soap:Envelope"]["soap:Body"][0]["c:replyMessage"][0]["c:decision"][0];
                    let options = { method: 'POST', uri: config.BOT_SERVSR_PATH + "/callback", json: { address: req.body.address, status: msgStatus }, timeout: 60000 };
                    request(options, (err, response, body) => {

                        res.send(result);
                    })

                });
            });
        });

    });


});


app.listen(app.get('PORT'), (req, res) => {
    console.log(`UI server is up and running on http://localhost:${app.get('PORT')}`);
})