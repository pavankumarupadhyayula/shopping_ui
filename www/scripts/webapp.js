'use strcit';
angular.module('payment', ['ngCookies'])
    .controller("mainCtrl", ["$scope", "$http", "$cookies", function($scope, $http, $cookies) {
        $scope.card = { expirationMonth: '0', expirationYear: '0' };
        $scope.month = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        $scope.year = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

        var info = JSON.parse($cookies.get('cart'));
        var priceArr = [];
        var itemArr = []
        var reducer = function(accumulator, currentValue) { return accumulator + currentValue; };
        info.orderDetails.order.Item.forEach(function(value, key) {
            itemArr.push(value.quantity);
            priceArr.push(value.price * value.quantity);
        });
        var toatlPrice = priceArr.reduce(reducer);
        var toatlTems = itemArr.reduce(reducer);
        console.log(info.orderDetails.order.Item);

        $scope.msgTotal = "$" + toatlPrice + " is going pay for " + toatlTems + " items";


        $scope.submit = function() {

            var data = {
                "clientId": info.clientId,
                "billTo": info.orderDetails,
                "item": info.orderDetails.order.Item,
                "purchaseTotals": {
                    "currency": "USD"
                },
                "address": info.botAddress,
                "card": $scope.card
            };


            console.log(data);

            $http.post("/payment", data)
                .then(function(response) {

                    if (response.data["soap:Envelope"]["soap:Body"][0]["c:replyMessage"][0]["c:decision"][0] == 'ACCEPT') {
                        window.location.href = "/v1/success.html";
                    } else {
                        window.location.href = "/v1/error.html";
                    }
                }, function(err) {
                    console.log(err);
                });
        }
    }])