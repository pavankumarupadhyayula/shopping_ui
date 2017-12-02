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


app.set('PORT', config.defaultPort);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser())

app.use('/v1', express.static('www'));

app.get('/v1/:clientId', (req, res) => {

    console.log(req.params.clientId);

    let options = { method: 'GET', uri: config.API_SERVER_PATH + '/v1/cart' }
    request(options, (err, response, body) => {
        res.cookie('cart', body);
        res.redirect('/v1/index.html');
    })

})

app.get('/', (req, res) => {
    res.redirect('/v1/index.html');
})

// app.post('/payments', (req, res) => {
//     console.log(req.body);
//     res.status(200).send('OK');
// })

if (!fs.existsSync('payment_request')) {
    fs.mkdirSync('payment_request');
}

app.post('/payment', (req, res, next) => {
    //console.log(req.body);

    let cyber_xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Header>
   <wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
       <wsse:Username>29081988</wsse:Username>
       <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">cufdZkJTGLpH9tup7OMRFf7uvITpz22WMDeNsf5JQ6sWh7SIxTSmIbSs+8cqmLVDxdPDylFrVlpmTcqxLWI4JcTLZFBG8FPwGaO6wgLHgyi9NdJAFyy2d+hUybHyOy0ae4GIuSbeXvRl2GfWTDUlIhyWtMAU6VcKz0h44pO236NGX4a8TG2ObmopF5SzlH7hS7Wv646yUHaB/b9WCKBWpySZHoKNW/MY/d3hJu+tYtTs/oN2+m/9zB2IljL5kv7iBNnFEkW89zeou+QwgUnpKD0fX4qKftNHRuGWqTFLQjf9nrBxS/a6q7eSkyjsbbHWGJm0Kx1OLsDTWEZEiEFReQ==</wsse:Password>
     </wsse:UsernameToken>
   </wsse:Security>
 </soapenv:Header>
 <soapenv:Body>
   <requestMessage xmlns="urn:schemas-cybersource-com:transaction-data-1.142">
     <merchantID>29081988</merchantID>
     <merchantReferenceCode>MRC-123</merchantReferenceCode>
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
     <item id="0">
       <unitPrice>${req.body.item.unitPrice}</unitPrice>
       <quantity>${req.body.item.quantity}</quantity>
     </item>
     <purchaseTotals>
       <currency>${req.body.purchaseTotals.currency}</currency>
     </purchaseTotals>
     <card>
       <fullName>${req.body.card.fullName}</fullName>
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
                    fs.unlink(`payment_request/${req.body.clientId}.xml`);
                    console.log('results is', JSON.stringify(result));
                    console.log('results is', result['soap:Envelope']['$']['soap:Body']);

                    let options = { method: 'POST', uri: config.BOT_SERVSR_PATH + "/callback", json: { address: req.body.address }, timeout: 60000 };
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