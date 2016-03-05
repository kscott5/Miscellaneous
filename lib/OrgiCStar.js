'use strict';

const GRAPH = require('node-dijkstra');

const NO_SUCH_ROUTE_MSG = 'NO SUCH ROUTE';
const SUCCESS_MSG = "Completed Successfully!"

function GraphResults(input, outputIsArray) {
    this.input = input;
    this.output = (!outputIsArray)? '': [];
    this.message = '';
    this.numberOfTrips = 0;
    this.travelCost = (!outputIsArray)? 0: [];
    this.travelStops = 0;
    this.valid = false;
    this.consolidated = (!outputIsArray)? 'this': [];
};

GraphResults.prototype.validate = function(output) {
    var self = this;
    self.travelStops = 0;
    
    switch(typeof self.output) {
        case 'string':                
            if(!output && output != self.input) {
                self.travelCost = 0;
                break;
            }
            
            self.output = output;
            self.travelStops = self.output.split('-').length-1;
            self.numberOfTrips = 1;
            break;
            
        default:
            self.travelStops = [];
            self.output.forEach(function(node, index){					
                self.travelStops[index] = node.split('-').length-1;
            });
            
            self.consolidated = [];
            self.output.forEach(function(value, index, thisArray){
                var graph = new GraphResults(value);
                graph.travelCost = self.travelCost[index];
                graph.validate(value);
                
                self.consolidated.push(graph);
            });
            
            self.consolidated;                
            self.numberOfTrips = self.output.length;
            break;				
    }

    self.valid = self.output.length > 0;
    self.message = NO_SUCH_ROUTE_MSG;
    
    if(self.valid) self.message = SUCCESS_MSG;
        
    return self.valid;
}; // end GraphResults.prototype.validate

/**
* Calculates the cost for the routing the path through the graph
*
* @param {string} [route] - hypen delimited string of nodes (A-B-D-C) used to compute the cost
* 		of the route through the graph using each node. In this case A-B, B-D, D-C...
*/
function findTravelPath(route, parent) {
    // Route is well defined. Use graph directly. 
    var inputTransformed = route.toUpperCase().split('-');	 // Use regular expression to split

    var results = new GraphResults(route);
    
    if(inputTransformed.length < 2) {
        results.validate();
        return results;
    }

    var startNodeId, endNodeId, output;
    for(var i=0; i<inputTransformed.length-1; i++) {            
        // Get start and end point for the user's route
        startNodeId = inputTransformed[i];
        endNodeId = inputTransformed[i+1];
        
        var node = parent.route.graph.get(startNodeId);
        var travelCost = node.get(endNodeId);
        if(!travelCost) {
            results.validate();
            return results;
        }
        
        output = (!output)? startNodeId.concat('-', endNodeId) : output.concat('-', endNodeId);			            
        results.travelCost += travelCost;
    }
    
    results.validate(output);		
    return results;
} //end findTravelPath

/**
* Finds all the travel paths by start and end node 
* @param {object} [args] - list of arguments used by function
*  
* @param {string} [args.startNodeId] - start node for path (REQUIRED)
* @param {string} [args.endNodeId] - end node for path	(REQUIRED)
* @param {boolean} [args.shortestRoute] - flag for the shortest route (OPTIONAL)
* @param {function} [args.condition] -  function(conditionArgs){return boolean;} (OPTIONAL)
* 
* @param {number} [conditionArgs.travelStops] - number of nodes (stops) in the travel path
* @param {number} [conditionArgs.travelCost] - travel cost of the current path
*/
function findAllTravelPathsByNodes(args, parent) {    
    var startNodeId = args.startNodeId;
    var endNodeId = args.endNodeId;
    var path = startNodeId;
    
    var results = new GraphResults('Starting with '+startNodeId+' and ending with '+endNodeId, /*outputIsArray*/ true);
    
    // Ensures condition is available
    if(!args.condition || typeof args.condition != 'function') {       
        if(args.shortestRoute) {
            args.condition = function(conditionArgs) {return args.shortestRoute;};
        } else {
            results.message = "args.condition != function(conditionArg){return boolean}";
            return results;
        } 
    }
    
    var node = parent.route.graph.get(startNodeId);
    node.forEach(function(childNodeCost,childNodeId,thisMap){
         var travelResults = findAllTravelPathsRecursively({
             shortestRoute: args.shortestRoute,
             parent: parent,
             targetNodeId: endNodeId,
             startNodeId: childNodeId,
             condition: args.condition,
             path: path.concat('-',childNodeId)
         });
         
         travelResults.forEach(function(childNode, childIndex, thisArray){
             results.output.push(childNode.output);
             results.travelCost.push(childNode.travelCost);
         });
    }); // end forEach
    
    results.validate();
    
    if(args.shortestRoute && typeof results.output != 'string' && results.output.length > 0) {
        results.consolidated.sort(
            function(left,right){
                return parseInt(left.travelStops)>=parseInt(right.travelStops);
        });
        return results.consolidated[0];
    } // end if
    
    return results;
}; //end findAllTravelPathsByNodes

/**
* Finds all the travel paths using recusion
* @param {object} [args] - list of arguments used by function
*  
* @param {object} [args.parent] - calling object (REQUIRED)
* @param {string} [args.targetNodeId] - the target node in the graph (REQUIRED)
* @param {string} [args.startNodeId] - start position in the graph (REQUIRED)
* @param {string} [args.path] - travel path used for routing checking (REQUIRED)
* @param {function} [args.condition] -  function(conditionArgs){return boolean;} (REQUIRED)
* 
* @param {number} [conditionArgs.travelStops] - number of nodes (stops) in the travel path
* @param {number} [conditionArgs.travelCost] - travel cost of the current path
*/
function findAllTravelPathsRecursively(args) {
    var results = [];
    var node = args.parent.route.graph.get(args.startNodeId);
    
    // TODO: forEach doesn't allow breaks. Use iterator to break
    node.forEach(function(childeNodeCost,childNodeId,thisMap) {
        var travelPath = args.path.concat('-',childNodeId);
        
        var passedConditionCheck = true;        
        if(childNodeId == args.targetNodeId) {
            var travelResults = findTravelPath(travelPath, args.parent);
            if(travelResults.valid && (passedConditionCheck = args.condition({travelStops: travelResults.travelStops, travelCost: travelResults.travelCost}))) {
                results = results.concat(travelResults);
            } // end if
        } // end if
        
        // Use to detect repeating patterns in travel path
        var regExp = new RegExp(travelPath.substr(travelPath.length-3), 'g');
        var matches = travelPath.match(regExp);
        
        if((args.shortestRoute && matches.length < 2) ||
          (!args.shortestRoute && (passedConditionCheck || matches.length < 2))) {
            var tmp = findAllTravelPathsRecursively({
                shortestRoute: args.shortestRoute,
                parent: args.parent, 
                targetNodeId: args.targetNodeId, 
                startNodeId: childNodeId, 
                condition: args.condition, 
                path: travelPath
            });
            
            results = results.concat(tmp);
        } // end if
    }); // end forEach
    
    return results;
}; // end findAllTravelPathsRecursively

function OrgiCStar() {
    this.route = new GRAPH();
}

/**
* Initialize the graph with nodes
*
* @param {string} [path] - comma delimited string of path with cost. AB2,BC2,AC1...
*/
OrgiCStar.prototype.initializeGraph = function(path) {
    var graphData = path.split(','); // Use regular expression to split

    if(graphData.length == 0)  {
        return false;
    }
    
    for(var i=0; i<graphData.length; i++) {
        var data = graphData[i].trim();
        
        var travelCost = -1;
        if(data.length != 3 || isNaN(travelCost = parseInt(data[2]))) {
            console.log(data + ' not properly formatted as LetterLetterNumber');
            return false;
        } // end if

        var startNode = data[0].toUpperCase();
        var endNode = data[1].toUpperCase();
        
        var node = this.route.graph.get(startNode);
        if(!node) {			
            var entry = new Map();			// This ensures the variable value
            entry[endNode] = travelCost; 	// of endNode is used as Map key
            
            this.route.addNode(startNode, entry);
        } else if(!node.get(endNode)) {
            node.set(endNode, travelCost);
        } // end if-else			
    } // end for loop
    
    return true;
} // end initializeGraph

/**
* Calculates the travel route using the path.
*/
OrgiCStar.prototype.routePath = function(args) {
    if(typeof args == 'string')
        return findTravelPath(args, this);
    
    if(!args.startNodeId || !args.endNodeId)
        return null;
        
     return findAllTravelPathsByNodes(args, this);
};

module.exports = OrgiCStar;