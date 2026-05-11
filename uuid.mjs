export default class UUID{
	static #instances = new Map();
	#bytes = new Uint8Array(16);
	#value = "";
	
	/**
	 * Coerce various object types into a 32-digit hexadecimal string.
	 * @param {Object|Number|BigInt|String} [value=null]
	 * @return {String}
	 * @private
	 */
	static #normalise(value = null){
		if("object" === typeof value){
			if(null === value)               return "0".repeat(32);
			if(value instanceof this)        return value;
			if(value instanceof Number)      value = +value;
			else if(value instanceof String) value = `${value}`;
			else if(value instanceof BigInt) value = BigInt(value);
		}
		switch(typeof value){
			case "object":
				if(Symbol.iterator in value){
					const array = [];
					for(let item of value){
						item = "string" === typeof item ? parseInt(item, 16) : Number(item);
						if(!Number.isFinite(item) || item < 0 || item > 255 || ~~item !== item)
							throw new RangeError(`Invalid byte value: ${item}`);
						if(array.push(item) >= 16) break;
					}
					while(array.length < 16) array.push(0);
					return array.map(int => int.toString(16).padStart(2, "0")).join("");
				} // Fall-through
			default:
				throw new TypeError("Invalid UUID specifier");
			case "number":
				if(!Number.isFinite(value))      throw new RangeError("Numeric UUID initialiser must be finite value");
				if(!Number.isSafeInteger(value)) throw new RangeError("Numeric UUID initialiser falls outside safe range");
				if(value !== Math.trunc(value))  throw new RangeError("Numeric UUID initialiser must be an integer");
				if(value < 0)                    throw new RangeError("Numeric UUID initialiser must be a positive value");
				value ||= 0; // Fall-through
			case "bigint":
				value = BigInt(value);
				if(value > (1n << 128n))
					throw new RangeError("UUID string exceeds 128-bit range");
				return value.toString(16).padStart(32, "0");
			case "string":
				let radix = null;
				value = value.trim().toLowerCase();
				if(value.startsWith("{") && value.endsWith("}")
				|| value.startsWith("[") && value.endsWith("]"))
					value = value.slice(1, -1);
				if(value.endsWith("n"))
					value = value.slice(0, -1);
				switch(value.slice(0, 2)){
					case "0b": radix = 2;  break;
					case "0o": radix = 8;  break;
					case "0d": radix = 10; break;
					case "0x": radix = 16; break;
				}
				value = (null !== radix
					? value.slice(2)
					: value.endsWith("h")
						? value.slice(0, -1)
						: value)
					.replaceAll(" ", "")
					.replaceAll("-", "")
					.replaceAll("_", "")
					.replaceAll(".", "");
				value = parseInt(value, radix ?? 16);
				return value.toString(16).padStart(32, "0");
		}
	}
	
	constructor(value){
		value = UUID.#normalise(value);
		if(UUID.#instances.has(value))
			return UUID.#instances.get(value);
		this.#value = value;
		for(let i = 0; i < 32;){
			const a = value[i++];
			const b = value[i++];
			this.#bytes[i / 2] = parseInt(a + b, 16);
		}
		Object.freeze(this);
		UUID.#instances.set(value, this);
	}
	
	*[Symbol.iterator](){
		yield* this.#bytes;
	}
	
	get bytes(){
		return Array.from(this.#bytes);
	}
	
	toJSON(){
		return this.toString();
	}
	
	valueOf(){
		return BigInt(`0x${this.#value}`);
	}
	
	toString(groups = [8, 4, 4, 12], separator = "-"){
		if(!groups)
			return this.#value;
		let result = "";
		let offset = 0;
		for(const group of groups){
			if(result) result += separator;
			result += this.#value.slice(offset, offset += group);
		}
		if(result.length < 32)
			result += this.#value.slice(result.length);
		return result;
	}
	
	[Symbol.for("nodejs.util.inspect.custom")](depth, opts){
		return opts.stylize(`UUID {${this}}`, "symbol");
	}
}

Object.defineProperties(UUID, {
	NIL: {value: new UUID(0)},
	MAX: {value: new UUID((1n << 128n) - 1n)},
});
