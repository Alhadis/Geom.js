export default class Angle extends Number {
	callbacks = new Set();
	
	
	/**
	 * Initialise a new angle.
	 * @param {Number} [value=0]
	 * @param {String} [unit="rad"]
	 * @constructor
	 */
	constructor(value = 0, unit = "rad"){
		super();
		this.radians = value;
	}
	
	
	toExponential(...args) { return super.toExponential .call(this.#value, ...args); }
	toFixed(...args)       { return super.toFixed       .call(this.#value, ...args); }
	toPrecision(...args)   { return super.toPrecision   .call(this.#value, ...args); }
	
	
	/**
	 * Angle value expressed in radians.
	 * @property {Number} radians
	 */
	#value = NaN;
	get radians(){
		return this.#value;
	}
	set radians(to){
		if(!isFinite(to = Number(to)) || to === this.#value)
			return;
		const from = this.#value;
		this.#value = to;
		this.#notify({from, to});
	}
	
	
	/**
	 * Angle value expressed in degrees.
	 * @property {Number} degrees
	 */
	get degrees(){
		return this.#value * 180 / Math.PI;
	}
	set degrees(to){
		to = Number(to) * Math.PI / 180;
		if(!isFinite(to) || to === this.#value)
			return;
		const from = this.#value;
		this.#value = to;
		this.#notify({from, to});
	}


	/**
	 * Angle value expressed in gradians.
	 * @property {Number} gradians
	 */
	get gradians(){
		return this.#value * (200 / Math.PI);
	}
	set gradians(to){
		to = Number(to) * (Math.PI / 200);
		if(!isFinite(to) || to === this.#value)
			return;
		const from = this.#value;
		this.#value = to;
		this.#notify({from, to});
	}
	
	
	/**
	 * Angle value expressed in turns.
	 * @property {Number} turns
	 */
	get turns(){
		return this.#value * (1 / (2 * Math.PI));
	}
	set turns(to){
		to = Number(to) * (2 * Math.PI);
		if(!isFinite(to) || to === this.#value)
			return;
		const from = this.#value;
		this.#value = to;
		this.#notify({from, to});
	}
	
	
	/**
	 * Is the normalised angle less than 90°?
	 * @property {Boolean} isAcute
	 * @readonly
	 */
	get isAcute(){
		return Math.abs(this.degrees) % 360 < 90;
	}
	
	
	/**
	 * Is the angle not a multiple of 90°?
	 * @property {Boolean} isOblique
	 * @readonly
	 */
	get isOblique(){
		return !!(this.degrees % 90);
	}
	
	
	/**
	 * Does the normalised angle fall between 90°–180° (exclusive)?
	 * @property {Boolean} isObtuse
	 * @readonly
	 */
	get isObtuse(){
		const value = Math.abs(this.degrees) % 360;
		return value > 90 && value < 180;
	}
	
	
	/**
	 * Does the normalised angle fall between 180°–360° (exclusive)?
	 * @property {Boolean} isReflex
	 * @readonly
	 */
	get isReflex(){
		const value = Math.abs(this.degrees) % 360;
		return value > 180 || !value;
	}
	
	
	/**
	 * Does the normalised angle equal 90°?
	 * @property {Boolean} isRightAngle
	 * @readonly
	 */
	get isRight(){
		return 90 === Math.abs(this.degrees) % 360; 
	}
	
	
	/**
	 * Does the normalised angle equal 180°?
	 * @property {Boolean} isStraight
	 * @readonly
	 */
	get isStraight(){
		return 180 === Math.abs(this.degrees) % 360;
	}
	
	
	/**
	 * Does the normalised angle equal 0°?
	 * @property {Boolean} isZeroAngle
	 * @readonly
	 */
	get isZero(){
		return !(Math.abs(this.degrees) % 360);
	}
	
	
	/**
	 * Return the angle's value as CSS.
	 * @example new Angle(Math.PI) === "180deg";
	 * @param {String} [unit="deg"]
	 * @return {String}
	 */
	toCSS(unit = "deg"){
		return this[this.#normaliseUnit(unit)] + unit;
	}
	
	
	/**
	 * Return a JSON-compatible representation of the angle.
	 * @return {String}
	 */
	toJSON(){
		return this.radians;
	}
	
	
	/**
	 * Return a human-readable representation of the angle.
	 * @example new Angle(Math.PI / 2).toString() === `90°`;
	 * @return {String}
	 */
	toString(){
		return `${this.degrees}°`;
	}
	
	
	/**
	 * Return a localised representation of the angle.
	 * @param {String|String[]} locales
	 * @param {Object} [options={}]
	 * @return {String}
	 */
	toLocaleString(locales, options = {}){
		return super.toLocaleString(locales, {
			unitDisplay: "narrow",
			...options,
			style: "unit",
			unit: "degree",
		});
	}
	
	
	/**
	 * Return the angle's internal value, stored in radians.
	 * @return {Number}
	 */
	valueOf(){
		return this.#value;
	}
	
	
	/**
	 * Convert the angle to a primitive value.
	 * @param {String} hint
	 * @return {Number|String}
	 */
	[Symbol.toPrimitive](hint){
		return "number" === hint
			? this.valueOf()
			: this.toString();
	}
	
	
	/**
	 * Resolve different spellings of an angular unit.
	 * @example normaliseUnit("Deg") === "degrees";
	 * @return {String}
	 * @internal
	 */
	#normaliseUnit(input){
		input = String(input).toLowerCase();
		switch(input.endsWith("s") ? input.slice(0, -1) : input){
			case "deg":  return "degrees";
			case "rad":  return "radians";
			case "grad": return "gradians";
			case "turn": return "turns";
			default: throw new TypeError(`Unrecognised unit: "${input}"`);
		}
	}
	
	
	/**
	 * Trigger all subscription callbacks.
	 * @param {{old: number, new: number}} change
	 * @internal
	 */
	#notify(change){
		for(const fn of this.callbacks)
			fn.call(this, change);
	}
}
