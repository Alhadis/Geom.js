import Point from "./point.mjs";

/**
 * A point in 3D space connecting {@link Edge} objects,
 * created by {@link Shape} instances upon construction.
 * @internal
 * @class
 */
class Vertex extends Point{
	
	/**
	 * Construct a vertex connected to one or two edges.
	 *
	 * @example new Vertex(10, 2.5, 50, e1, e2); // Midpoint
	 * @example new Vertex(10, 2.5, 50, e1);     // Endpoint
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {Edge} [edgeIn]
	 * @param {Edge} [edgeOut]
	 *
	 * @example new Vertex([10, 2, 5], e1, e2);
	 * @param {Pointy} point
	 * @param {Edge} [edgeIn]
	 * @param {Edge} [edgeOut]
	 * @constructor
	 */
	constructor(x, y, z, edgeIn, edgeOut){
		if(Array.isArray(x) || x instanceof Point){
			edgeIn  = y;
			edgeOut = z;
			[x, y = 0, z = 0] = x;
		}
		super(x, y, z);
		this.#assertEdge(this.#edgeIn  = edgeIn  || null, true);
		this.#assertEdge(this.#edgeOut = edgeOut || null, true);
	}
	
	
	/**
	 * Raise an exception if the argument isn't an {@link Edge} object.
	 * @throws {TypeError}
	 * @param {*} value
	 * @param {Boolean} [allowNull=false]
	 * @return {void}
	 */
	#assertEdge(value, allowNull = false){
		if((allowNull && null === value) || value instanceof Edge) return;
		throw new TypeError("Invalid edge object");
	}
	
	
	/**
	 * The vertex's incoming {@link Edge} segment.
	 * @property {Edge} edgeIn
	 */
	#edgeIn = null;
	get edgeIn(){ return this.#edgeIn; }
	set edgeIn(to){
		if((to ||= null) === this.#edgeIn) return;
		this.#assertEdge(to);
		const from = this.#edgeIn;
		this.#edgeIn = to;
		this.#notify({from, to}, "edgeIn");
	}
	
	
	/**
	 * The vertex's outgoing {@link Edge} segment.
	 * @property {Edge} edgeOut
	 */
	#edgeOut = null;
	get edgeOut(){ return this.#edgeOut; }
	set edgeOut(to){
		if((to ||= null) === this.#edgeOut) return;
		this.#assertEdge(to);
		const from = this.#edgeOut;
		this.#edgeOut = to;
		this.#notify({from, to}, "edgeIn");
	}
	
	
	/**
	 * True if the vertex lacks an incoming or an outgoing edge.
	 * @property {Boolean} isEndpoint
	 * @readonly
	 */
	get isEndpoint(){
		return null === this.#edgeIn || null === this.#edgeOut;
	}
	
	
	/**
	 * True if the vertex lacks both an incoming and outgoing edge.
	 * @property {Boolean} isIsolated
	 * @readonly
	 */
	get isIsolated(){
		return null === this.#edgeIn && null === this.#edgeOut;
	}
	
	
	/**
	 * Trigger subscription callbacks when edges are connected or disconnected.
	 * @param {{from: ?Edge, to: ?Edge}} change
	 * @param {String} property
	 * @return {this}
	 * @internal
	 */
	#notify(change, property){
		for(const fn of this.callbacks)
			fn.call(this, {...change}, property);
		return this;
	}
}


/**
 * A line segment connecting two points in 3D space.
 * @internal
 * @class
 */
class Edge{
	#start = null;
	#end   = null;
	
	/**
	 * Initialise an edge segment while building a {@link Shape}.
	 * @param {Shape}  shape
	 * @param {Vertex} start
	 * @param {Vertex} end
	 * @constructor
	 */
	constructor(shape, start, end){
		this.#assertVertex(this.#start = start || null, true);
		this.#assertVertex(this.#end   = end   || null, true);
		Object.defineProperty(this, "shape", {value: shape});
		this.#start.edgeOut = this;
		this.#end  .edgeIn  = this;
	}
	
	
	/**
	 * Raise an exception if the argument isn't a {@link Vertex} object.
	 * @throws {TypeError}
	 * @param {*} value
	 * @param {Boolean} [allowNull=false]
	 * @return {void}
	 */
	#assertVertex(value, allowNull = false){
		if((allowNull && null === value) || value instanceof Vertex) return;
		throw new TypeError("Invalid vertex object");
	}
	
	
	/**
	 * The initial vertex the edge is connected to.
	 * @property {Vertex}
	 * @readonly
	 */
	get start(){
		return this.#start;
	}
	set start(to){
		if((to ||= null) === this.#start) return;
		this.#assertVertex(to);
		const from = this.#start;
		this.#start = to;
		this.#start.edgeOut = this;
		if(from) from.edgeOut = null;
		this.#notify({from, to}, "start");
	}
	
	
	/**
	 * The last vertex the edge is connected to.
	 * @property {Vertex}
	 * @readonly
	 */
	get end(){
		return this.#end;
	}
	set end(to){
		if((to ||= null) === this.#end) return;
		this.#assertVertex(to);
		const from = this.#end;
		this.#end = to;
		this.#end.edgeIn = this;
		if(from) from.edgeIn = null;
		this.#notify({from, to}, "end");
	}
	
	
	/**
	 * Trigger subscription callbacks when modifying vertex connections.
	 * @param {{from: ?Vertex, to: ?Vertex}} change
	 * @param {String} property
	 * @return {this}
	 * @internal
	 */
	#notify(change, property){
		for(const fn of this.callbacks)
			fn.call(this, {...change}, property);
		return this;
	}
}


/**
 * A [polygonal chain]{@link https://en.wikipedia.org/wiki/Polygonal_chain} in 3D space.
 * @class
 */
export default class Shape{
	render  = Shape.render?.bind(this) || null;
	#points = [];
	#edges  = [];

	/**
	 * Construct a shape by connecting the given points.
	 * @example new Shape([[0, 0], [10, 10]]);
	 * @param {Pointy[]} points
	 * @param {Boolean} [closed=false]
	 * @constructor
	 */
	constructor(points, closed = false){
		const {length} = points;
		if(length < 2)
			throw new TypeError("Insufficient vertices to draw a shape");
		
		for(let edge, i = 0; i < length; ++i){
			const vertex = new Vertex(points[i], edge);
			this.#points.push(vertex);
			if(i > 0){
				edge = new Edge(this, this.#points[i - 1], vertex);
				this.#edges.push(edge);
			}
		}
		closed && this.#edges.push(new Edge(this,
			this.#points[length - 1],
			this.#points[0],
		));
	}
	
	
	/**
	 * The lowest point-coordinate on the X axis.
	 * @property {Number} x
	 */
	get x(){
		let min = Infinity;
		for(const {x} of this.#points)
			if(x < min) min = x;
		return min;
	}
	set x(to){
		const {x} = this;
		if(!isFinite(to = Number(to)) || to === x) return;
		const diff = to - x;
		for(const point of this.#points)
			point.x += diff;
	}
	
	
	/**
	 * The lowest point-coordinate on the Y axis.
	 * @property {Number} y
	 */
	get y(){
		let min = Infinity;
		for(const {y} of this.#points)
			if(y < min) min = y;
		return min;
	}
	set y(to){
		const {y} = this;
		if(!isFinite(to = Number(to)) || to === y) return;
		to -= y;
		for(const point of this.#points)
			point.y += to;
	}
	
	
	/**
	 * The lowest point-coordinate on the Z axis.
	 * @property {Number} z
	 */
	get z(){
		let min = Infinity;
		for(const {z} of this.#points)
			if(z < min) min = z;
		return min;
	}
	set z(to){
		const {z} = this;
		if(!isFinite(to = Number(to)) || to === z) return;
		to -= z;
		for(const point of this.#points)
			point.z += to;
	}
	
	
	/**
	 * The length of the shape along its X axis.
	 * @property {Number} width
	 * @readonly
	 */
	get width(){
		const [min, max] = this.#getBounds(0);
		return max - min;
	}


	/**
	 * The length of the shape along its Y axis.
	 * @property {Number} height
	 * @readonly
	 */
	get height(){
		const [min, max] = this.#getBounds(1);
		return max - min;
	}


	/**
	 * The length of the shape along its Z axis.
	 * @property {Number} depth
	 * @readonly
	 */
	get depth(){
		const [min, max] = this.#getBounds(2);
		return max - min;
	}
	
	
	/**
	 * Measure the length of the shape along a specific axis.
	 * @param {Number|String} [axis=0]
	 * @return {Number[]}
	 */
	#getBounds(axis = 0){
		let min = Infinity, max = -Infinity;
		for(const point of this.#points){
			const v = point[axis];
			if(v < min) min = v;
			if(v > max) max = v;
		}
		return [min, max];
	}
	
	
	/**
	 * Return a copy of the shape's {@link Point} list.
	 * @property {Point[]} points
	 * @readonly
	 */
	get points(){
		return this.#points.slice();
	}
	
	
	/**
	 * Return a copy of the shape's {@link Edge} list.
	 * @property {Edge[]} edges
	 * @readonly
	 */
	get edges(){
		return this.#edges.slice();
	}
	
	
	/**
	 * Iterate over each entry of the shape's {@link #points} array.
	 * @yields {Point}
	 */
	*[Symbol.iterator](){
		yield* this.#points;
	}
}
