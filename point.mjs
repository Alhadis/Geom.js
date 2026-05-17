/** @typedef {Point|Number[]|{x: number, y: number, z: number}} Pointy */

/**
 * Cartesian coordinates representing a location in 3D space.
 * @class
 */
export default class Point extends Float64Array{

	/**
	 * Initialise a new point object.
	 *
	 * Existing {@link Point} objects will be returned as-is.
	 * To create a copy of another point, use {@link Point#copy}.
	 *
	 * @constructor
	 */
	constructor(x = 0, y = x, z = 0){
		if(x instanceof Point)
			return x;

		super(3);
		if("object" === typeof x && x){
			if(Symbol.iterator in x)
				[x = 0, y = x, z = 0] = x;
			else if("x" in x || "y" in x || "z" in x)
				({x, y, z = 0} = x);
			else throw new TypeError("Invalid coordinate source");
		}
		this[0] = x = Number(x);
		this[1] = y = Number(y);
		this[2] = z = Number(z);
		Object.defineProperty(this, "callbacks", {value: new Set()});
	}


	/**
	 * The point's abscissa (first axis).
	 * @property {Number} x
	 */
	get x(){ return this[0]; }
	set x(to){
		if(!isFinite(to = Number(to)) || to === this[0]) return;
		const from = this[0];
		this[0] = to;
		this.#notify({from, to}, "x");
	}


	/**
	 * The point's ordinate (second axis).
	 * @property {Number} y
	 */
	get y(){ return this[1]; }
	set y(to){
		if(!isFinite(to = Number(to)) || to === this[1]) return;
		const from = this[1];
		this[1] = to;
		this.#notify({from, to}, "y");
	}


	/**
	 * The point's applicate (third axis).
	 * @property {Number} z
	 */
	get z(){ return this[2]; }
	set z(to){
		if(!isFinite(to = Number(to)) || to === this[2]) return;
		const from = this[2];
		this[2] = to;
		this.#notify({from, to}, "z");
	}
	
	
	// Section: Coordinate transformation

	/**
	 * Force coordinates to their absolute values.
	 * @return {self}
	 */
	abs(){
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		this.z = Math.abs(this.z);
		return this;
	}


	/**
	 * Invert each coordinate value.
	 * @example new Point(24, 45).negate() == [-24, -45];
	 * @return {self}
	 */
	negate(){
		this.x = -this.x;
		this.y = -this.y;
		this.z = -this.z;
		return this;
	}


	/**
	 * Round each coordinate off to the nearest integral value.
	 * @param {Number} [precision=0]
	 * @return {self}
	 */
	round(precision = 0){
		for(let n, i = 0; i < 3, n = this[++i];)
			this[i] = n.toPrecision(Math.trunc(n).toString().length + precision);
		return this;
	}


	/**
	 * Set all coordinates simultaneously.
	 * @param {Number} [x=0]
	 * @param {Number} [y=x]
	 * @param {Number} [z=this.z]
	 * @return {self}
	 */
	set(x = 0, y = x, z = this.z){
		if("object" === typeof x && x)
			({x, y, z} = new Point(x));
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}


	/**
	 * Offset every coordinate simultaneously.
	 * @param {Number} [x=0]
	 * @param {Number} [y=x]
	 * @param {Number} [z=0]
	 * @return {self}
	 */
	translate(x, y = x, z = 0){
		if("object" === typeof x && x)
			({x, y, z} = new Point(x));
		this.x += x;
		this.y += y;
		this.z += z;
		return this;
	}


	/**
	 * Swap the values of two coordinates.
	 * @param {Number|String} [a=0] - Name/index of first axis
	 * @param {Number|String} [b=1] - Name/index of second axis
	 * @return {self}
	 */
	transpose(a = 0, b = 1){
		const x = this[a];
		const y = this[b];
		this.x = y;
		this.y = x;
		return this;
	}


	// Section: Comparison

	/**
	 * Compute the arctangent to another point.
	 * @param {Pointy} that
	 * @return {Number}
	 */
	angleTo(that){
		that = new Point(that);
		return 180 * Math.atan2(
			that.y - this.y,
			this.x - that.x,
		) / Math.PI;
	}


	/**
	 * Determine if point matches another point's coordinates.
	 * @param {Pointy} that
	 * @return {Boolean}
	 */
	isEqualTo(that){
		that = new Point(that);
		return (
			this.x === that.x &&
			this.y === that.y &&
			this.z === that.z
		);
	}


	/**
	 * Compute the distance to another point.
	 * @param {Pointy} that
	 * @return {Number}
	 */
	distanceTo(that){
		that = new Point(that);
		return Math.sqrt(
			(that.x - this.x) ** 2 +
			(that.y - this.y) ** 2 +
			(that.z - this.z) ** 2
		);
	}


	// Section: Misc

	/**
	 * Return a copy of the point object.
	 * @return {Point}
	 */
	copy(){
		return new Point(this.x, this.y, this.z);
	}


	/**
	 * Return the coordinates in parenthetical “(x, y, z)” form.
	 * @return {String}
	 */
	toString(){
		return `(${this.x}, ${this.y}, ${this.z})`;
	}


	/**
	 * Return a more self-documenting object for JSON encoding.
	 * @example JSON.stringify(new Point(10, 0)) === '{"x":10,"y":0,"z":0}';
	 * @return {String}
	 */
	toJSON(){
		return {x: this.x, y: this.y, z: this.z};
	}


	/**
	 * Trigger all subscription callbacks.
	 * @param {{from: number, to: number}} change
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
