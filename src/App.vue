<script setup>
import { referenceComponent } from './runtime.js';
import CriteriaResults from './components/CriteriaResults.vue';
import CriteriaComparison from './components/CriteriaComparison.vue';
import ThresholdWorkspace from './components/ThresholdWorkspace.vue';
import ExactLogic from './components/Exact.js';
import StationsLogic from './components/Stations.js';
import ReadingCardsLogic from './components/ReadingCards.js';
import LineRulesLogic from './components/LineRules.js';
import exact from './components/Exact.html?raw';
import stations from './components/Stations.html?raw';
import readings from './components/ReadingCards.html?raw';
import rules from './components/LineRules.html?raw';
const registry = {};
registry.CriteriaResults = CriteriaResults;
registry.CriteriaComparison = CriteriaComparison;
registry.ThresholdWorkspace = ThresholdWorkspace;
registry.ReadingCards = referenceComponent('ReadingCards', readings, ReadingCardsLogic, registry);
registry.LineRules = referenceComponent('LineRules', rules, LineRulesLogic, registry);
registry.Stations = referenceComponent('Stations', stations, StationsLogic, registry);
const Dashboard = referenceComponent('RainfallDashboard', exact, ExactLogic, registry);
</script>

<template><Dashboard /></template>
