'use strict';

const OrgiCStar = require('../lib/OrgiCStar')
var org = new OrgiCStar();

org.initializeGraph('AB5, BC4, CD8, DC8, DE6, AD5, CE2, EB3, AE7');

console.log(org.routeCompletePath('A-B-C'));
console.log(org.routeCompletePath('A-D'));
console.log(org.routeCompletePath('A-D-C'));
console.log(org.routeCompletePath('A-E-B-C-D'));
console.log(org.routeCompletePath('A-E-D'));
console.log(org.routeAllPathsThatStartEndWith('C', 'C', function(nodesInPath) { return nodesInPath<=3;}));

console.log(org.routeAllPathsThatStartEndWith('A', 'C', function(nodesInPath) { return nodesInPath==4;}));

console.log(org.routeAllPathsThatStartEndWith('A', 'C', function(nodesInPath) { return nodesInPath>1;}));

