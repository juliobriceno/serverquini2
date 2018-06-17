
// Cube Service Parameters
// URL Cube Service String
//var connServiceString = "http://www.cube-mia.com/api/";
var connServiceString = "https://portal.cube-usa.com/api/";

// Server Authorization
var ServerAuth = "Basic Y3ViZXU6Y3ViZTIwMTc=";
// End Cube Service Parameters


angular.element(function() {
    angular.bootstrap(document, ['WarrantyModule']);
});

function testInterceptor() {
  return {
    request: function(config) {
      if (!config.url.startsWith(connServiceString + "CubeClientAuthentication.ashx")) {
        if (localStorage.cnnData2 == 'undefined'){
          window.location = 'index.html';
        }
      }
      return config;
    },
  }
}

angular.module('WarrantyModule', ['angularFileUpload', 'darthwade.loading', 'ngTagsInput', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.select', 'ui.toggle', 'dndLists', 'ngPatternRestrict'])

        .factory('testInterceptor', testInterceptor)
        .config(function($httpProvider) {
          $httpProvider.interceptors.push('testInterceptor');
        })

        .controller('ctrlCubeCustomerAppServiceHistory', ['$scope', '$http', '$loading', '$uibModal', function ($scope, $http, $loading, $uibModal) {

          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          var cnnData = JSON.parse(localStorage.cnnData2);
          var EmployeeData = JSON.parse(localStorage.EmployeeData);

          $scope.CreateOrder = function() {
            // Call method to create order
            var headers = {"Authorization": ServerAuth};
            var cnnData = JSON.parse(localStorage.cnnData2);

            if (typeof $scope.selectedCustomerSite == 'undefined' || $scope.CustomerPO.trim() == '' || typeof $scope.selectedPriority == 'undefined' || $scope.ReasonForService.trim() == '') {
                swal("Cube Service", "You must fill all fields.");
                return 0;
            }

            $scope.CreateDisabled = true;

            var urlRq = connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"SaveServiceInfo_Customer","conncode":"' + cnnData.DBNAME + '","siteid":"' + $scope.selectedCustomerSite.ID + '", "customerpo": "' + $scope.CustomerPO + '", "priorityid": "' + $scope.selectedPriority.ID + '", "reasonforservice": "' + $scope.ReasonForService + '", "reqbyid": "' + cnnData.ID + '"}';

            $loading.start('myloading');
            $http.get(urlRq, {headers: headers}).then(function (response) {
              if (response.data.responseCode.substring(0, 3) == '200'){
                $scope.CustomerPO = '';
                $scope.ReasonForService = '';
                $scope.selectedCustomerSite = undefined;
                $scope.selectedPriority = undefined;
                // Refresh Services

                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_History_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
                  $scope.CustomerOrderHistory = response.data.CubeFlexIntegration.DATA;

                  $loading.finish('myloading');

                  if (typeof $scope.CustomerOrderHistory != 'undefined'){
                    $scope.CustomerOrderHistory.forEach(function(element) {
                      element.Schedule_Date = new Date(element.Schedule_Date);
                    });
                  }

                  $scope.CustomerOrderHistoryFiltered = $scope.CustomerOrderHistory;

                  $scope.SearchWOL();

                  swal("Cube Service", "Service was created.");
                  $scope.CreateDisabled = false;

                  // Close modal
                  $('#create_order').modal('hide');

                })
                .catch(function (data) {
                  console.log('Error 16');
                  console.log(data);
                  swal("Cube Service", "Unexpected error. Check console Error 16.");
                });


              }
            })
            .catch(function (data) {
              console.log('Error 9');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 9.");
            });


          };

          $scope.CloseSession = function(){
            delete localStorage.cnnData2;
            window.location = 'index.html';
          }

          function getArray(object){
              if (Array.isArray(object)){
                return object;
              }
              else{
                return [object]
              }
          }

          $scope.GetWorkOrderDetail = function(WorkOrderId){
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceInfo","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
              $scope.WorkOrder = response.data.CubeFlexIntegration.DATA;
              $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceDetails_Customer","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
                $scope.WorkOrderDetail = getArray(response.data.CubeFlexIntegration.DATA);
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceRecomendations","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
                  $scope.WorkOrderRecomendation = getArray(response.data.CubeFlexIntegration.DATA);
                })
                .catch(function (data) {
                  console.log('Error 12');
                  console.log(data);
                  swal("Cube Service", "Unexpected error. Check console Error 12.");
                });
              })
              .catch(function (data) {
                console.log('Error 13');
                console.log(data);
                swal("Cube Service", "Unexpected error. Check console Error 13.");
              });
            })
            .catch(function (data) {
              console.log('Error 14');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 14.");
            });
          }

          $scope.NameUser = localStorage.NameUser;

          var headers = {"Authorization": ServerAuth};

          if (typeof localStorage.cnnData2 != 'undefined'){

            $loading.start('myloading');

            $scope.cnnData = cnnData;

            $scope.NameUser = cnnData.Name;

            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_History_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {

              $scope.CustomerOrderHistory = response.data.CubeFlexIntegration.DATA;

              $loading.finish('myloading');

              if (typeof $scope.CustomerOrderHistory != 'undefined'){
                $scope.CustomerOrderHistory.forEach(function(element) {
                  element.Schedule_Date = new Date(element.Schedule_Date);
                });
              }

              $scope.CustomerOrderHistoryFiltered = $scope.CustomerOrderHistory;

              if (typeof $scope.CustomerOrderHistory != 'undefined'){
                $scope.SearchWOL();
              }

            })
            .catch(function (data) {
              console.log('Error 16');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 16.");
            });

          }
          else{
            window.location = 'index.html';
          }

          $scope.ValidaDate = function(dDate){
            if ( Object.prototype.toString.call(dDate) === "[object Date]" ) {
              if ( isNaN( dDate.getTime() ) ) {
                return false;
              }
              else {
                return true;
              }
            }
            else {
              return false;
            }
          }

          $scope.SearchWOL = function(){

            if (!$scope.ValidaDate($scope.fromDate) || !$scope.ValidaDate($scope.toDate)){
              $scope.CustomerOrderHistoryFiltered = [];
              return 0;
            }

            $scope.CustomerOrderHistoryFiltered = $scope.CustomerOrderHistory;

            var dt = new Date($scope.toDate.getFullYear(), $scope.toDate.getMonth(), $scope.toDate.getDate(), 23, 59, 59);
            $scope.toDate = dt;

            $scope.CustomerOrderHistoryFiltered = $scope.CustomerOrderHistoryFiltered.filter(function (el){
              return (el.Schedule_Date > $scope.fromDate && el.Schedule_Date <= $scope.toDate && (el.Reported_Issue.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1 || el.ITEMNAME.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1));
            })

          }

          // Get service sites for customer to populate select sites in create new order
          $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Sites_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
            $scope.CustomerSites = getArray(response.data.CubeFlexIntegration.DATA);
            $scope.CustomerSitesFiltered = $scope.CustomerSites;
          })
          .catch(function (data) {
            console.log('Error 27');
            console.log(data);
            swal("Cube Service", "Unexpected error. Check console Error 27.");
          });

          // GetPriorities to populate select Priorities in create new order
          $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePriority","conncode":"' + cnnData.DBNAME + '"}', {headers: headers}).then(function (response) {
            $scope.Priorities = getArray(response.data.CubeFlexIntegration.DATA);
          })
          .catch(function (data) {
            console.log('Error 28');
            console.log(data);
            swal("Cube Service", "Unexpected error. Check console Error 28.");
          });

          $scope.SearchText = '';
          var date = new Date();
          $scope.fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
          $scope.toDate = new Date();
          $scope.toDate.setDate($scope.toDate.getDate()+1);

          // Date Control Functions
          $scope.today = function() {
            $scope.dt = new Date();
          };
          $scope.today();

          $scope.clear = function() {
            $scope.dt = null;
          };

          $scope.inlineOptions = {
            customClass: getDayClass,
            minDate: new Date(),
            showWeeks: true
          };

          $scope.dateOptions = {
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
          };

          // Disable weekend selection
          function disabled(data) {
            var date = data.date,
              mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
          }
          $scope.toggleMin = function() {
            $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
            $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
          };
          $scope.toggleMin();
          $scope.open1 = function() {
            $scope.popup1.opened = true;
          };
          $scope.open2 = function() {
            $scope.popup2.opened = true;
          };
          $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
          };
          $scope.formats = ['MM-dd-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
          $scope.format = $scope.formats[0];
          $scope.altInputFormats = ['M!/d!/yyyy'];
          $scope.popup1 = {
            opened: false
          };
          $scope.popup2 = {
            opened: false
          };
          var tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          var afterTomorrow = new Date();
          afterTomorrow.setDate(tomorrow.getDate() + 1);
          $scope.events = [
            {
              date: tomorrow,
              status: 'full'
            },
            {
              date: afterTomorrow,
              status: 'partially'
            }
          ];
          function getDayClass(data) {
            var date = data.date,
              mode = data.mode;
            if (mode === 'day') {
              var dayToCheck = new Date(date).setHours(0,0,0,0);

              for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

                if (dayToCheck === currentDay) {
                  return $scope.events[i].status;
                }
              }
            }

            return '';
          }
          // End Date Control Functions

        }])

        .controller('ctrlCubeCustomerAppSite', ['$scope', '$http', '$loading', '$uibModal', function ($scope, $http, $loading, $uibModal) {

          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.User = {};
          $scope.User.name = '';
          $scope.User.password = '';
          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          var cnnData = JSON.parse(localStorage.cnnData2);
          $scope.cnnnData2 = cnnData;
          var EmployeeData = JSON.parse(localStorage.EmployeeData);
          $scope.NameUser = cnnData.Name;

          function getArray(object){
              if (Array.isArray(object)){
                return object;
              }
              else{
                return [object]
              }
          }

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.CloseSession = function(){
            delete localStorage.cnnData2;
            window.location = 'index.html';
          }

          var headers = {"Authorization": ServerAuth};

          if (typeof localStorage.cnnData2 != 'undefined'){

            // Get service sites for customer to populate select sites in create new order
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Sites_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
              $scope.CustomerSites = getArray(response.data.CubeFlexIntegration.DATA);
              $scope.CustomerSitesFiltered = $scope.CustomerSites;
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // GetPriorities to populate select Priorities in create new order
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePriority","conncode":"' + cnnData.DBNAME + '"}', {headers: headers}).then(function (response) {
              $scope.Priorities = getArray(response.data.CubeFlexIntegration.DATA);
            })
            .catch(function (data) {
              console.log('Error 28');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 28.");
            });
          }
          else{
            window.location = 'index.html';
          }

          $scope.SearchSites = function(){

            $scope.CustomerSitesFiltered = $scope.CustomerSites;

            $scope.CustomerSitesFiltered = $scope.CustomerSitesFiltered.filter(function (el){
              return el.SITENAME.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1;
            })

          }

          $scope.CustomerPO = '';
          $scope.ReasonForService = '';

          $scope.CreateOrder = function() {
            // Call method to create order
            var headers = {"Authorization": ServerAuth};
            var cnnData = JSON.parse(localStorage.cnnData2);

            if (typeof $scope.selectedCustomerSite == 'undefined' || $scope.CustomerPO.trim() == '' || typeof $scope.selectedPriority == 'undefined' || $scope.ReasonForService.trim() == '') {
                swal("Cube Service", "You must fill all fields.");
                return 0;
            }

            $scope.CreateDisabled = true;

            var urlRq = connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"SaveServiceInfo_Customer","conncode":"' + cnnData.DBNAME + '","siteid":"' + $scope.selectedCustomerSite.ID + '", "customerpo": "' + $scope.CustomerPO + '", "priorityid": "' + $scope.selectedPriority.ID + '", "reasonforservice": "' + $scope.ReasonForService + '", "reqbyid": "' + $scope.cnnnData2.ID + '"}';

            $loading.start('myloading');
            $http.get(urlRq, {headers: headers}).then(function (response) {
              if (response.data.responseCode.substring(0, 3) == '200'){
                $scope.CustomerPO = '';
                $scope.ReasonForService = '';
                $scope.selectedCustomerSite = undefined;
                $scope.selectedPriority = undefined;
                // Refresh Services
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
                  $scope.CustomerData = getArray(response.data.CubeFlexIntegration.DATA);
                  $loading.finish('myloading');
                  swal("Cube Service", "Service was created.");
                  $scope.CreateDisabled = false;

                  // Close modal
                  $('#create_order').modal('hide');
                })

              }
            })
            .catch(function (data) {
              console.log('Error 9');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 9.");
            });

          };

          $scope.CallSiteDetail = function(SITENAME, ID) {
            localStorage.ActiveSITENAME = SITENAME;
            localStorage.ActiveSITEID = ID;
            window.location = 'details-id.html';
          }

        }])

        .controller('ctrlCubeCustomerAppHome', ['$scope', '$http', '$loading', '$uibModal', function ($scope, $http, $loading, $uibModal) {

          $scope.User = {};
          $scope.User.name = '';
          $scope.User.password = '';
          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          function getArray(object){
              if (Array.isArray(object)){
                return object;
              }
              else{
                return [object]
              }
          }

          $scope.GetWorkOrderDetail = function(WorkOrderId){
            $loading.start('myloading');
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceInfo","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
              $scope.WorkOrder = response.data.CubeFlexIntegration.DATA;
              $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceDetails_Customer","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
                $scope.WorkOrderDetail = getArray(response.data.CubeFlexIntegration.DATA);
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceRecomendations","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
                  $loading.finish('myloading');
                  $scope.WorkOrderRecomendation = getArray(response.data.CubeFlexIntegration.DATA);
                })
                .catch(function (data) {
                  console.log('Error 20');
                  console.log(data);
                  swal("Cube Service", "Unexpected error. Check console Error 20.");
                });
              })
              .catch(function (data) {
                console.log('Error 21');
                console.log(data);
                swal("Cube Service", "Unexpected error. Check console Error 21.");
              });
            })
            .catch(function (data) {
              console.log('Error 22');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 22.");
            });
          }

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.CloseSession = function(){
            delete localStorage.cnnData2;
            window.location = 'index.html';
          }

          var headers = {"Authorization": ServerAuth};

          if (typeof localStorage.cnnData2 != 'undefined'){

            $loading.start('myloading');

            var cnnData = JSON.parse(localStorage.cnnData2);
            $scope.cnnnData2 = cnnData;

            $scope.NameUser = cnnData.Name;
            localStorage.NameUser = $scope.NameUser;

            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_EmployeeID","conncode":"' + cnnData.DBNAME + '","masteruserid":"' + cnnData.ID + '"}', {headers: headers}).then(function (response) {

                var EmployeeData = response.data.CubeFlexIntegration.DATA;
                $scope.EmployeeData = EmployeeData;

                localStorage.EmployeeData = JSON.stringify(EmployeeData);

                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {

                  var CustomerData = response.data.CubeFlexIntegration.DATA;
                  $scope.CustomerData = getArray(response.data.CubeFlexIntegration.DATA);

                  if (typeof CustomerData != 'undefined'){
                    CustomerData.Schedule_Date = new Date(CustomerData.Schedule_Date);
                  }

                  // Get service sites for customer to populate select sites in create new order
                  $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Sites_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
                    $scope.CustomerSites = getArray(response.data.CubeFlexIntegration.DATA);
                    $scope.CustomerSitesFiltered = $scope.CustomerSites;
                  })
                  .catch(function (data) {
                    console.log('Error 27');
                    console.log(data);
                    swal("Cube Service", "Unexpected error. Check console Error 27.");
                  });

                  // GetPriorities to populate select Priorities in create new order
                  $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePriority","conncode":"' + cnnData.DBNAME + '"}', {headers: headers}).then(function (response) {
                    $scope.Priorities = getArray(response.data.CubeFlexIntegration.DATA);
                  })
                  .catch(function (data) {
                    console.log('Error 28');
                    console.log(data);
                    swal("Cube Service", "Unexpected error. Check console Error 28.");
                  });

                  $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Count_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {

                    $scope.ServiceCountCustomer = response.data.CubeFlexIntegration.DATA;

                    // Get Knowleges for home
                    $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_MessagesBoard","conncode":"' + cnnData.DBNAME + '"}', {headers: headers}).then(function (response) {
                      $scope.Knowleges = getArray(response.data.CubeFlexIntegration.DATA);
                    })
                    .catch(function (data) {
                      console.log('Error 26');
                      console.log(data);
                      swal("Cube Service", "Unexpected error. Check console Error 26.");
                    });

                    $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceOpen_Recomendations","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {

                      $scope.Recomendations = getArray(response.data.CubeFlexIntegration.DATA);

                      $loading.finish('myloading');

                      $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_User_DashboardConf","conncode":"' + cnnData.DBNAME + '", "userid":"' + $scope.cnnnData2.ID + '"}', {headers: headers}).then(function (response) {
                        var lRows = getArray(response.data.CubeFlexIntegration.DATA);
                        if (typeof lRows[0] == 'undefined'){
                          $scope.Rows = [
                              {
                                  Columns: [
                                      {ID: 4, name: "Tabla 1", type: "man", page: "table-order-list.html", title: "Open Service Work Orders List"},
                                      {ID: 5, name: "Tabla 2", type: "man", page: "table-knowlege.html", title:"Knowledge Base Articles"},
                                      {ID: 6, name: "Tabla 3", type: "woman", page: "table-recomendations.html", title: "Open Recommendations on you sites"},
                                  ]
                              }
                          ];
                        }
                        else{
                          try {
                            $scope.Rows = [
                                {
                                    Columns: _.uniqBy(JSON.parse(lRows[0].CONFIGURATION.replace(/@@@/gi, '"'))[0].Columns, 'page')
                                }
                            ];
                          }
                          catch(err) {
                            $scope.Rows = [
                                {
                                    Columns: [
                                        {ID: 4, name: "Tabla 1", type: "man", page: "table-order-list.html", title: "Open Service Work Orders List"},
                                        {ID: 5, name: "Tabla 2", type: "man", page: "table-knowlege.html", title:"Knowledge Base Articles"},
                                        {ID: 6, name: "Tabla 3", type: "woman", page: "table-recomendations.html", title: "Open Recommendations on you sites"},
                                    ]
                                }
                            ];
                          }
                        }
                      })
                      .catch(function (data) {
                        console.log('Error 1');
                        console.log(data);
                        swal("Cube Service", "Unexpected error. Check console Error 1.");
                      });

                    })
                    .catch(function (data) {
                      console.log('Error 2');
                      console.log(data);
                      swal("Cube Service", "Unexpected error. Check console Error 2.");
                    });

                  })
                  .catch(function (data) {
                    console.log('Error 3');
                    console.log(data);
                    swal("Cube Service", "Unexpected error. Check console Error 3.");
                  });


                })
                .catch(function (data) {
                  console.log('Error 5');
                  console.log(data);
                  swal("Cube Service", "Unexpected error. Check console Error 5.");
                });


            })
            .catch(function (data) {
              console.log('Error 6');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 6.");
            });

          }
          else{
            window.location = 'index.html';
          }

          $scope.AddWidget = function(WidgetId){
            $scope.Rows[0].Columns.push($scope.ListRows[WidgetId])
            localStorage.Rows = JSON.stringify($scope.Rows);

            var jsonFormatted = localStorage.Rows.replace(/"/gi, "@@@");

            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Save_User_DashboardConf","conncode":"' + cnnData.DBNAME + '", "userid":"' + $scope.cnnnData2.ID + '", "configuration": "' + jsonFormatted + '"}', {headers: headers}).then(function (response) {
            })
            .catch(function (data) {
              console.log('Error 7');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 7.");
            });

          }

          $scope.ListRows = [{ID: 1, name: "Tabla 1", type: "man", page: "table-order-list.html", title: "Open Service Work Orders List"},
          {ID: 2, name: "Tabla 2", type: "man", page: "table-knowlege.html", title:"Knowledge Base Articles"},
          {ID: 3, name: "Tabla 3", type: "woman", page: "table-recomendations.html", title: "Open Recommendations on you sites"}]

          $scope.SearchSites = function(){

            $scope.CustomerSitesFiltered = $scope.CustomerSites;

            $scope.CustomerSitesFiltered = $scope.CustomerSitesFiltered.filter(function (el){
              return el.SITENAME.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1;
            })

          }

          $scope.DropHomeTable = function(tablename) {
            $scope.Rows[0].Columns = $scope.Rows[0].Columns.filter(function(el){
              return el.page != tablename;
            })
            localStorage.Rows = JSON.stringify($scope.Rows);

            var jsonFormatted = localStorage.Rows.replace(/"/gi, "@@@");

            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Save_User_DashboardConf","conncode":"' + cnnData.DBNAME + '", "userid":"' + $scope.cnnnData2.ID + '", "configuration": "' + jsonFormatted + '"}', {headers: headers}).then(function (response) {
            })
            .catch(function (data) {
              console.log('Error 8');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 8.");
            });

          };

          $scope.CustomerPO = '';
          $scope.ReasonForService = '';

          $scope.CreateOrder = function() {
            // Call method to create order
            var headers = {"Authorization": ServerAuth};
            var cnnData = JSON.parse(localStorage.cnnData2);

            if (typeof $scope.selectedCustomerSite == 'undefined' || $scope.CustomerPO.trim() == '' || typeof $scope.selectedPriority == 'undefined' || $scope.ReasonForService.trim() == '') {
                swal("Cube Service", "You must fill all fields.");
                return 0;
            }

            $scope.CreateDisabled = true;

            var urlRq = connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"SaveServiceInfo_Customer","conncode":"' + cnnData.DBNAME + '","siteid":"' + $scope.selectedCustomerSite.ID + '", "customerpo": "' + $scope.CustomerPO + '", "priorityid": "' + $scope.selectedPriority.ID + '", "reasonforservice": "' + $scope.ReasonForService + '", "reqbyid": "' + $scope.cnnnData2.ID + '"}';

            $loading.start('myloading');
            $http.get(urlRq, {headers: headers}).then(function (response) {
              if (response.data.responseCode.substring(0, 3) == '200'){
                $scope.CustomerPO = '';
                $scope.ReasonForService = '';
                $scope.selectedCustomerSite = undefined;
                $scope.selectedPriority = undefined;
                // Refresh Services
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + $scope.EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
                  $scope.CustomerData = getArray(response.data.CubeFlexIntegration.DATA);
                  $scope.ServiceCountCustomer.OIP = $scope.ServiceCountCustomer.OIP + 1;


                  // Refresh Services Count
                  $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Count_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + $scope.EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {

                    $scope.ServiceCountCustomer = response.data.CubeFlexIntegration.DATA;

                    $loading.finish('myloading');
                    swal("Cube Service", "Service was created.");
                    $scope.CreateDisabled = false;

                    // Close modal
                    $('#create_order').modal('hide');
                  })

                })

              }
            })
            .catch(function (data) {
              console.log('Error 9');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 9.");
            });


          };

          $scope.DragFinish = function(index, item, external) {
            $scope.Rows[0].Columns = _.uniqBy($scope.Rows[0].Columns, 'ID');
            localStorage.Rows = JSON.stringify($scope.Rows);

            var jsonFormatted = localStorage.Rows.replace(/"/gi, "@@@");

            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Save_User_DashboardConf","conncode":"' + cnnData.DBNAME + '", "userid":"' + $scope.cnnnData2.ID + '", "configuration": "' + jsonFormatted + '"}', {headers: headers}).then(function (response) {
            })
            .catch(function (data) {
              console.log('Error 10');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 10.");
            });

          };

        }])

        .controller('ctrlCubeCustomerAppLogin', ['$scope', '$http', '$loading', '$uibModal', function ($scope, $http, $loading, $uibModal) {

          $scope.User = {};
          $scope.User.name = '';
          $scope.User.password = '';
          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          function getArray(object){
              if (Array.isArray(object)){
                return object;
              }
              else{
                return [object]
              }
          }

          // Connect Cube Service
          $scope.Login = function(){

            $loading.start('myloading');

            $http.get(connServiceString + 'CubeClientAuthentication.ashx?obj={"username":"' + $scope.User.name + '","password":"' + $scope.User.password + '"}', {headers: headers}).then(function (response) {
                var cnnData2 = response.data.CubeAuthentication.DATA;

                if (typeof cnnData2 == 'undefined'){
                  $loading.finish('myloading');
                  swal("Cube Interface", "Invalid Credentials.");
                }
                else{
                  localStorage.cnnData2 = JSON.stringify(cnnData2);
                  window.location = 'home.html';
                }

            })
            .catch(function (data) {
              console.log('Error 23');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 23.");
            });

          }

          var headers = {"Authorization": ServerAuth};

        }])

        .controller('ctrlCubeCustomerAppActiveProjects', ['$scope', '$http', '$loading', '$uibModal', function ($scope, $http, $loading, $uibModal) {

          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.User = {};
          $scope.User.name = '';
          $scope.User.password = '';
          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          var cnnData = JSON.parse(localStorage.cnnData2);
          $scope.cnnnData2 = cnnData;
          var EmployeeData = JSON.parse(localStorage.EmployeeData);
          $scope.NameUser = cnnData.Name;

          function getArray(object){
              if (Array.isArray(object)){
                return object;
              }
              else{
                return [object]
              }
          }

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.CloseSession = function(){
            delete localStorage.cnnData2;
            window.location = 'index.html';
          }

          var headers = {"Authorization": ServerAuth};

          if (typeof localStorage.cnnData2 != 'undefined'){


            // Get service sites for customer to populate select sites in create new order
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_ProjectsCust","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
              $scope.CustomerSites = getArray(response.data.CubeFlexIntegration.DATA);
              $scope.CustomerSitesFiltered = $scope.CustomerSites;
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // Get service sites for customer to populate select sites in create new order
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Sites_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
              $scope.CustomerSitesCombo = getArray(response.data.CubeFlexIntegration.DATA);
              $scope.CustomerSitesComboFiltered = $scope.CustomerSitesCombo;
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // GetPriorities to populate select Priorities in create new order
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePriority","conncode":"' + cnnData.DBNAME + '"}', {headers: headers}).then(function (response) {
              $scope.Priorities = getArray(response.data.CubeFlexIntegration.DATA);
            })
            .catch(function (data) {
              console.log('Error 28');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 28.");
            });
          }
          else{
            window.location = 'index.html';
          }

          $scope.SearchSites = function(){

            $scope.CustomerSitesFiltered = $scope.CustomerSites;

            $scope.CustomerSitesFiltered = $scope.CustomerSitesFiltered.filter(function (el){
              return el.Name.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1;
            })

          }

          $scope.CustomerPO = '';
          $scope.ReasonForService = '';

          $scope.CreateOrder = function() {
            // Call method to create order
            var headers = {"Authorization": ServerAuth};
            var cnnData = JSON.parse(localStorage.cnnData2);

            if (typeof $scope.selectedCustomerSite == 'undefined' || $scope.CustomerPO.trim() == '' || typeof $scope.selectedPriority == 'undefined' || $scope.ReasonForService.trim() == '') {
                swal("Cube Service", "You must fill all fields.");
                return 0;
            }

            $scope.CreateDisabled = true;

            var urlRq = connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"SaveServiceInfo_Customer","conncode":"' + cnnData.DBNAME + '","siteid":"' + $scope.selectedCustomerSite.ID + '", "customerpo": "' + $scope.CustomerPO + '", "priorityid": "' + $scope.selectedPriority.ID + '", "reasonforservice": "' + $scope.ReasonForService + '", "reqbyid": "' + $scope.cnnnData2.ID + '"}';

            $loading.start('myloading');
            $http.get(urlRq, {headers: headers}).then(function (response) {
              if (response.data.responseCode.substring(0, 3) == '200'){
                $scope.CustomerPO = '';
                $scope.ReasonForService = '';
                $scope.selectedCustomerSite = undefined;
                $scope.selectedPriority = undefined;
                // Refresh Services
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
                  $scope.CustomerData = getArray(response.data.CubeFlexIntegration.DATA);
                  $loading.finish('myloading');
                  swal("Cube Service", "Service was created.");
                  $scope.CreateDisabled = false;

                  // Close modal
                  $('#create_order').modal('hide');
                })

              }
            })
            .catch(function (data) {
              console.log('Error 9');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 9.");
            });

          };

        }])

        .controller('ctrlCubeCustomerAppSiteDetails', ['$scope', '$http', '$loading', '$uibModal', function ($scope, $http, $loading, $uibModal) {

          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.ActiveSITENAME = localStorage.ActiveSITENAME;
          $scope.SearchText = '';

          var date = new Date();
          $scope.fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
          $scope.toDate = new Date();
          $scope.toDate.setDate($scope.toDate.getDate()+1);

          $scope.User = {};
          $scope.User.name = '';
          $scope.User.password = '';
          $scope.ShowSideBar = true;
          $scope.LeftMenu = 'left-side sidebar-offcanvas';
          $scope.RightMenu = 'right-side';

          var cnnData = JSON.parse(localStorage.cnnData2);
          $scope.cnnnData2 = cnnData;
          var EmployeeData = JSON.parse(localStorage.EmployeeData);
          $scope.NameUser = cnnData.Name;

          function getArray(object){
              if (Array.isArray(object)){
                return object;
              }
              else{
                return [object]
              }
          }

          $scope.HideMenu = function(){
            if ($scope.ShowSideBar == false){
              $scope.LeftMenu = 'left-side sidebar-offcanvas';
              $scope.RightMenu = 'right-side';
              $scope.ShowSideBar = true;
            }
            else{
              $scope.LeftMenu = 'left-side sidebar-offcanvas collapse-left';
              $scope.RightMenu = 'right-side strech';
              $scope.ShowSideBar = false;
            }
          }

          $scope.CloseSession = function(){
            delete localStorage.cnnData2;
            window.location = 'index.html';
          }

          $scope.CreatePunch = function(){
            // Save punch
            $scope.newPunchResponsible = '';

            $scope.CreateDisabled = true;

            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"SaveServicePunchItem","conncode":"' + cnnData.DBNAME + '","servicesiteid":"' + localStorage.ActiveSITEID + '", "name":"' + $scope.newPunchItemName + '", "Responsible":"' + $scope.newPunchResponsible + '", "notes":"' + $scope.newPunchNotes + '"}', {headers: headers}).then(function (response) {
              $scope.newPunchProject = "";
              $scope.newPunchItemName = "";
              $scope.newPunchResponsible = "";
              $scope.newPunchNotes = "";
              $scope.loadPunches();
              swal("Cube Service", "Service Punch was saved.");
              $scope.CreateDisabled = false;
              // Close modal
              $('#new_open_item').modal('hide');
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });
          }

          var headers = {"Authorization": ServerAuth};

          if (typeof localStorage.cnnData2 != 'undefined'){


            // Get Site Detail Master
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_SiteInfo","conncode":"' + cnnData.DBNAME + '","siteid":"' + localStorage.ActiveSITEID + '"}', {headers: headers}).then(function (response) {
              $scope.SiteDetail = getArray(response.data.CubeFlexIntegration.DATA);
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // Get service sites History
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_ServiceSite_History","conncode":"' + cnnData.DBNAME + '","siteid":"' + localStorage.ActiveSITEID + '"}', {headers: headers}).then(function (response) {
              $scope.SiteHistory = getArray(response.data.CubeFlexIntegration.DATA);

              if (typeof $scope.SiteHistory != 'undefined'){
                $scope.SiteHistory.forEach(function(element) {
                  element.Schedule_Date = new Date(element.Schedule_Date);
                });
              }

              $scope.SiteHistoryFiltered = $scope.SiteHistory;

              $scope.SearchWOL();

            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // Get service sites Punch
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePunchList","conncode":"' + cnnData.DBNAME + '","serviceid":"' + localStorage.ActiveSITEID + '"}', {headers: headers}).then(function (response) {
              $scope.SitePunch = getArray(response.data.CubeFlexIntegration.DATA);
              $scope.SitePunchFiltered = $scope.SitePunch;
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // Get service sites Reccomendations
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceSiteOpen_Recomendations","conncode":"' + cnnData.DBNAME + '","siteid":"' + localStorage.ActiveSITEID + '"}', {headers: headers}).then(function (response) {
              $scope.SiteRecomendations = getArray(response.data.CubeFlexIntegration.DATA);
              $scope.SiteRecomendationsFiltered = $scope.SiteRecomendations;
            })
            .catch(function (data) {
              console.log('Error 27');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            // Get service sites Fault
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceSiteFaultDet","conncode":"' + cnnData.DBNAME + '","siteid":"3066"}', {headers: headers}).then(function (response) {

              $scope.SiteFaults = getArray(response.data.CubeFlexIntegration.DATA);
              $scope.SiteFaultsFiltered = $scope.SiteFaults;

            })
            .catch(function (data) {
              swal("Cube Service", "Unexpected error. Check console Error 27.");
            });

            $scope.loadPunches = function(){
              // Get service sites Punch
              $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePunchList","conncode":"' + cnnData.DBNAME + '","serviceid":"' + localStorage.ActiveSITEID + '"}', {headers: headers}).then(function (response) {
                $scope.SitePunch = getArray(response.data.CubeFlexIntegration.DATA);
                $scope.SitePunchFiltered = $scope.SitePunch;

                $scope.SitePunchFiltered = $scope.SitePunchFiltered.filter(function (el){
                  return ((el.ITEMNAME.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1 || el.ITEMNAME.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1));
                })

              })
              .catch(function (data) {
                console.log('Error 27');
                console.log(data);
                swal("Cube Service", "Unexpected error. Check console Error 27.");
              });
            }

            $scope.loadPunches();

            $scope.SearchWOL = function(){

              if (!$scope.ValidaDate($scope.fromDate) || !$scope.ValidaDate($scope.toDate)){
                $scope.SiteHistoryFiltered = [];
                return 0;
              }

              $scope.SiteHistoryFiltered = $scope.SiteHistory;

              var dt = new Date($scope.toDate.getFullYear(), $scope.toDate.getMonth(), $scope.toDate.getDate(), 23, 59, 59);
              $scope.toDate = dt;

              $scope.SiteHistoryFiltered = $scope.SiteHistoryFiltered.filter(function (el){
                return (el.Schedule_Date > $scope.fromDate && el.Schedule_Date <= $scope.toDate);
              })

            }

            // GetPriorities to populate select Priorities in create new order
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServicePriority","conncode":"' + cnnData.DBNAME + '"}', {headers: headers}).then(function (response) {
              $scope.Priorities = getArray(response.data.CubeFlexIntegration.DATA);
            })
            .catch(function (data) {
              console.log('Error 28');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 28.");
            });
          }
          else{
            window.location = 'index.html';
          }

          // Get service sites for customer to populate select sites in create new order
          $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Sites_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
            $scope.CustomerSites = getArray(response.data.CubeFlexIntegration.DATA);
            $scope.CustomerSitesFiltered = $scope.CustomerSites;
          })
          .catch(function (data) {
            console.log('Error 27');
            console.log(data);
            swal("Cube Service", "Unexpected error. Check console Error 27.");
          });

          $scope.SearchSites = function(){

            $scope.CustomerSitesFiltered = $scope.CustomerSites;

            $scope.CustomerSitesFiltered = $scope.CustomerSitesFiltered.filter(function (el){
              return el.Name.toUpperCase().indexOf($scope.SearchText.toUpperCase()) > -1;
            })

          }

          $scope.CustomerPO = '';
          $scope.ReasonForService = '';

          $scope.CreateOrder = function() {
            // Call method to create order
            var headers = {"Authorization": ServerAuth};
            var cnnData = JSON.parse(localStorage.cnnData2);

            if (typeof $scope.selectedCustomerSite == 'undefined' || $scope.CustomerPO.trim() == '' || typeof $scope.selectedPriority == 'undefined' || $scope.ReasonForService.trim() == '') {
                swal("Cube Service", "You must fill all fields.");
                return 0;
            }

            $scope.CreateDisabled = true;

            var urlRq = connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"SaveServiceInfo_Customer","conncode":"' + cnnData.DBNAME + '","siteid":"' + $scope.selectedCustomerSite.ID + '", "customerpo": "' + $scope.CustomerPO + '", "priorityid": "' + $scope.selectedPriority.ID + '", "reasonforservice": "' + $scope.ReasonForService + '", "reqbyid": "' + $scope.cnnnData2.ID + '"}';

            $loading.start('myloading');
            $http.get(urlRq, {headers: headers}).then(function (response) {
              if (response.data.responseCode.substring(0, 3) == '200'){
                $scope.CustomerPO = '';
                $scope.ReasonForService = '';
                $scope.selectedCustomerSite = undefined;
                $scope.selectedPriority = undefined;
                // Refresh Services
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"Get_Services_Customer","conncode":"' + cnnData.DBNAME + '","customerid":"' + EmployeeData.EMPLOYEEID + '"}', {headers: headers}).then(function (response) {
                  $scope.CustomerData = getArray(response.data.CubeFlexIntegration.DATA);
                  $loading.finish('myloading');
                  swal("Cube Service", "Service was created.");
                  $scope.CreateDisabled = false;
                  // Close modal
                  $('#create_order').modal('hide');
                })

              }
            })
            .catch(function (data) {
              console.log('Error 9');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 9.");
            });

          };

          $scope.GetWorkOrderDetail = function(WorkOrderId){
            $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceInfo","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
              $scope.WorkOrder = response.data.CubeFlexIntegration.DATA;
              $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceDetails_Customer","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
                $scope.WorkOrderDetail = getArray(response.data.CubeFlexIntegration.DATA);
                $http.get(connServiceString + 'CubeFlexIntegration.ashx?obj={"method":"GetServiceRecomendations","conncode":"' + cnnData.DBNAME + '","serviceid":"' + WorkOrderId + '"}', {headers: headers}).then(function (response) {
                  $scope.WorkOrderRecomendation = getArray(response.data.CubeFlexIntegration.DATA);
                })
                .catch(function (data) {
                  console.log('Error 12');
                  console.log(data);
                  swal("Cube Service", "Unexpected error. Check console Error 12.");
                });
              })
              .catch(function (data) {
                console.log('Error 13');
                console.log(data);
                swal("Cube Service", "Unexpected error. Check console Error 13.");
              });
            })
            .catch(function (data) {
              console.log('Error 14');
              console.log(data);
              swal("Cube Service", "Unexpected error. Check console Error 14.");
            });
          }

          // Data Validate
          $scope.ValidaDate = function(dDate){
            if ( Object.prototype.toString.call(dDate) === "[object Date]" ) {
              if ( isNaN( dDate.getTime() ) ) {
                return false;
              }
              else {
                return true;
              }
            }
            else {
              return false;
            }
          }
          // End Data Validate

          // Date Control Functions
          $scope.today = function() {
            $scope.dt = new Date();
          };
          $scope.today();

          $scope.clear = function() {
            $scope.dt = null;
          };

          $scope.inlineOptions = {
            customClass: getDayClass,
            minDate: new Date(),
            showWeeks: true
          };

          $scope.dateOptions = {
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
          };

          // Disable weekend selection
          function disabled(data) {
            var date = data.date,
              mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
          }
          $scope.toggleMin = function() {
            $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
            $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
          };
          $scope.toggleMin();
          $scope.open1 = function() {
            $scope.popup1.opened = true;
          };
          $scope.open2 = function() {
            $scope.popup2.opened = true;
          };
          $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
          };
          $scope.formats = ['MM-dd-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
          $scope.format = $scope.formats[0];
          $scope.altInputFormats = ['M!/d!/yyyy'];
          $scope.popup1 = {
            opened: false
          };
          $scope.popup2 = {
            opened: false
          };
          var tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          var afterTomorrow = new Date();
          afterTomorrow.setDate(tomorrow.getDate() + 1);
          $scope.events = [
            {
              date: tomorrow,
              status: 'full'
            },
            {
              date: afterTomorrow,
              status: 'partially'
            }
          ];
          function getDayClass(data) {
            var date = data.date,
              mode = data.mode;
            if (mode === 'day') {
              var dayToCheck = new Date(date).setHours(0,0,0,0);

              for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

                if (dayToCheck === currentDay) {
                  return $scope.events[i].status;
                }
              }
            }

            return '';
          }
          // End Date Control Functions

        }])
