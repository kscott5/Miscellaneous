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
};

function routeAllPaths(args, parent) {
    var prefixPath = '';
    if(args.prefixPath && args.prefixPath.trim().length > 0) { 
        prefixPath = args.prefixPath.trim().concat('-').toUpperCase(); 
    }
    
    var startNodeId = args.startNodeId.toUpperCase();
    var endNodeId = args.endNodeId.toUpperCase();

    var results = new GraphResults('Starting at %0 and endings at %1'.replace('%0', startNodeId).replace('%1', endNodeId), /*outputIsArray*/ true);	
    
    var node = parent.route.graph.get(startNodeId);
    if(!node) {
        results.message = "%0 does not exist a node in the graph!".replace("%0",startNodeId);
        return results;
    }
    
    // Loop through the node in the graph
    node.forEach(function(nodeVale, nodeId, thisMap) {
        // Use dijkstra algorithm to compute the travel path
        var travelPath = parent.route.path(nodeId, endNodeId);
        if(!travelPath) return;
        
        travelPath = travelPath.toString(); // Convert array to string
        if(!travelPath.endsWith(endNodeId)) return;	// travel path doesn't end with end node id		

        var userInput = prefixPath + startNodeId.concat('-', travelPath).replace(/,/g,'-'); // Build train specific user input
        travelPath = parent.routePath(userInput); // Now route the complete path
        
        // Save valid data to check later
        if(travelPath.valid) {                
            results.output.push(travelPath.output);				
            results.travelCost.push(travelPath.travelCost);
        }
    });
    
    return results;
}; // end _routeAllPaths

/**
* Calculates the cost for the routing the path through the graph
*
* @param {string} [route] - hypen delimited string of nodes (A-B-D-C) used to compute the cost
* 		of the route through the graph using each node. In this case A-B, B-D, D-C...
*/
function routeCompletePath(route, parent) {
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
} //end routeCompletePath

/**
* Calculates all the travel routes where start and end nodes are same
* @param {object} [args] - list of arguments used by function
*  
* @param {string} [args.startNodeId] - start node for path (REQUIRED)
* @param {string} [args.endNodeId] - end node for path	(REQUIRED)
* @param {string} [args.prefixPath] - a path that used to suppliment search ex. A-B-C (OPTIONAL)
* @param {boolean} [args.shortestRoute] - flag for the shortest route (OPTIONAL)
* @param {function} [args.condition] -  function(conditionArgs){return boolean;} (OPTIONAL)
* 
* @param {number} [conditionArgs.nodesInPath] - number of nodes in the path
* @param {number} [conditionArgs.travelCost] - travel cost of the current path
*/
function routeTravelPathsWithSameNodes(args, parent) {
    // NOTE: It's a special case when the start node equals end node.
    // We must use pattern recognization WITH condition function to
    // prevent infinite looping
    if(!args.shortestRoute && (!args.condition || typeof args.condition != 'function')) 
        return null;

    var results = routeAllPaths(args, parent);
    
    // Have data to check now
    if(results.travelCost.length > 0) {
        for(var i=0; i<results.output.length; i++){
            var endNodeId = results.output[i]; // ex. C-D-C
            
            for(var j=0; j<results.output.length; j++){
                var startNodeId = results.output[j]; // ex. C-D-C
                startNodeId = startNodeId.substr(1, startNodeId.length); // ex. -D-C
                startNodeId = startNodeId.split('-').reverse().join('-'); // ex. C-D-
             
                var travelPath = routeCompletePath(startNodeId.concat(endNodeId), parent);
                if(travelPath.valid && (args.shortestRoute || args.condition({travelCost: travelPath.travelCost}))) {
                    results.output.push(travelPath.output);
                    results.travelCost.push(travelPath.travelCost);
                }
            } // end for j
        } // end for i
    } // end if		
    
    results.validate();
    
    if(args.shortestRoute && typeof results.output != 'string' && results.output.length > 0) {
        results.consolidated.sort(function(left,right){return left.input>right.input;});
        return results.consolidated[0];
    }
    
    return results;
}; //end routeTravelPathsWithSameNodes

/**
* Calculates all the travel routes where start and end nodes are different
* @param {object} [args] - list of arguments used by function
*  
* @param {string} [args.startNodeId] - start node for path (REQUIRED)
* @param {string} [args.endNodeId] - end node for path	(REQUIRED)
* @param {string} [args.prefixPath] - a path that used to suppliment search ex. A-B-C (OPTIONAL)
* @param {boolean} [args.shortestRoute] - flag for the shortest route (OPTIONAL)
* @param {function} [args.condition] -  function(conditionArgs){return boolean;} (OPTIONAL)
* 
* @param {number} [conditionArgs.nodesInPath] - number of nodes in the path
* @param {number} [conditionArgs.travelCost] - travel cost of the current path
*/
function routeTravelPathsWithDifferentNodes(args, parent) {
    var results = routeAllPaths(args, parent);
    
    var startNodeId = args.startNodeId.toUpperCase();
    var endNodeId = args.endNodeId.toUpperCase();

    // Have data to check now
    if(results.travelCost.length > 0) {
        if(startNodeId != endNodeId) { // continuing looking      
            var tmpOutput = [], tmpTravelCost = [];
            
            // Let's make sure we get all travel paths            
            for(var i=0; i<results.output.length; i++) {
                var travelPaths = routeTravelPathsWithDifferentNodes({
                    startNodeId: endNodeId, 
                    endNodeId: endNodeId,
                    prefixPath: results.output[i]
                }, parent);
            
                tmpOutput = tmpOutput.concat(travelPaths.output);
                tmpTravelCost =tmpTravelCost.concat(travelPaths.travelCost);                                        
            } // end for loop
            
            results.output = results.output.concat(tmpOutput); // When array is empty [] it does nothing
            results.travelCost = results.travelCost.concat(tmpTravelCost); // When array is empty [] it does nothing
        } // end if continuing looking
        
        // Do we have a condition function to use
        if(args.condition && typeof args.condition == 'function') {
            var output = [], travelCost = [];
        
            for(var i=0; i<results.output.length; i++) {
                var conditionArgs = {
                    nodesInPath: results.output[i].split('-').length-1
                };
                
                if(args.condition(conditionArgs)) {
                    output.push(results.output[i]);
                    travelCost.push(results.travelCost[i]);
                }
            }
            
            results.output = output;
            results.travelCost = travelCost;
        } // end if (condition)            
    } // end if		
    
    results.validate();
    
    if(args.shortestRoute && typeof results.output != 'string' && results.output.length > 0) {
        results.consolidated.sort(function(left,right){return left.input>right.input;});
        return results.consolidated[0];
    }
    
    return results;
}; //end routeTravelPathsWithDifferentNodes

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
        }

        var startNode = data[0].toUpperCase();
        var endNode = data[1].toUpperCase();
        
        var node = this.route.graph.get(startNode);
        if(!node) {			
            var entry = new Map();			// This ensures the variable value
            entry[endNode] = travelCost; 	// of endNode is used as Map key
            
            this.route.addNode(startNode, entry);
        } else if(!node.get(endNode)) {
            node.set(endNode, travelCost);
        }			
    }
    
    return true;
} // end initializeGraph

/**
* Calculates the travel route using the path.
*/
OrgiCStar.prototype.routePath = function(args) {
    if(typeof args == 'string')
        return routeCompletePath(args, this);
    
    if(!args.startNodeId || !args.endNodeId)
        return null;
        
    if(args.startNodeId != args.endNodeId)
        return routeTravelPathsWithDifferentNodes(args, this);
    else
        return routeTravelPathsWithSameNodes(args, this);
};

module.exports = OrgiCStar;