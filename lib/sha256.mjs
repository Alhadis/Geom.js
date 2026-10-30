export default class SHA256{
	#bytes = new Uint8Array(32);
	#value = null;
	
	constructor(hash){
		for(let i = 0; i < 64; this.#bytes[~~(i / 2)] = parseInt(hash[i] + hash[i++], 16));
		this.#value = BigInt("0x" + hash);
	}
	
	toString(uppercase = false){
		const str = this.#value.toString(16);
		return uppercase ? str.toUpperCase() : str;
	}
	
	valueOf(){
		return this.#value;
	}
	
	toJSON(){
		return this.toString();
	}
	
	static [Symbol.hasInstance](instance){
		return (
			instance instanceof this   ||
			instance instanceof BigInt ||
			instance instanceof String
		);
	}
	
	[Symbol.toPrimitive](hint = "default"){
		switch(hint){
			default:
			case "string": return this.toString();
			case "number": return this.#value;
		}
	}
	
	[Symbol.for("nodejs.util.inspect.custom")](depth, opts){
		return opts.stylize(`SHA256 (${this})`, "symbol");
	}
	
	*[Symbol.iterator](){
		yield* this.#bytes;
	}
}

Object.defineProperties(SHA256, {
	NULL: {
		value: new SHA256("E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"),
		configurable: false,
		enumerable: true,
		writable: false,
	},
});
