angular.element(function() {
    angular.bootstrap(document, ['WarrantyModule']);
});

angular.module('WarrantyModule', ['ng-draggable-widgets'])

        .controller('ctrlWarrantyLogin', ['$scope', function ($scope) {
          // Temp
          var widgets = [
            {
              title:'Cats with Woks',
              mas:true,
              solouno:1,
              class: 'woks'
            },
            {
              title:'Socks on Sticks',
              mas:true,
              solouno:2,
              class: 'socks'
            },
            {
              title:'Mocks of Macs',
              mas:true,
              solouno:3,
              class: 'mocks'
            },
            {
              title:'Pops in Pumps',
              mas:true,
              solouno:4,
              class: 'pops'
            },
            {
              title:'Hocks of Rumps',
              mas:true,
              solouno:5,
              class: 'hocks'
            }
          ];
          $scope.widgets = widgets;
          $scope.moveWidget = function(drag) {
            console.log('DALEEEEEEEEEEEEEEEEEEEEEEEEEEE');
            console.log($scope.widgets);
          }
          // Fin Temp

        }])
