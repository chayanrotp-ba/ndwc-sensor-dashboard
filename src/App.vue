<script setup>
import { referenceComponent } from './runtime.js';
import CriteriaResults from './components/CriteriaResults.vue';
import CriteriaComparison from './components/CriteriaComparison.vue';
import StationThresholdEditor from './components/StationThresholdEditor.vue';
import BackofficeMenu from './components/BackofficeMenu.vue';
import backofficeResponsive from './backoffice-responsive.css?raw';
import ExactLogic from './components/Exact.js';
import StationsLogic from './components/Stations.js';
import ReadingCardsLogic from './components/ReadingCards.js';
import LineRulesLogic from './components/LineRules.js';
import exact from './components/Exact.html?raw';
import stations from './components/Stations.html?raw';
import readings from './components/ReadingCards.html?raw';
import rules from './components/LineRules.html?raw';
const registry = {};
registry.BackofficeMenu = BackofficeMenu;
registry.CriteriaResults = CriteriaResults;
registry.CriteriaComparison = CriteriaComparison;
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

<template><Dashboard /></template>
