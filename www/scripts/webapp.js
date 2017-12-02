'use strcit';
angular.module('payment', ['ngRoute', 'ngCookies'])
    .controller("mainCtrl", ["$scope", "$http", "$cookies", function($scope, $http, $cookies) {
        $scope.card = { expirationMonth: '0', expirationYear: '0' };
        $scope.month = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        $scope.year = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];


        $scope.submit = function() {
            console.log($scope.card);
            console.log(JSON.parse($cookies.get('cart')).clientId);
            var info = JSON.parse($cookies.get('cart'));
            var data = {
                "clientId": info.clientId,
                "billTo": info.orderDetails,
                "item": {
                    "unitPrice": 90,
                    "quantity": 1
                },
                "purchaseTotals": {
                    "currency": "USD"
                },
                "address": info.botAddress,
                "card": $scope.card
            };

            $http.post("/payment", data)
                .then(function(response) {
                    console.log(response);
                }, function(err) {
                    console.log(err);
                });
        }
    }]);