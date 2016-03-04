'use strict';

const assert = require('assert');
const orgicstar = require('../lib/OrgiCStar');

const USER_INPUT = 'AB5, BC4, CD8, DC8, DE6, AD5, CE2, EB3, AE7';
const SUCCESS_MSG = 'Completed Successfully!';
const FAILURE_MSG = 'NO SUCH ROUTE';
	
describe('OrgiCStar test suite', function() {
	it('The distance of the route A-B-C is 9', function() {
		let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

		var actual = org.routeCompletePath('A-B-C');
		
		assert.ok(actual.valid);
		assert.equal(actual.message, SUCCESS_MSG);
		assert.equal(actual.travelCost, /*expect*/ 9);
	});

	it('The distance of the route A-D is 5', function() {
		let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

		var actual = org.routeCompletePath('A-D');
		
		assert.ok(actual.valid);
		assert.equal(actual.message, SUCCESS_MSG);
		assert.equal(actual.travelCost, /*expect*/ 5);	
	});

	it('The distance of the route A-D-C is 13', function() {
  		let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

		var actual = org.routeCompletePath('A-D-C');
		
		assert.ok(actual.valid);
		assert.equal(actual.message, SUCCESS_MSG);
		assert.equal(actual.travelCost, /*expect*/ 13);
	});

	it('The distance of the route A-E-B-C-D is 22', function() {
  		let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

		var actual = org.routeCompletePath('A-E-B-C-D');
		
		assert.ok(actual.valid);
		assert.equal(actual.message, SUCCESS_MSG);
		assert.equal(actual.travelCost, /*expect*/ 22);
	});

	it('The distance of the route A-E-D is \'NO SUCH ROUTE\'', function() {
	  let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

		var actual = org.routeCompletePath('A-E-D');
		
		assert.ok(!actual.valid);
		assert.equal(actual.message, FAILURE_MSG);
		assert.equal(actual.travelCost, /*expect*/ 0);		
	});
	
	it('The number of trips starting at C and ending at C with a maximum of 3. Total paths 2', function() {
	  let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

        var args = {
            startNodeId:'C', 
            endNodeId:'C', 
            comparer: function(comparerArgs){return comparerArgs.nodesInPath<=3}
        };
        
		var actual = org.routeAllPathsThatStartEndWith(args);
		
		assert.ok(actual.valid);
		assert.equal(actual.message, SUCCESS_MSG);
		assert.equal(actual.numberOfTrips, /*expect*/ 2);		
	});
	
	it('The number trips starting at A and ending at C with a exactly 4 stops. Total paths 3', function() {
	  let org = new orgicstar();
		org.initializeGraph(USER_INPUT);

        var args = {
            startNodeId:'A', 
            endNodeId:'C', 
            comparer: function(comparerArgs){return comparerArgs.nodesInPath==4;}
        };
        
		var actual = org.routeAllPathsThatStartEndWith(args);
		
		assert.ok(actual.valid);
		assert.equal(actual.message, SUCCESS_MSG);
		assert.equal(actual.numberOfTrips, /*expect*/ 3);		
	});
	
	it('The length of the shortest route (in terms of distance to travel) from A to C.', function(){
        // TODO: In terms of stops or cost?????
        let org = new orgicstar();
        org.initializeGraph(USER_INPUT);

        var args = {
            startNodeId:'A', 
            endNodeId:'C', 
            shortestRoute: true         
        };

        var actual = org.routeAllPathsThatStartEndWith(args);

        assert.ok(actual.valid);
        assert.equal(actual.message, SUCCESS_MSG);
        assert.equal(actual.output, 'A-B-C');
        assert.equal(actual.travelStops, /*expect*/ 2);        
	});
	
	it('The length of the shortest route (in terms of distance to travel) from B to B.', function(){
		// TODO: In terms of stops or cost?????
        let org = new orgicstar();
        org.initializeGraph(USER_INPUT);

        var args = {
            startNodeId:'B', 
            endNodeId:'B', 
            shortestRoute: true         
        };

        var actual = org.routeAllPathsThatStartEndWith(args);

        assert.ok(actual.valid);
        assert.equal(actual.message, SUCCESS_MSG);
        assert.equal(actual.output, 'B-C-E-B');
        assert.equal(actual.travelStops, /*expect*/ 3);
	});
	
	it('The number of different routes from C to C with a distance of less than 30.', function(){
		// In the sample data, the trips are: CDC, CEBC, CEBCDC, CDCEBC, CDEBC, CEBCEBC, CEBCEBCEBC.
		assert.ok(false);
	}); 
});
