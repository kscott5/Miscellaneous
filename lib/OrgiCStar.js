'use strict';

const GRAPH = require('node-dijkstra');

const NO_SUCH_ROUTE_MSG = 'NO SUCH ROUTE';
const SUCCESS_MSG = "Completed Successfully!"

class GraphResults {
	constructor(input, outputIsArray) {
		this.input = input;
		this.output = (!outputIsArray)? input: [];
		this.message = '';
		this.numberOfTrips = 0;
		this.travelCost = (!outputIsArray)? 0: [];
		this.travelStops = 0;
		this.valid = false;
	}

	validate() {
		var self = this;
		self.travelStops = 0;
       
       self.valid = self.output.length > 0;
       
		switch(typeof this.output) {
			case 'string':
				self.travelStops = self.output.split('-').length-1;
                self.numberOfTrips = 1;
				break;
			default:
				self.travelStops = [];
				self.output.forEach(function(node, index){					
					self.travelStops[index] = node.split('-').length-1;
				});
                
                self.numberOfTrips = self.output.length;
				break;				
		}
        
        self.message = NO_SUCH_ROUTE_MSG;
        if(self.valid) self.message = SUCCESS_MSG;
         
        return self.valid;
	}
}

class OrgiCStar {
	/**
	* constructor
	*/
	constructor() {
		this.route = new GRAPH();
	}

	/**
	* Initialize the graph with nodes
	*
	* @param {string} [userInput] - comma delimited string of path with cost. AB2,BC2,AC1...
	*/
	initializeGraph(userInput) {
		var graphData = userInput.split(','); // Use regular expression to split

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
	* Calculates the cost for the routing the path through the graph
	*
	* @param {string} [userInput] - hypen delimited string of nodes (A-B-D-C) used to compute the cost
	* 		of the route through the graph using each node. In this case A-B, B-D, D-C...
	*/
	routeCompletePath(userInput) {
		var inputTransformed = userInput.toUpperCase().split('-');	 // Use regular expression to split

		var results = new GraphResults(userInput);
		
		if(inputTransformed.length < 2) {
			results.validate();
			return results;
		}

		var endNode = '', self = this;
		inputTransformed.forEach(function(startNode,index, thisArray){
			if(index == thisArray.length-1) return;
			
			// Get start and end point for the user's route
			endNode = thisArray[index+1];
			
			var node = self.route.graph.get(startNode);
			var travelCost = node.get(endNode);
			if(!travelCost) {
				results.validate();
				return results;
			}
			
			results.travelCost += travelCost;
		});
		
		results.validate();		
		return results;
	} //end routeCompletePath
	
	/**
	* Calculates the the routes that start and end with the a node.
	* @param {object} [args] - list of arguments used by function
    *  
	* @param {string} [args.startNodeId] - start node for path (REQUIRED)
	* @param {string} [args.endNodeId] - end node for path	(REQUIRED)
	* @param {string} [args.prefixPath] - a path that used to suppliment search ex. A-B-C (OPTIONAL)
    * @param {function} [args.comparer] -  function(comparerArgs){return boolean;} (OPTIONAL)
    * 
    * @param {number} [comparerArgs.nodesInPath] - number of nodes in the path
	*/
	routeAllPathsThatStartEndWith(args) {
        var prefixPath = '';    
        if(args.prefixPath && args.prefixPath.trim().length > 0) { 
            prefixPath = args.prefixPath.trim().concat('-').toUpperCase(); 
        }
        
		var startNodeId = args.startNodeId.toUpperCase();
		var endNodeId = args.endNodeId.toUpperCase();

		var results = new GraphResults('Starting at %0 and endings at %1'.replace('%0', startNodeId).replace('%1', endNodeId), /*outputIsArray*/ true);	
		
		var node = this.route.graph.get(startNodeId);
		if(!node) {
			results.message = "%0 does not exist a node in the graph!".replace("%0",startNodeId);
			return results;
		}
		
		var self = this; // Used as helper for forEach call
        
        // Loop through the node in the graph
		node.forEach(function(nodeVale, nodeId, thisMap) {
            // Use dijkstra algorithm to compute the travel path
			var travelPath = self.route.path(nodeId, endNodeId);
			if(!travelPath) return;
			
			travelPath = travelPath.toString(); // Convert array to string
			if(!travelPath.endsWith(endNodeId)) return;	// travel path doesn't end with end node id		

            var userInput = prefixPath + startNodeId.concat('-', travelPath).replace(/,/g,'-'); // Build train specific user input
			travelPath = self.routeCompletePath(userInput); // Now route the complete path
            
            // Save valid data to check later
            if(travelPath.valid) {                
                results.output.push(travelPath.output);				
				results.travelCost.push(travelPath.travelCost);
			}
		});
	
        // Have data to check now
		if(results.travelCost.length > 0) {            
            if(startNodeId != endNodeId) { // continue looking
                var tmpOutput = [], tmpTravelCost = [];
                
                // Let's make sure we get all travel paths            
                for(var i=0; i<results.output.length; i++) {
                    var travelPaths = this.routeAllPathsThatStartEndWith({
                        startNodeId: endNodeId, 
                        endNodeId: endNodeId,
                        prefixPath: results.output[i].substr(0, results.output[i].length-2) // Last two character account for with the startNodeId
                    });
                
                    tmpOutput = tmpOutput.concat(travelPaths.output);
                    tmpTravelCost =tmpTravelCost.concat(travelPaths.travelCost);                                        
                } // end for loop
                
                results.output = results.output.concat(tmpOutput);
                results.travelCost = results.travelCost.concat(tmpTravelCost);
            } // end if (continue looking) 

            // Do we have a comparer function to use
            if(args.comparer && typeof args.comparer == 'function') {
                var output = [], travelCost = [];
            
                for(var i=0; i<results.output.length; i++) {
                    var comparerArgs = {
                        nodesInPath: results.output[i].split('-').length-1
                    };
                    
                    if(args.comparer(comparerArgs)) {
                        output.push(results.output[i]);
                        travelCost.push(results.travelCost[i]);
                    }
                }
                
                results.output = output;
                results.travelCost = travelCost;
            } // end if (comparer)            
		} // end if		
		
        results.validate();
		return results;
	} //end routeAllPathsThatStartEndWith
} //end class

module.exports = OrgiCStar;