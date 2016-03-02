'use strict';

const GRAPH = require('node-dijkstra');

const NO_SUCH_ROUTE = 'NO SUCH ROUTE';
const SUCCESS_MSG = "Completed Successfully!"

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

		var results = {
			input: userInput,
			output: '',
			message: NO_SUCH_ROUTE,
			valid: false,
			cost: 0
		};
		
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
				result.cost = 0;
				results.message = "Node (%0) doesn't existing in the output path".replace('%0',currNodeId);
				return results;
			}
			
			var cost = 0;
			if(!(cost = node.get(nextNodeId))) {
				result.cost = 0;
				results.message = "Node (%0) cost doesn't existing in the output path".replace('%0',nextNodeId);
				return results;
			}
			
			results.cost += cost;
		}
		
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

		var results = {
			input: userInput,
			output: '',
			message: NO_SUCH_ROUTE,
			valid: false,
			cost: 0
		};
		
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
				results.cost = 0;
				results.message = NO_SUCH_ROUTE;
				return results;
			}

			results.output = results.output.concat(startNode, '-');

			var node = self.route.graph.get(startNode);
			var cost = node.get(endNode);
			if(!cost) {
				results.cost = 0;
				results.message = NO_SUCH_ROUTE;
				return results;
			}
			
			results.cost += cost;
		});
		
		if(results.cost > 0) {
			results.output = results.output.concat(endNode); // Include final node
			results.message = "Completed Successfully!";
			results.valid = true;
		}
		
		return results;
	} //end routeCompletePath
	
	/**
	* Calculates the the routes that start and end with the a node.
	*
	* @param {string} [startNodeId] - start node for path
	* @param {string} [endNodeId] - end node for path	
	* @param {function} [filterFunc] - function(nodesInPath){return boolean;}	
	*/
	routeAllPathsThatStartEndWith(startNodeId, endNodeId, filterFunc) {
		var funcAvailable = (filterFunc && typeof filterFunc == 'function');
		
		startNodeId = startNodeId.toUpperCase();
		endNodeId = endNodeId.toUpperCase();

		var node = this.route.graph.get(startNodeId);
		if(!node) {
			results.message = "%0 does not exist a node in the graph!".replace("%0",startNodeId);
			return results;
		}

		var results = {
			input: 'Starting at %0 and endings at %1'.replace('%0', startNodeId).replace('%1', endNodeId) ,
			output: [],
			message: NO_SUCH_ROUTE,
			valid: false,
			cost: 0
		};
		
		var self = this;		
		node.forEach(function(value, key, thisMap){
			var tmpResults = self.route.path(key, endNodeId);
			if(!tmpResults) return;
			
			tmpResults = tmpResults.toString();
			if(!tmpResults.endsWith(endNodeId)) return;			
			
			var nodesInPath = tmpResults.split(',').length+1;
			if(!funcAvailable || filterFunc(nodesInPath)) {
				var output = startNodeId.concat('-', tmpResults);
					
				results.output.push(output.replace(/,/g,'-'));				
				results.cost++;				
			}
		});
	
		if(results.cost > 0) {
			results.valid = true;
			results.message = SUCCESS_MSG;
		}
		
		return results;
	} //end routeAllPathsThatStartEndWith
} //end class

module.exports = OrgiCStar;