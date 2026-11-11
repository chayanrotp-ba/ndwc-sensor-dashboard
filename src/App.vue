<script setup>
import { referenceComponent } from './runtime.js';
import StationQrModal from './components/StationQrModal.vue';
import StationQrPage from './components/StationQrPage.vue';
import StationPage from './components/StationPage.vue';
import CriteriaResults from './components/CriteriaResults.vue';
import CriteriaComparison from './components/CriteriaComparison.vue';
import CentralWarningEditor from './components/CentralWarningEditor.vue';
import StationThresholdEditor from './components/StationThresholdEditor.vue';
import MasterDataPanel from './components/MasterDataPanel.vue';
import BackofficeMenu from './components/BackofficeMenu.vue';
import CriteriaNavigation from './components/CriteriaNavigation.vue';
import backofficeResponsive from './backoffice-responsive.css?raw';
import ExactLogic from './components/Exact.js';
import StationsLogic from './components/Stations.js';
import ReadingCardsLogic from './components/ReadingCards.js';
import LineRulesLogic from './components/LineRules.js';
import exact from './components/Exact.html?raw';
import stations from './components/Stations.html?raw';
import readings from './components/ReadingCards.html?raw';
import rules from './components/LineRules.html?raw';
const qrCode = new URLSearchParams(location.search).get('qr');
const stationCode = new URLSearchParams(location.search).get('station');
const registry = {};
registry.StationQrModal = StationQrModal;
registry.MasterDataPanel = MasterDataPanel;
registry.BackofficeMenu = BackofficeMenu;
registry.CriteriaNavigation = CriteriaNavigation;
registry.CriteriaResults = CriteriaResults;
registry.CriteriaComparison = CriteriaComparison;
registry.CentralWarningEditor = CentralWarningEditor;
registry.StationThresholdEditor = StationThresholdEditor;
registry.ReadingCards = referenceComponent('ReadingCards', readings, ReadingCardsLogic, registry);
registry.LineRules = referenceComponent('LineRules', rules, LineRulesLogic, registry);
registry.Stations = referenceComponent('Stations', stations, StationsLogic, registry);
const Dashboard = referenceComponent('RainfallDashboard', exact, ExactLogic, registry);
const responsiveStyle = document.getElementById('backoffice-responsive') || document.createElement('style');
responsiveStyle.id = 'backoffice-responsive';
responsiveStyle.textContent = backofficeResponsive;
document.head.append(responsiveStyle);
</script>

<template><StationQrPage v-if="qrCode" :code="qrCode" /><StationPage v-else-if="stationCode" :code="stationCode" /><Dashboard v-else /></template>
