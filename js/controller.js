//Creating angular module UIRanking
var uiranking = angular.module("uiranking", ["firebase"]);
uiranking.constant("firebase_url", {
    base_url: "https://highlighting-ranking.firebaseio.com/data",
    users: "https://highlighting-ranking.firebaseio.com/users",
});


//Configuring router
uiranking.config(["$routeProvider", function ($routeProvider) {
    $routeProvider.
    when("/info", {
        templateUrl: "views/info.html",
        controller: "infoController"
    }).
    when("/home", {
        templateUrl: "views/home.html",
        controller: "homeController"
    }).
    when("/stats", {
        templateUrl: "views/stats.html",
        controller: "statsController"
    }).
    when("/description", {
        templateUrl: "views/description.html",
        controller: "descriptionController"
    }).
    otherwise({
        redirectTo: "/info"
    })
}]);

//Controller for experiment core comparisons
uiranking.controller("homeController", ["$scope", "angularFireCollection", "firebase_url", "$rootScope", "$http", "$location",
 function ($scope, angularFireCollection, firebase_url, $rootScope, $http, $location) {
        var picturesRef;

        var comparisonsArray = [];

        var array = [];

        var nComparisons = 0;

        var percentage = 0;

        var comparisonsMax = 0;


        var success = function (data) {
            data.data.children.forEach(function (entry) {
                array.push(entry.name);
            });
        };

        var error = function () {
            alert("error");
        };

        $http.get('images.json').then(success, error);


        activate_nav(".home");
        $scope.refresh = function () {
            setTimeout(function () {

                if (nComparisons < maxComparisons(array.length)) {
                    $scope.nComparisons = nComparisons;
                    $scope.comparisonsMax = maxComparisons(array.length);
                    $scope.percentage = (nComparisons/$scope.comparisonsMax)*100;
                    $scope.image1 = array[Math.floor(Math.random() * array.length)];
                    var name1 = $scope.image1.substring(0, $scope.image1.length - 4);
                    $scope.image2 = array[Math.floor(Math.random() * array.length)];
                    var name2 = $scope.image2.substring(0, $scope.image2.length - 4);

                    while ($scope.image1 === $scope.image2 || compared(name1, name2) || incompatible(name1, name2)) {
                        $scope.image1 = array[Math.floor(Math.random() * array.length)];
                        name1 = $scope.image1.substring(0, $scope.image1.length - 4);
                        $scope.image2 = array[Math.floor(Math.random() * array.length)];
                        name2 = $scope.image2.substring(0, $scope.image2.length - 4);
                    }

                    $scope.name1 = name1;
                    $scope.name2 = name2;

                    // $scope.description1 = descriptions.filter(function(el){return el.name == name1})[0].description;
                    // $scope.description2 = descriptions.filter(function(el){return el.name == name2})[0].description;

                    $scope.pictures.once("value", function (snapshot) {

                        if (!snapshot.hasChild(name1)) {
                            $scope.pictures.child(name1).child("name").set(name1);
                            $scope.pictures.child(name1).child("value").set(0);
                            $scope.pictures.child(name1).child("impressions").set(1);
                        } else {
                            $scope.pictures.child(name1).child("impressions").set(snapshot.val()[name1].impressions + 1);
                        }

                        if (!snapshot.hasChild(name2)) {
                            $scope.pictures.child(name2).child("name").set(name2);
                            $scope.pictures.child(name2).child("value").set(0);
                            $scope.pictures.child(name2).child("impressions").set(1);
                        } else {
                            $scope.pictures.child(name2).child("impressions").set(snapshot.val()[name2].impressions + 1);
                        }
                    });

                    $rootScope.users.once("value", function (snapshot) {
                        var id = $rootScope.user.id;
                        var technique = $rootScope.technique;
                        if (!snapshot.child(id).child(technique).hasChild(name1)) {
                            $scope.users.child(id).child(technique).child(name1).child("impressions").set(1);
                            $rootScope.users.child(id).child(technique).child(name1).child("value").set(0);

                        } else {
                            $scope.users.child(id).child(technique).child(name1).child("impressions").set(snapshot.val()["" + id][technique][name1].impressions + 1);

                        }

                        if (!snapshot.child(id).child(technique).hasChild(name2)) {
                            $scope.users.child(id).child(technique).child(name2).child("impressions").set(1);
                            $rootScope.users.child(id).child(technique).child(name2).child("value").set(0);
                        } else {
                            $scope.users.child(id).child(technique).child(name2).child("impressions").set(snapshot.val()["" + id][technique][name2].impressions + 1);

                        }
                    });

                } else {
                    $scope.finished = true;
                    if ($rootScope.techniqueId + 1 == techniques.length)
                        $rootScope.rankingAvailable = true;
                }
                $scope.$apply();

            }, 1000);
        }
        var firebase_init = function () {
            $scope.pictures = new Firebase(firebase_url.base_url + "/" + $rootScope.technique);
            $scope.refresh();
        }
        firebase_init();
        $scope.vote = function (option1, option2) {
            var name1 = option1.substring(0, option1.length - 4);
            var name2 = option2.substring(0, option2.length - 4);

            var id = $rootScope.user.id;
            var technique = $rootScope.technique;


            $scope.pictures.once("value", function (snapshot) {
                $scope.pictures.child(name1).child("value").set(snapshot.val()[name1].value + 1);
                $scope.pictures.child(name1).child("comparisons").child(name2).child($rootScope.user.id).set("+");
                $scope.pictures.child(name2).child("comparisons").child(name1).child($rootScope.user.id).set("-");
            });

            $rootScope.users.once("value", function (snapshot) {
                $rootScope.users.child(id).child(technique).child(name1).child("value").set(snapshot.val()["" + id][technique][name1].value + 1);
                $rootScope.users.child(id).child(technique).child(name1).child("comparisons").child(name2).set("+");
                $rootScope.users.child(id).child(technique).child(name2).child("comparisons").child(name1).set("-");
            });

            $scope.refresh();
        }
        $scope.draw = function (option1, option2) {
            var name1 = option1.substring(0, option1.length - 4);
            var name2 = option2.substring(0, option2.length - 4);

            var id = $rootScope.user.id;
            var technique = $rootScope.technique;

            $scope.pictures.child(name1).child("comparisons").child(name2).set("=");
            $scope.pictures.child(name2).child("comparisons").child(name1).set("=");

            $rootScope.users.child(id).child(technique).child(name1).child("comparisons").child(name2).set("=");
            $rootScope.users.child(id).child(technique).child(name2).child("comparisons").child(name1).set("=");

            $scope.refresh();
        }

        $scope.goToRanking = function () {
            $location.path("/stats");
        }

        function compared(name1, name2) {
            if (name1 === name2)
                return true;
            var namesConcat = name1 + name2
            if (comparisonsArray.indexOf(namesConcat) === -1) {
                comparisonsArray.push(namesConcat);
		if(!incompatible(name1,name2))
               	   nComparisons += 1;
                return false;
            } else {
                return true;
            }
        }

	function incompatible(name1, name2){
	    return (name1.indexOf('-r') !== -1) || (name2.indexOf('-l') !== -1);
	}

        function maxComparisons(n) {
          //all
          //return (Math.pow(n, 2) - n) / 2;
          return 20;
        }

        $scope.next = function () {
            $rootScope.techniqueId += 1;
            $location.path("/description");
        }
 }
]);


//Controller for demographic form and userId assignment
uiranking.controller("infoController", ["$scope", "$rootScope", "angularFireCollection", "firebase_url", "$location",
    function ($scope, $rootScope, angularFireCollection, firebase_url, $location) {

        $rootScope.users = new Firebase(firebase_url.users);

        if (!$rootScope.user) {
            $rootScope.user = {};
        }

        $rootScope.users.once("value", function (snapshot) {
            if (!$rootScope.idSaved) {
                if (snapshot.hasChildren()) {
                    var value = snapshot.val();
                    $rootScope.user.id = value.nextId;
                } else {
                    $rootScope.user.id = 1;
                }
                $rootScope.users.child("nextId").set($rootScope.user.id + 1);
                $scope.$apply();
            }
        });

        $scope.submit = function () {
            $rootScope.users.child($rootScope.user.id).child("yob").set($rootScope.user.yob);
            $rootScope.users.child($rootScope.user.id).child("gender").set($rootScope.user.gender);
            $rootScope.users.child($rootScope.user.id).child("tech-unfamiliar").set($rootScope.user.techUnfamiliar);
            $rootScope.idSaved = true;
            $rootScope.techniqueId = 0;
            $location.path('/description')
        }
    }
]);

uiranking.controller("descriptionController", ["$scope", "angularFireCollection", "firebase_url", "$rootScope",
 function ($scope, angularFireCollection, firebase_url, $rootScope) {
        $rootScope.technique = techniques[$rootScope.techniqueId].name;
        if ($rootScope.techniqueId + 1 < techniques.length) {
            $rootScope.rankingAvailable = false;
            $rootScope.nextTechnique = techniques[$rootScope.techniqueId + 1].name
        }
        $scope.description = techniques[$rootScope.techniqueId].description;

 }]);

//Controller for showing statistics
uiranking.controller("statsController", ["$scope", "angularFireCollection", "firebase_url", "$rootScope", "$route",
 function ($scope, angularFireCollection, firebase_url, $rootScope, $route) {

        $rootScope.techniques = techniques;


        $scope.Math = window.Math;
        var firebase_init = function () {
            $scope.pictures = new Firebase(firebase_url.base_url);
            $scope.users = new Firebase(firebase_url.users);
        }
        firebase_init();
        $scope.pictures.once("value", function (snapshot) {
            $scope.uiset = snapshot.val();
            $scope.$apply();
        });

        $scope.users.once("value", function (snapshot) {
           $scope.participants = Object.keys(snapshot.val()).length-1;
           $scope.$apply();
        });

        $scope.refreshRanking = function(){
            $route.reload();
        }

        activate_nav(".stats");
 }
]);

//Transforming object to array with a filter
uiranking.filter('object2Array', function () {
    return function (input) {
        var out = [];
        for (i in input) {
            out.push(input[i]);
        }
        return out;
    }
})
