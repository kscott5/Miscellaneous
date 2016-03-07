'use strict';

const OrgiCStar = require('./lib/OrgiCStar');
var org = new OrgiCStar();

console.log('AB5, BC4, CD8, DC8, DE6, AD5, CE2, EB3, AE7');
org.initializeGraph('AB5, BC4, CD8, DC8, DE6, AD5, CE2, EB3, AE7');


console.log(org.routePath('A-B-C'));
console.log(org.routePath('A-D'));
console.log(org.routePath('A-D-C'));
console.log(org.routePath('A-E-B-C-D'));
console.log(org.routePath('A-E-D'));
console.log(org.routePath({startNodeId:'C', endNodeId: 'C', comparer: function(comparerArgs) { return comparerArgs.nodesInPath<=3;}}));
console.log(org.routePath({startNodeId:'A', endNodeId: 'C', shortestRoute: false, comparer: function(comparerArgs) { return comparerArgs.nodesInPath==4;}}));
console.log(org.routePath({startNodeId:'A', endNodeId: 'C', shortestRoute: true}));
console.log(org.routePath({startNodeId:'B', endNodeId: 'B', shortestRoute: true}));


