/**
 * A mathematical interval with two fixed upper and lower bounds.
 * @see {@link https://en.wikipedia.org/wiki/Interval_(mathematics)}
 * @class
 */
export default class Interval extends Float64Array{
	/**
	 * Constants denoting which of the interval's endpoints, if any,
	 * are to be excluded from the set's values during iteration.
	 * @enum {Number}
	 * @readonly
	 */
	static Exclusions = Object.freeze({
		__proto__: null,
		CLOSED:     0,
		LEFT_OPEN:  1,
		RIGHT_OPEN: 2,
		OPEN:       3,

		// Aliased constants
		NONE:  0,
		LEFT:  1,
		RIGHT: 2,
		BOTH:  3,

		/**
		 * Normalise an endpoint exclusion spec into an integer.
		 * @throws {RangeError} Endpoint exclusion spec exceeds legal range
		 * @param {Boolean|Number} value
		 * @return {Number}
		 * @internal
		 */
		parse(value){
			if("boolean" === typeof value)
				value = value ? this.BOTH : this.NONE;
			value = parseInt(value, 10);
			if(value < this.NONE || value > this.BOTH){
				const msg = "Endpoint exclusion spec exceeds legal range";
				throw new RangeError(`${msg} [${this.NONE}-${this.BOTH}]`);
			}
			return value;
		},
	});


	/**
	 * Initialise a new Interval object.
	 *
	 * @param {Number} min - Lower bound
	 * @param {Number} max - Upper bound
	 * @param {Number} [step=1]
	 *    Distance between yielded values during iteration.
	 * @param {Interval.Exclusions} [exclude=false] - Endpoint exclusion rules,
	 *    which may be a bitmask of {@link Interval.Exclusions} constants, or a
	 *    boolean value which is equivalent to excluding everything (if true),
	 *    and excluding nothing (if false).
	 * @constructor
	 */
	constructor(min, max, step = 1, exclude = false){
		if("boolean" === typeof step)
			[step, exclude] = [1, step];
		min = parseFloat(min);
		max = parseFloat(max);
		super([min, max]);
		this.step = step;
		this.exclusions = exclude;
	}


	// Section: Endpoints

	/**
	 * Whether the interval's bounds are excluded during iteration.
	 * @example [...new Interval(0, 4, false)] == [0, 1, 2, 3, 4];
	 * @example [...new Interval(0, 4, true)]  == [1, 2, 3];
	 * @property {Boolean}
	 */
	#exclusions = 0;
	get exclusions(){
		return this.#exclusions;
	}
	set exclusions(to){
		to = Interval.Exclusions.parse(to);
		this.#exclusions = to;
	}

	/**
	 * Whether the instance is a closed interval (both endpoints are included in its set).
	 * @property {Boolean}
	 * @readonly
	 */
	get isClosed(){
		return this.#exclusions === Interval.Exclusions.CLOSED;
	}

	/**
	 * Whether the instance is a fully-open interval (both endpoints excluded from its set).
	 * @property {Boolean}
	 * @readonly
	 */
	get isOpen(){
		return this.#exclusions === Interval.Exclusions.OPEN;
	}

	/**
	 * Whether the instance is a half-open interval (only one endpoint is excluded from its set).
	 * @property {Boolean}
	 * @readonly
	 */
	get isHalfOpen(){
		return !this.isOpen && (this.isLeftOpen || this.isRightOpen);
	}

	/**
	 * Whether the instance is an open interval or a half-open interval
	 * with its leftmost endpoint excluded from its set.
	 * @property {Boolean}
	 * @readonly
	 */
	get isLeftOpen(){
		return !!(this.#exclusions & Interval.Exclusions.LEFT_OPEN);
	}

	/**
	 * Whether the instance is an open interval or a half-open interval
	 * with its rightmost endpoint excluded from its set.
	 * @property {Boolean}
	 * @readonly
	 */
	get isRightOpen(){
		return !!(this.#exclusions & Interval.Exclusions.RIGHT_OPEN);
	}


	// Section: Bounds and cardinality

	/**
	 * Lower bound of interval. If set to a value greater than {@link #max},
	 * the interval will iterate in reverse order.
	 *
	 * @throws {TypeError} Cannot set lower bound to NaN
	 * @property {Number}
	 */
	get min(){
		return parseFloat(this[0]);
	}
	set min(to){
		if((to = parseFloat(to)) === this[0]) return;
		if(Number.isNaN(to))
			throw new TypeError("Cannot set lower bound to NaN");
		this[0] = to;
	}


	/**
	 * Upper bound of interval. If set to a value lower than {@link #min},
	 * the interval will iterate in reverse order.
	 *
	 * @throws {TypeError} Cannot set lower bound to NaN
	 * @property {Number}
	 */
	get max(){
		return parseFloat(this[1]);
	}
	set max(to){
		if((to = parseFloat(to)) === this[1]) return;
		if(Number.isNaN(to))
			throw new TypeError("Cannot set upper bound to NaN");
		this[1] = to;
	}


	/**
	 * Value to increment the next yielded value during iteration.
	 * Negative values cause the interval to iterate in reverse order.
	 *
	 * @throws {TypeError} Cannot set interval step to zero
	 * @property {Number}
	 */
	#step = 1;
	get step(){
		return this.#step;
	}
	set step(to){
		if((to = parseFloat(to)) === this.#step) return;
		if(!to) throw new TypeError("Cannot set interval step to zero");
		this.#step = to;
	}


	/**
	 * Whether the interval iterates backwards from its upper bound.
	 *
	 * If an interval has both a negative {@link #step} property *and* a {@link #min}
	 * greater than its {@link #max}, the two conditions cancel each other out and the
	 * interval will iterate in usual ascending order.
	 *
	 * @property {Boolean}
	 * @readonly
	 */
	get isReversed(){
		return !!(this.#step < 0 ^ this.min > this.max);
	}


	/**
	 * Whether one or both of the interval's bounds is set to infinity.
	 * @property {Boolean}
	 * @readonly
	 */
	get isUnbounded(){
		return !(isFinite(this.min) && isFinite(this.max));
	}


	// Section: Conversion to/from other formats

	/**
	 * Generate a bash(1)-style brace expansion pattern from the interval.
	 * @throws {RangeError} Cannot generate brace expansion string from unbounded interval
	 * @example new Interval(0, 12, 3) === "{0..12..3}";
	 * @return {String}
	 */
	toGlob(){
		if(!isFinite(this.min) || isFinite(this.max))
			throw new RangeError("Cannot generate brace expansion string from unbounded interval");
		const step = 1 !== this.step ? ".." + this.step : "";
		return `{${this.min}..${this.max}${step}}`;
	}


	/**
	 * Convert the interval object into a serialised JSON object.
	 * @return {Object}
	 */
	toJSON(){
		return {
			min:       isFinite(this.min) ? this.min : "-∞",
			max:       isFinite(this.max) ? this.max : "+∞",
			step:      this.step,
			openLeft:  this.isLeftOpen,
			openRight: this.isRightOpen,
		};
	}


	/**
	 * Deserialise a JSON-encoded interval object.
	 * @param {Object|String} src
	 * @return {Interval}
	 * @static
	 */
	static fromJSON(src){
		// Assume that string-type values are unparsed JSON source
		if("string" === typeof src)
			src = JSON.parse(src);

		// Assert that source is regular JSON object
		if(!("object" === typeof src && src))
			throw new TypeError(typeof src + " found where JSON object expected");

		// Assert that object contains exactly 5 fields
		const numKeys = Object.keys(src).length;
		if(5 !== numKeys)
			throw new TypeError("Expected 5 properties in serialised interval, found " + numKeys);

		// Assert that each expected field exists and has the correct type
		for(const key of "min max step openLeft openRight".split(" ")){
			if(!Object.hasOwn(src, key))
				throw new TypeError(`Serialised interval missing "${key}" property`);

			const value = src[key];
			if(key.startsWith("open") && "boolean" !== typeof value)
				throw new TypeError(`Non-boolean value assigned to ${key} property`);
			else if("number" !== typeof value){
				if(3 === key.length) // Min/max
					switch(value){
						case "+∞":
						case "∞":  src[key] = Number.POSITIVE_INFINITY; continue;
						case "-∞": src[key] = Number.NEGATIVE_INFINITY; continue;
					}
				throw new TypeError(`Invalid number assigned to ${key} property: ${value}`);
			}
		}

		// Now that we're done with that, construct an actual Interval instance
		const {min, max, step} = src;
		let exclude = 0;
		if(src.openLeft)  exclude |= Interval.Exclusions.LEFT_OPEN;
		if(src.openRight) exclude |= Interval.Exclusions.RIGHT_OPEN;
		return new Interval(min, max, step, exclude);
	}


	/**
	 * Return the {@link https://en.wikipedia.org/wiki/Set-builder_notation|set-builder notation}
	 * for this interval instance.
	 *
	 * @param {Boolean} [short=false] - Limit output to bracketed interval endpoints
	 * @example new Interval(2, 5, true).toString() === "(2, 5)";
	 * @example new Interval(1, 9, 1, 2).toString() === "(1, 9]";
	 * @return {String}
	 */
	toString(short = false){
		const min = isFinite(this.min) ? this.min : "-∞";
		const max = isFinite(this.max) ? this.max : "+∞";
		let str = "";
		str += this.isLeftOpen ? "(" : "[";
		str += min + ", " + max;
		str += this.isRightOpen ? ")" : "]";
		if(short) return str;
		str += ` = {𝑋 ∈ ${Math.trunc(this.step) === this.step ? "ℤ" : "ℝ"}`;

		// Resolve the predicate half of our set notation
		const pred = [];
		const cmp = [];
		if(isFinite(min))   cmp.push(min + " ≤ ");
		if(isFinite(max))   cmp.push(" ≤ " + max);
		if(cmp.length)      pred.push(cmp.join("𝑋"));
		if(1 !== this.step) pred.push(`𝑋 mod ${this.step} = 0`);
		if(pred.length)     str += " | " + pred.join(" ∧ ");

		str += "}";
		return str;
	}


	/**
	 * Return a colourful, pretty-printed representation of the interval.
	 * @return {String}
	 * @internal
	 */
	[Symbol.for("nodejs.util.inspect.custom")](depth, opts, inspect){
		const body = inspect({
			min:         this.min,
			max:         this.max,
			step:        this.step,
			isOpen:      this.isOpen,
			isHalfOpen:  this.isHalfOpen,
			isLeftOpen:  this.isLeftOpen,
			isRightOpen: this.isRightOpen,
			isClosed:    this.isClosed,
		}, {...opts, depth: opts.depth + 1}).replace(/^\{/, "[").replace(/\}$/, "]");
		return opts.stylize("Interval", "special") + " " + body;
	}


	/**
	 * Iterate over the interval, yielding values that are multiples of its {@link step}.
	 *
	 * Infinite values are permitted as endpoints, but only when used as the terminating
	 * endpoint. Trying to begin iteration from an infinite value is logically absurd;
	 * however, iterating *towards* an infinite value is possible, and will cause the
	 * interval to interate forever.
	 *
	 * @throws {RangeError} Iteration must begin with finite endpoint
	 * @return {Iterator}
	 * @yields {Number}
	 */
	*[Symbol.iterator](){
		let {min, max, step} = this;
		if(min === max){
			if(!this.isOpen)
				yield min;
			return;
		}
		if(min > max) [min, max] = [max, min];
		if(step < 0) step = -step;
		if(this.isLeftOpen)  min += step;
		if(this.isRightOpen) max -= step;

		const rev = this.isReversed;
		if(rev && !isFinite(max) || !rev && !isFinite(min))
			throw new RangeError("Iteration must begin with finite endpoint");
		if(rev) for(let i = max; i >= min; i -= step) yield i;
		else    for(let i = min; i <= max; i += step) yield i;
	}


	// Section: Iteration and TypedArray method overrides

	/**
	 * Generate an iterator function that yields values modified from those
	 * returned by the interval's normal {@link Symbol.iterator} method.
	 * @param {IteratorFilter} fn
	 * @return {Function}
	 * @api private
	 */
	#makeIteratorMethod(fn){
		/**
		 * Function called with a yielded value and its index.
		 * @callback IteratorFilter
		 * @param {*} value
		 * @param {Number} index
		 * @return {}
		 */
		return () => {
			const iteratorMethod = this[Symbol.iterator].bind(this);
			return Object.defineProperties({
				[Symbol.toStringTag]: "Interval Iterator",
				[Symbol.iterator](){
					const iterator = iteratorMethod();
					let index = 0;
					return {
						next(){
							const {done, value} = iterator.next();
							return done
								? {done: true}
								: {value: fn(value, index++)};
						},
					};
				},
			}, {
				[Symbol.toStringTag]: {writable: false, enumerable: false},
				[Symbol.iterator]:    {writable: false, enumerable: false},
			});
		};
	}


	/**
	 * Return an array of `[index, element]` pairs.
	 * @return {Iterator<Number[]>}
	 */
	entries = this.#makeIteratorMethod((value, index) => [index, value]);
	
	
	/**
	 * Return an array of indices for each interval element.
	 * @return {Iterator<Number>}
	 */
	keys = this.#makeIteratorMethod((value, index) => index);


	/**
	 * Return the interval's elements unchanged.
	 * @return {Iterator<Number>}
	 */
	values = this[Symbol.iterator];


	/**
	 * Return true if a predicate passes for every interval element.
	 * @param {Function} callback
	 * @param {Object} [thisArg=this]
	 * @return {Boolean}
	 */
	every(callback, thisArg = this){
		if(this.isUnbounded)
			throw new RangeError("Cannot test every element of an infinite-length set");
		return super.every.call([...this], callback, thisArg);
	}


	/**
	 * Raise an exception when attempting to “fill” the interval.
	 * @throws {Error}
	 * @return {void}
	 */
	fill(){
		throw new Error("Cannot fill interval object; not a true array");
	}

	/**
	 * Return true if the supplied value falls between the interval's endpoints.
	 * @param {Number} value
	 * @param {Boolean} [matchStep=false]
	 *    Require value to be a multiple of {@link #step} in
	 *    addition to satisfying the usual range criteria.
	 * @return {Boolean}
	 */
	includes(value, matchStep = false){
		if(matchStep && value % this.step)
			return false;
		return (
			(this.isLeftOpen  ? value > this.min : value >= this.min) &&
			(this.isRightOpen ? value < this.max : value <= this.max)
		);
	}
}
Object.defineProperties(Interval, {
	Exclusions: {
		writable: false,
		enumerable: false,
	},
});
