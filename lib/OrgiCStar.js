'use strict';

const GRAPH = require('node-dijkstra');

const NO_SUCH_ROUTE = 'NO SUCH ROUTE';
const SUCCESS_MSG = "Completed Successfully!"

class GraphResults {
	constructor(input, outputIsArray) {
		this.input = input;
		this.output = (!outputIsArray)? '': [];
		this.message = '';
		this.travelCost = 0;
		this.travelStops = 0;
		this.valid = false;
	}

	calculateTravelStops() {
		var self = this;
		self.travelStops = 0;
		
		switch(typeof this.output) {
			case 'string':
				self.travelStops = self.output.split('-').length;
				break;
			default:
				self.travelStops = [];
				self.output.forEach(function(node, index){					
					self.travelStops[index] = node.split('-').length;
				});
				break;				
		}
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
	* @param {string} [userInput] - hypen delimited string of nodes (A-B-D) used to compute the cost
	* 		of the route through the graph using only the first and last node. In this case A and D.
	*/
	routePath(userInput) {
		var inputTransformed = userInput.toUpperCase().split('-');	 // Use regular expression to split

		var results = new GraphResults(userInput);
		results.message = NO_SUCH_ROUTE;
		
		if(inputTransformed.length < 2) {
			results.message = "2 nodes required!"
			return results;
		}
		
		// Get start and end point for the user's route
		var startNode = inputTransformed[0];
		var endNode = inputTransformed[inputTransformed.length-1];
		
		var routePathResults = this.route.path(startNode, endNode);
		results.output = routePathResults.toString().replace(/,/g,'-');
		
		if(routePathResults.length == 0 || inputTransformed.length != routePathResults.length) {		
			results.message = "The output path doesn't match the input path";
			return results;
		}
		
		for(var i=0; i<inputTransformed.length-1; i++) {
			var currNodeId = inputTransformed[i];
			var nextNodeId = inputTransformed[i+1];
			
			var node = this.route.graph.get(currNodeId);
			if(!node) {
				result.travelCost = 0;
				results.message = "Node (%0) doesn't existing in the output path".replace('%0',currNodeId);
				return results;
			}
			
			var travelCost = 0;
			if(!(travelCost = node.get(nextNodeId))) {
				result.travelCost = 0;
				results.message = "Node (%0) travel cost doesn't existing in the output path".replace('%0',nextNodeId);
				return results;
			}
			
			results.travelCost += travelCost;
		}
		
		results.calculateTravelStops();
		
		results.message = SUCCESS_MSG;
		results.valid = true;
		
		return results;
	} //end routePath
	
	/**
	* Calculates the cost for the routing the path through the graph
	*
	* @param {string} [userInput] - hypen delimited string of nodes (A-B-D-C) used to compute the cost
	* 		of the route through the graph using each node. In this case A-B, B-D, D-C...
	*/
	routeCompletePath(userInput) {
		var inputTransformed = userInput.toUpperCase().split('-');	 // Use regular expression to split

		var results = new GraphResults(userInput);
		
		results.message = NO_SUCH_ROUTE;
		if(inputTransformed.length < 2) {
			results.message = "2 nodes required!"
			return results;
		}

		var endNode = '', self = this;
		inputTransformed.forEach(function(startNode,index, thisArray){
			if(index == thisArray.length-1) return;
			
			// Get start and end point for the user's route
			endNode = thisArray[index+1];
			
			var routePathResults = self.route.path(startNode, endNode);
			if(!routePathResults ||routePathResults.length == 0) {	
				results.travelCost = 0;
				results.message = NO_SUCH_ROUTE;
				return results;
			}

			results.output = results.output.concat(startNode, '-');

			var node = self.route.graph.get(startNode);
			var travelCost = node.get(endNode);
			if(!travelCost) {
				results.travelCost = 0;
				results.message = NO_SUCH_ROUTE;
				return results;
			}
			
			results.travelCost += travelCost;
		});
		
		if(results.travelCost > 0) {
			results.output = results.output.concat(endNode); // Include final node
			results.message = "Completed Successfully!";
			results.valid = true;
		}
		
		results.calculateTravelStops();
		
		return results;
	} //end routeCompletePath
	
	/**
	* Calculates the the routes that start and end with the a node.
	*
	* @param {string} [startNodeId] - start node for path
	* @param {string} [endNodeId] - end node for path	
	* @param {function} [comparer] - function(nodesInPath){return boolean;}	
	*/
	routeAllPathsThatStartEndWith(startNodeId, endNodeId, comparer) {
		var comparerAvailable = (comparer && typeof comparer == 'function');
		
		startNodeId = startNodeId.toUpperCase();
		endNodeId = endNodeId.toUpperCase();

		var results = new GraphResults('Starting at %0 and endings at %1'.replace('%0', startNodeId).replace('%1', endNodeId), /*outputIsArray*/ true);	
		
		var node = this.route.graph.get(startNodeId);
		if(!node) {
			results.message = "%0 does not exist a node in the graph!".replace("%0",startNodeId);
			return results;
		}
		
		var self = this;		
		node.forEach(function(value, key, thisMap){
			var tmpResults = self.route.path(key, endNodeId);
			if(!tmpResults) return;
			
			tmpResults = tmpResults.toString();
			if(!tmpResults.endsWith(endNodeId)) return;			
			
			var nodesInPath = tmpResults.split(',').length+1;
			if(!comparerAvailable || comparer(nodesInPath)) {
				var output = startNodeId.concat('-', tmpResults);
					
				results.output.push(output.replace(/,/g,'-'));
				results.travelCost++;
			}
		});
	
		if(results.travelCost > 0) {
			results.valid = true;
			results.message = SUCCESS_MSG;
		}
		
		results.calculateTravelStops();
		
		return results;
	} //end routeAllPathsThatStartEndWith
} //end class

module.exports = OrgiCStar;