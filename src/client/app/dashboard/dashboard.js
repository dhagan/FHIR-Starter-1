﻿(function () {
    'use strict';

    var controllerId = 'dashboard';

    angular.module('FHIRStarter').controller(controllerId, ['common', 'conformanceService', 'fhirServers', dashboard]);

    function dashboard(common, conformanceService, fhirServers) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var vm = this;

        vm.activeServer = null;
        vm.busyMessage = "Contacting remote server ...";
        vm.cacheInfo = null;
        vm.changeServer = changeServer;
        vm.conformance = null;
        vm.isBusy = false;
        vm.servers = [];
        vm.title = 'Dashboard';

        activate();

        function activate() {
            var promises = [getServers(), getActiveServer()];
            common.activateController(promises, controllerId)
                .then(function () {
                    if (vm.activeServer) {
                        fetchConformance(vm.activeServer);
                    }
                });
        }

        function changeServer(id) {
            toggleSpinner(true);
            conformanceService.clearCache();
            fhirServers.getServerById(id)
                .then(function (selectedServer) {
                    log('Updated active server to ' + selectedServer.name);
                    return vm.activeServer = selectedServer;
                }, function (error) {
                    log('Error ' + error);
                    toggleSpinner(false);
                })
                .then(setActiveServer)
                .then(fetchConformance)
                .then(function () {
                    toggleSpinner(false);
                });
        }

        function fetchConformance(server) {
            if (server) {
                conformanceService.getConformance(server.baseUrl)
                    .then(function (conformance) {
                        log('Loaded conformance statement for ' + vm.activeServer.name);
                        return vm.conformance = conformance;
                    });
            }
        }

        function getActiveServer() {
            fhirServers.getActiveServer()
                .then(function (server) {
                    return vm.activeServer = server;
                });
        }

        function getServers() {
            fhirServers.getAllServers()
                .then(function (servers) {
                    return vm.servers = servers;
                });
        }

        function setActiveServer(server) {
            fhirServers.setActiveServer(server);
            return server;
        }

        function toggleSpinner(on) {
            vm.isBusy = on;
        }
    }
})();